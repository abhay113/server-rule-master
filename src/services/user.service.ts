import axios from 'axios';
import config from '../config/keycloak.config';
import { KeycloakService } from './keycloak.service';
import { OnboardUser, User } from '../types/interface.types';

export class UserService {
    private static keycloakBase = `${config.keycloakUrl}/admin/realms/${config.realm}`;

    // Create a new Keycloak user and return the user's ID
    static async createUser(user: User): Promise<string> {
        const headers = await KeycloakService.getAuthHeaders();

        const userPayload = {
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            enabled: true,
            credentials: [
                {
                    type: 'password',
                    value: user.password,
                    temporary: false,
                },
            ],
        };

        console.log('Creating user:', userPayload);

        try {
            await axios.post(`${this.keycloakBase}/users`, userPayload, { headers });
            console.log('User created successfully');

            // Retrieve user ID by querying the username
            const users = await axios.get(`${this.keycloakBase}/users?username=${user.username}`, { headers });

            if (!users.data || users.data.length === 0) {
                throw new Error(`User ${user.username} not found after creation`);
            }

            return users.data[0].id;
        } catch (error: any) {
            if (error.response?.status === 409) {
                console.log(`User ${user.username} already exists, retrieving ID`);
                const users = await axios.get(`${this.keycloakBase}/users?username=${user.username}`, { headers });
                return users.data[0].id;
            }
            throw error;
        }
    }

    // Get or create a group by name
    static async getOrCreateGroup(groupName: string): Promise<string> {
        const headers = await KeycloakService.getAuthHeaders();

        try {
            // First, check if group already exists
            const res = await axios.get(`${this.keycloakBase}/groups`, { headers });
            const existingGroup = res.data.find((g: any) => g.name === groupName);

            if (existingGroup) {
                console.log(`Group ${groupName} already exists with ID: ${existingGroup.id}`);
                return existingGroup.id;
            }

            // Group doesn't exist, create it
            console.log(`Creating group: ${groupName}`);
            try {
                await axios.post(`${this.keycloakBase}/groups`, { name: groupName }, { headers });
                console.log(`Group ${groupName} created successfully`);
            } catch (createError: any) {
                // Handle race condition - group might have been created by another process
                if (createError.response?.status === 409) {
                    console.log(`Group ${groupName} was created by another process, fetching ID`);
                } else {
                    throw createError;
                }
            }

            // Fetch the group ID (whether we just created it or it was created by another process)
            const updatedGroups = await axios.get(`${this.keycloakBase}/groups`, { headers });
            const newGroup = updatedGroups.data.find((g: any) => g.name === groupName);

            if (!newGroup) {
                throw new Error(`Failed to find group after creation: ${groupName}`);
            }

            return newGroup.id;
        } catch (error) {
            console.error(`Error in getOrCreateGroup for ${groupName}:`, error);
            throw error;
        }
    }

    // Assign user to group (with duplicate check)
    static async assignUserToGroup(userId: string, groupId: string): Promise<void> {
        const headers = await KeycloakService.getAuthHeaders();

        try {
            // Check if user is already in the group
            const userGroupsRes = await axios.get(`${this.keycloakBase}/users/${userId}/groups`, { headers });
            const isAlreadyMember = userGroupsRes.data.some((g: any) => g.id === groupId);

            if (isAlreadyMember) {
                console.log(`User ${userId} is already a member of group ${groupId}`);
                return;
            }

            // Assign user to group
            await axios.put(`${this.keycloakBase}/users/${userId}/groups/${groupId}`, {}, { headers });
            console.log(`User ${userId} assigned to group ${groupId}`);
        } catch (error) {
            console.error(`Error assigning user ${userId} to group ${groupId}:`, error);
            throw error;
        }
    }

    // Get or create a role
    static async getOrCreateRole(roleName: string): Promise<void> {
        const headers = await KeycloakService.getAuthHeaders();

        try {
            // Check if role already exists
            await axios.get(`${this.keycloakBase}/roles/${roleName}`, { headers });
            console.log(`Role ${roleName} already exists.`);
            return;
        } catch (err: any) {
            if (err.response?.status === 404) {
                // Role doesn't exist, create it
                try {
                    await axios.post(`${this.keycloakBase}/roles`, { name: roleName }, { headers });
                    console.log(`Role ${roleName} created successfully.`);
                    return;
                } catch (createError: any) {
                    // Handle race condition - role might have been created by another process
                    if (createError.response?.status === 409) {
                        console.log(`Role ${roleName} was created by another process.`);
                        return;
                    } else {
                        console.error(`Error creating role ${roleName}:`, createError);
                        throw createError;
                    }
                }
            } else {
                console.error(`Error checking role ${roleName}:`, err);
                throw err;
            }
        }
    }

    // NOTE: We don't assign roles directly to users - roles are assigned to subgroups
    // Users inherit roles from their subgroup membership

