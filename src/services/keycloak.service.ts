import axios from 'axios';
import config from '../config/keycloak.config';

export class KeycloakService {
    private static adminToken: string | null = null;
    private static tokenExpiry: number | null = null;

    private static async fetchAdminToken(): Promise<string> {
        const now = Math.floor(Date.now() / 1000);

        if (this.adminToken && this.tokenExpiry && now < this.tokenExpiry - 60) {
            return this.adminToken;
        }

        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', config.clientId);
        params.append('client_secret', config.clientSecret);

        const res = await axios.post(
            `${config.keycloakUrl}/realms/${config.realm}/protocol/openid-connect/token`,
            params
        );

        this.adminToken = res.data.access_token;
        this.tokenExpiry = now + res.data.expires_in;

        return this.adminToken!;
    }

    public static async getAuthHeaders(): Promise<{ Authorization: string; 'Content-Type': string }> {
        const token = await this.fetchAdminToken();
        return {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
    }
}
