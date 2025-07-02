import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';

export class UserController {
    static async onboardUser(req: Request, res: Response, next: NextFunction) {
        try {
            await UserService.onboardUser(req.body);
            return res.status(201).json({ message: 'User onboarded successfully' });
        } catch (error: any) {
            console.error('User onboarding failed:', error.message);
            // Pass the error to the next middleware (error handling middleware)
            next(error);
        }
    }

    static async getAllUsersWithRolesAndGroups(req: Request, res: Response, next: NextFunction) {
        try {
            console.log('Fetching all users with roles and groups controller');
            const users = await UserService.getAllUsersWithRolesAndGroups();
            console.log('Fetched users with roles and groups:', users.length);
            res.status(200).json(users);
        } catch (error: any) {
            console.error('Failed to fetch users:', error.message);
            // Pass the error to the next middleware (error handling middleware)
            next(error);
        }
    }
}