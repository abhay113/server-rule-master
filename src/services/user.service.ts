import axios from 'axios';
import config from '../config/keycloak.config';
import { KeycloakService } from './keycloak.service';
import { OnboardUser, User } from '../types/user.types';

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

        const data = await axios.post(`${this.keycloakBase}/users`, userPayload, { headers });
        console.log('User created: in service', data.data);
        // Retrieve user ID by querying the username
        const users = await axios.get(`${this.keycloakBase}/users?username=${user.username}`, { headers });
        return users.data[0].id;
    }

    // Get or create a group by name
    static async getOrCreateGroup(groupName: string): Promise<string> {
        const headers = await KeycloakService.getAuthHeaders();

        const res = await axios.get(`${this.keycloakBase}/groups`, { headers });
        const existingGroup = res.data.find((g: any) => g.name === groupName);

        if (existingGroup) return existingGroup.id;

        await axios.post(`${this.keycloakBase}/groups`, { name: groupName }, { headers });

        const updatedGroups = await axios.get(`${this.keycloakBase}/groups`, { headers });
        const newGroup = updatedGroups.data.find((g: any) => g.name === groupName);
        return newGroup.id;
    }

    // Assign user to group
    static async assignUserToGroup(userId: string, groupId: string): Promise<void> {
        const headers = await KeycloakService.getAuthHeaders();

        await axios.put(`${this.keycloakBase}/users/${userId}/groups/${groupId}`, {}, { headers });
    }

    // Get or create a role
    static async getOrCreateRole(roleName: string): Promise<void> {
        const headers = await KeycloakService.getAuthHeaders();

        try {
            await axios.get(`${this.keycloakBase}/roles/${roleName}`, { headers });
        } catch (err: any) {
            if (err.response?.status === 404) {
                await axios.post(`${this.keycloakBase}/roles`, { name: roleName }, { headers });
            } else {
                throw err;
            }
        }
    }

    // Assign a realm role to a user
    static async assignRoleToUser(userId: string, roleName: string): Promise<void> {
        const headers = await KeycloakService.getAuthHeaders();

        const role = (await axios.get(`${this.keycloakBase}/roles/${roleName}`, { headers })).data;
        await axios.post(`${this.keycloakBase}/users/${userId}/role-mappings/realm`, [role], { headers });
    }

    // Assign a realm role to a group
    static async assignRoleToGroup(groupId: string, roleName: string): Promise<void> {
        const headers = await KeycloakService.getAuthHeaders();

        const role = (await axios.get(`${this.keycloakBase}/roles/${roleName}`, { headers })).data;
        await axios.post(`${this.keycloakBase}/groups/${groupId}/role-mappings/realm`, [role], { headers });
    }

    // Complete onboarding flow: create user, group, assign group + role
    static async onboardUser(data: OnboardUser): Promise<void> {
        const userId = await this.createUser({
            username: data.username,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            password: data.password,
        });

        const groupId = await this.getOrCreateGroup(data.groupName);
        await this.assignUserToGroup(userId, groupId);

        await this.getOrCreateRole(data.roleName);
        await this.assignRoleToGroup(groupId, data.roleName);
    }


    static async getAllUsersWithRolesAndGroups(): Promise<any[]> {
        const headers = await KeycloakService.getAuthHeaders();
        const usersRes = await axios.get(`${this.keycloakBase}/users`, { headers });
        const users = usersRes.data;

        const userDetails = await Promise.all(users.map(async (user: any) => {
            const userId = user.id;

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
        }));

        return userDetails;
    }

}