    // Assign a realm role to a group (with duplicate check)
    static async assignRoleToGroup(groupId: string, roleName: string): Promise<void> {
        const headers = await KeycloakService.getAuthHeaders();

        try {
            // Check if group already has this role
            const groupRolesRes = await axios.get(`${this.keycloakBase}/groups/${groupId}/role-mappings/realm`, { headers });
            const hasRole = groupRolesRes.data.some((r: any) => r.name === roleName);

            if (hasRole) {
                console.log(`Group ${groupId} already has role ${roleName}`);
                return;
            }

            // Get role details and assign to group
            console.log(`Assigning role ${roleName} to group ${groupId}`);
            const role = (await axios.get(`${this.keycloakBase}/roles/${roleName}`, { headers })).data;

            await axios.post(`${this.keycloakBase}/groups/${groupId}/role-mappings/realm`, [role], { headers });
            console.log(`Role ${roleName} assigned to group ${groupId}`);
        } catch (error) {
            console.error(`Error assigning role ${roleName} to group ${groupId}:`, error);
            throw error;
        }
    }

    static async getOrCreateChildGroup(parentGroupId: string, childGroupName: string): Promise<string> {
        const headers = await KeycloakService.getAuthHeaders();

        try {
            console.log(`=== CHILD GROUP CREATION DEBUG ===`);
            console.log(`Parent Group ID: ${parentGroupId}`);
            console.log(`Child Group Name: ${childGroupName}`);

            // Check if child group already exists under parent

            const subGroupsRes = await axios.get(
                `${this.keycloakBase}/groups/${parentGroupId}/children`,
                { headers }
            );
            console.log(`Fetched child groups under parent ${parentGroupId}:`, subGroupsRes.data.map((g: any) => g.name));

            const existingChild = subGroupsRes.data.find((g: any) => g.name === childGroupName);
            if (existingChild) {
                console.log(`Child group ${childGroupName} already exists with ID: ${existingChild.id}`);
                return existingChild.id;
            }
            console.log(`Child group ${childGroupName} does not exist, proceeding to create it`);
            if (existingChild) {
                console.log(`Child group ${childGroupName} already exists with ID: ${existingChild.id}`);
                return existingChild.id;
            }

            // Child group doesn't exist, create it
            console.log(`Creating child group: ${childGroupName} under parent: ${parentGroupId}`);
            try {
                const createResponse = await axios.post(`${this.keycloakBase}/groups/${parentGroupId}/children`, { name: childGroupName }, { headers });
                console.log(`Child group creation response:`, createResponse.status);
                console.log(`Child group ${childGroupName} created successfully`);
            } catch (createError: any) {
                console.error(`Error creating child group:`, createError.response?.data || createError.message);
                // Handle race condition - child group might have been created by another process
            }

            // Add a small delay to ensure Keycloak has processed the creation
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Fetch the child group ID (whether we just created it or it was created by another process)
            const updatedParentGroupRes = await axios.get(`${this.keycloakBase}/groups/${parentGroupId}`, { headers });
            console.log(`Updated parent group data:`, JSON.stringify(updatedParentGroupRes.data, null, 2));

            const newChild = updatedParentGroupRes.data.subGroups?.find((g: any) => g.name === childGroupName);

            if (!newChild) {
                console.error(`=== CHILD GROUP NOT FOUND ===`);
                console.error(`Looking for child group: ${childGroupName}`);
                console.error(`Available subGroups:`, updatedParentGroupRes.data.subGroups?.map((g: any) => g.name) || 'None');
                throw new Error(`Failed to find child group after creation: ${childGroupName}`);
            }

            console.log(`Child group ${childGroupName} found with ID: ${newChild.id}`);
            console.log(`=== CHILD GROUP CREATION SUCCESS ===`);
            return newChild.id;
        } catch (error) {
            console.error(`Error in getOrCreateChildGroup for ${childGroupName}:`, error);
            throw error;
        }
    }

