import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

export class UserController {
    static async onboardUser(req: Request, res: Response) {
        try {
            await UserService.onboardUser(req.body);
            return res.status(201).json({ message: 'User onboarded successfully' });
        } catch (error: any) {
            console.error('User onboarding failed:', error.message);
            return res.status(500).json({
                message: 'Failed to onboard user',
                details: error.response?.data || error.message,
            });
        }
    }

    static async getAllUsersWithRolesAndGroups(req: Request, res: Response) {
        try {
            console.log('Fetching all users with roles and groups controller');
            const users = await UserService.getAllUsersWithRolesAndGroups();
            console.log('Fetched users with roles and groups:', users.length);
            res.status(200).json(users);
        } catch (error: any) {
            console.error('Failed to fetch users:', error.message);
            res.status(500).json({
                message: 'Error fetching users with roles and groups',
                details: error.response?.data || error.message,
            });
        }
    }
}
