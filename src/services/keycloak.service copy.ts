import axios from 'axios';
import config from '../config/keycloak.config';

export class KeycloakService {
    private static adminToken: string | null = null;
    private static tokenExpiry: number | null = null;

    private static async getValidAdminToken(): Promise<string> {
        const currentTime = Math.floor(Date.now() / 1000);

        if (this.adminToken && this.tokenExpiry && currentTime < this.tokenExpiry - 60) {
            return this.adminToken;
        }

        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', config.clientId);
        params.append('client_secret', config.clientSecret);

        const response = await axios.post(
            `${config.keycloakUrl}/realms/master/protocol/openid-connect/token`,
            params
        );

        this.adminToken = response.data.access_token;
        const expiresIn = parseInt(response.data.expires_in); 
        this.tokenExpiry = currentTime + expiresIn;

        return this.adminToken!;
    }

    static async createRealm(realmName: string): Promise<void> {
        const token = await this.getValidAdminToken();

        await axios.post(
            `${config.keycloakUrl}/admin/realms`,
            { realm: realmName, enabled: true },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );
    }

    static async fetchAllRealms(): Promise<{ realm: string }[]> {
        const token = await this.getValidAdminToken();

        const response = await axios.get(`${config.keycloakUrl}/admin/realms`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        return response.data;
    }

    static async updateRealm(oldRealm: string, newRealm: string): Promise<void> {
        const token = await this.getValidAdminToken();

        await axios.put(
            `${config.keycloakUrl}/admin/realms/${oldRealm}`,
            { realm: newRealm, enabled: true },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );
    }

    static async realmExists(realm: string): Promise<boolean> {
        const token = await this.getValidAdminToken();

        try {
            await axios.get(`${config.keycloakUrl}/admin/realms/${realm}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return true;
        } catch (err: any) {
            if (err.response?.status === 404) return false;
            throw err;
        }
    }

    static async deleteRealm(realm: string): Promise<void> {
        const token = await this.getValidAdminToken();

        await axios.delete(`${config.keycloakUrl}/admin/realms/${realm}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
    }
}
