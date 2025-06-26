// src/controllers/tenant.controller.ts
import { Request, Response } from 'express';
import { KeycloakService } from '../services/keycloak.service copy';

export class TenantController {
    // POST /api/tenants
    static async createTenant(req: Request, res: Response): Promise<void> {
        const { realmName } = req.body;

        try {
            await KeycloakService.createRealm(realmName);
            res.status(201).json({ message: `Tenant '${realmName}' created successfully.` });
        } catch (err: any) {
            console.error(err?.response?.data || err.message);
            res.status(500).json({ error: 'Failed to create tenant.' });
        }
    }

    // GET /api/tenants
    static async getTenants(_req: Request, res: Response): Promise<void> {
        try {
            const realms = await KeycloakService.fetchAllRealms();
            res.status(200).json({ tenants: realms.map((r) => r.realm) });
        } catch (err: any) {
            console.error(err?.response?.data || err.message);
            res.status(500).json({ error: 'Failed to fetch tenants.' });
        }
    }

    // PATCH /api/tenants/:realm
    static async updateTenant(req: Request, res: Response): Promise<void> {
        const { realm } = req.params;
        const { newRealmName } = req.body;

        try {
            const exists = await KeycloakService.realmExists(realm);
            if (!exists) {
                res.status(404).json({ error: `Realm '${realm}' does not exist.` });
            }

            await KeycloakService.updateRealm(realm, newRealmName);
            res.status(200).json({ message: `Tenant '${realm}' updated to '${newRealmName}' successfully.` });
        } catch (err: any) {
            console.error(err?.response?.data || err.message);
            res.status(500).json({ error: 'Failed to update tenant.' });
        }
    }

    // DELETE /api/tenants/:realm
    static async deleteTenant(req: Request, res: Response): Promise<void> {
        const { realm } = req.params;

        try {
            const exists = await KeycloakService.realmExists(realm);
            if (!exists) {
                res.status(404).json({ error: `Realm '${realm}' does not exist.` });
            }

            await KeycloakService.deleteRealm(realm);
            res.status(200).json({ message: `Tenant '${realm}' deleted successfully.` });
        } catch (err: any) {
            console.error(err?.response?.data || err.message);
            res.status(500).json({ error: 'Failed to delete tenant.' });
        }
    }
}
