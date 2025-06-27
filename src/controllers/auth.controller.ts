import { Request, Response } from 'express';
import axios from 'axios';
import config from '../config/keycloak.config';

export class AuthController {

    static async login(req: Request, res: Response): Promise<void> {
        const { username, password } = req.body;

        try {
            const response = await axios.post(
                `${config.keycloakUrl}/realms/${config.realm}/protocol/openid-connect/token`,
                new URLSearchParams({
                    grant_type: 'password',
                    client_id: config.clientId,
                    client_secret: config.clientSecret,
                    username,
                    password,
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );

            res.status(200).json({
                access_token: response.data.access_token,
                refresh_token: response.data.refresh_token,
                expires_in: response.data.expires_in,
                token_type: response.data.token_type,
            });
        } catch (error: any) {
            console.error('Login error:', error.response?.data || error.message);
            res.status(401).json({
                error: 'Invalid credentials or login failed',
                details: error.response?.data || error.message,
            });
        }
    };


    static async logout(req: Request, res: Response): Promise<void> {
        const { refresh_token } = req.body;

        if (!refresh_token) {
            res.status(400).json({ error: 'Refresh token is required for logout' });
        }

        try {
            await axios.post(
                `${config.keycloakUrl}/realms/${config.realm}/protocol/openid-connect/logout`,
                new URLSearchParams({
                    client_id: config.clientId,
                    client_secret: config.clientSecret,
                    refresh_token,
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );

            res.status(200).json({ message: 'Logout successful' });
        } catch (error: any) {
            console.error('Logout error:', error.response?.data || error.message);
            res.status(500).json({
                error: 'Logout failed',
                details: error.response?.data || error.message,
            });
        }
    }
} 