    // FIXED: Complete onboarding flow with corrected naming logic
    static async onboardUser(data: OnboardUser): Promise<void> {
        const headers = await KeycloakService.getAuthHeaders();

        try {
            console.log('=== STARTING USER ONBOARDING ===');
            console.log(`Username: ${data.username}`);
            console.log(`Group: ${data.groupName}`);
            console.log(`Role: ${data.roleName}`);

            // Step 0: Check if user already exists by username
            const existingUsersByUsernameRes = await axios.get(
                `${this.keycloakBase}/users?username=${encodeURIComponent(data.username)}&exact=true`,
                { headers }
            );
            const userByUsername = existingUsersByUsernameRes.data?.[0];

            if (userByUsername) {
                if (
                    userByUsername.email?.toLowerCase() === data.email.toLowerCase()
                ) {
                    console.log(`User with username "${data.username}" and email "${data.email}" already exists.`);
                    throw new Error(`User and email already exist`);
                } else {
                    console.log(`Username "${data.username}" already exists with a different email.`);
                    throw new Error(`Username already exists`);
                }
            }

            // Optional: Check if email is used by another user
            const existingUsersByEmailRes = await axios.get(
                `${this.keycloakBase}/users?email=${encodeURIComponent(data.email)}&exact=true`,
                { headers }
            );
            const userByEmail = existingUsersByEmailRes.data?.[0];
            if (userByEmail) {
                console.log(`Email "${data.email}" already exists with a different username.`);
                throw new Error(`Email already exists`);
            }

            // Step 1: Create user
            console.log('Step 1: Creating user...');
            const userId = await this.createUser({
                username: data.username,
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
                password: data.password,
            });
            console.log(`✓ User created with ID: ${userId}`);

            // Step 2: Get or create parent group
            console.log('Step 2: Getting/creating parent group...');
            const parentGroupName = data.groupName.toLowerCase();
            const parentGroupId = await this.getOrCreateGroup(parentGroupName);
            console.log(`✓ Parent group '${parentGroupName}' ID: ${parentGroupId}`);

            // Step 3: Determine child group name
            console.log('Step 3: Determining child group name...');
            const roleName = data.roleName.toLowerCase();
            let roleType = '';
            if (roleName.includes('admin')) {
                roleType = 'admin';
            } else if (roleName.includes('user')) {
                roleType = 'user';
            } else {
                roleType = roleName.replace(/_role$/, '').split('_').pop() || 'user';
            }
            const childGroupName = `${parentGroupName}_${roleType}`;
            console.log(`✓ Child group name determined: ${childGroupName}`);

            // Step 4: Get or create child group
            console.log('Step 4: Getting/creating child group...');
            const childGroupId = await this.getOrCreateChildGroup(parentGroupId, childGroupName);
            console.log(`✓ Child group '${childGroupName}' ID: ${childGroupId}`);

            // Step 5: Assign user to child group
            console.log('Step 5: Assigning user to child group...');
            await this.assignUserToGroup(userId, childGroupId);
            console.log(`✓ User assigned to child group`);

            // Step 6: Get or create role
            console.log('Step 6: Getting/creating role...');
            const normalizedRoleName = data.roleName.toLowerCase();
            await this.getOrCreateRole(normalizedRoleName);
            console.log(`✓ Role '${normalizedRoleName}' ensured`);

            // Step 7: Assign role to child group
            console.log('Step 7: Assigning role to child group...');
            await this.assignRoleToGroup(childGroupId, normalizedRoleName);
            console.log(`✓ Role assigned to child group`);

            // Summary
            console.log('=== USER ONBOARDING SUMMARY ===');
            console.log(`✓ User: ${data.username} created and assigned to subgroup`);
            console.log(`✓ Parent Group: ${parentGroupName}`);
            console.log(`✓ Child Group: ${childGroupName} (user is member)`);
            console.log(`✓ Role: ${normalizedRoleName} (assigned to subgroup)`);
            console.log(`✓ User will inherit role: ${normalizedRoleName} from subgroup membership`);
            console.log('=== ONBOARDING COMPLETED SUCCESSFULLY ===');

        } catch (error: any) {
            console.error('=== USER ONBOARDING FAILED ===');
            console.error('Error during user onboarding:', error);
            console.error('Error details:', error.response?.data || error.message);
            throw new Error(`Failed to onboard user ${data.username}: ${error.message}`);
        }
    }


    static async getAllUsersWithRolesAndGroups(): Promise<any[]> {
        console.log('Fetching all users with roles and groups in service');

        try {
            const headers = await KeycloakService.getAuthHeaders();
            const usersRes = await axios.get(`${this.keycloakBase}/users`, { headers });
            const users = usersRes.data;

            const userDetails = await Promise.all(users.map(async (user: any) => {
                const userId = user.id;

                try {
                    // Get user's roles
                    const rolesRes = await axios.get(`${this.keycloakBase}/users/${userId}/role-mappings/realm`, { headers });
                    const roles = rolesRes.data.map((r: any) => r.name);

                    // Get user's groups
                    const groupsRes = await axios.get(`${this.keycloakBase}/users/${userId}/groups`, { headers });
                    const groups = groupsRes.data.map((g: any) => g.name);

                    return {
                        id: userId,
                        username: user.username,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        roles,
                        groups,
                    };
                } catch (error) {
                    console.error(`Error fetching details for user ${userId}:`, error);
                    return {
                        id: userId,
                        username: user.username,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        roles: [],
                        groups: [],
                        error: 'Failed to fetch roles/groups'
                    };
                }
            }));

            return userDetails;
        } catch (error) {
            console.error('Error fetching all users:', error);
            throw error;
        }
    }
}