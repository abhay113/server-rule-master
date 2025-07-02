import { Request, Response, NextFunction } from 'express'; // Import NextFunction
import { RuleService } from '../services/rule.service';
// Assuming GeminiService is used for NLP prompt generation, if uncommented later
// import { GeminiService } from '../services/gemini.service';

export class RuleController {
    // Create rule from NLP prompt (currently commented out, but updated for next())
    // static async createRuleFromPrompt(req: Request, res: Response, next: NextFunction) {
    //     try {
    //         const { prompt } = req.body;
    //         const createdBy = res.locals.user?.username || 'system';

    //         if (!prompt) {
    //             return res.status(400).json({ error: 'Missing prompt' });
    //         }

    //         const parsedRule = await GeminiService.generateRuleFromPrompt(prompt);
    //         const ruleId = await RuleService.processAndStoreRule(parsedRule, createdBy);

    //         return res.status(201).json({
    //             success: true,
    //             ruleId,
    //             parsedRule,
    //             message: 'Rule created successfully from prompt'
    //         });
    //     } catch (err) {
    //         console.error('Rule creation error:', err);
    //         next(err); // Pass the error to the next middleware
    //     }
    // }

    // Create rule manually
    static async createRule(req: Request, res: Response, next: NextFunction) { // Add next: NextFunction
        try {
            const { title, department, conditions, actions, logic } = req.body;
            const createdBy = res.locals.user?.username || 'system';

            if (!title || !conditions || !actions) {
                // Client error, respond directly and return
                return res.status(400).json({
                    error: 'Missing required fields: title, conditions, actions'
                });
            }

            const ruleData = {
                rule: { title, department, logic, },
                conditions,
                actions
            };

            const ruleId = await RuleService.processAndStoreRule(ruleData, createdBy);

            return res.status(201).json({
                success: true,
                ruleId,
                message: 'Rule created successfully'
            });
        } catch (err) {
            console.error('Rule creation error:', err);
            next(err); // Pass the error to the next middleware
        }
    }

    // Get all rules with pagination
    static async getAllRules(req: Request, res: Response, next: NextFunction) { // Add next: NextFunction
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const isActive = req.query.isActive ? req.query.isActive === 'true' : undefined;
            const requestedDepartment = req.query.department as string | undefined;

            const user = res.locals.user;
            const isSuperAdmin = user?.isSuperAdmin;
            const userDepartment = user?.department;

            let departmentToUse: string | undefined;

            if (isSuperAdmin) {
                departmentToUse = requestedDepartment; // allow any department to be queried
            } else {
                departmentToUse = userDepartment; // restrict to user's department only
            }

            const result = await RuleService.getAllRules(page, limit, isActive, departmentToUse);

            return res.status(200).json({
                success: true,
                department: departmentToUse,
                data: result.rules,
                pagination: {
                    page,
                    limit,
                    total: result.total,
                    totalPages: Math.ceil(result.total / limit)
                }
            });
        } catch (err) {
            console.error('Get rules error:', err);
            next(err); // Pass the error to the next middleware
        }
    }

    // Get rule by ID with conditions and actions
    static async getRuleById(req: Request, res: Response, next: NextFunction) { // Add next: NextFunction
        try {
            const { id } = req.params;
            console.log('Fetching rule with ID:', id);

            if (!id) {
                // Client error, respond directly and return
                return res.status(400).json({ error: 'Invalid rule ID ' });
            }

            const rule = await RuleService.getRuleById(id);

            if (!rule) {
                // Client error, respond directly and return
                return res.status(404).json({ error: 'Rule not found' });
            }

            return res.status(200).json({
                success: true,
                data: rule
            });
        } catch (err) {
            console.error('Get rule error:', err);
            next(err); // Pass the error to the next middleware
        }
    }

    // Update rule
    static async updateRule(req: Request, res: Response, next: NextFunction) { // Add next: NextFunction
        try {
            const { id } = req.params;
            const { title, department, conditions, actions, logic, is_active } = req.body;
            const updatedBy = res.locals.user?.username || 'system';
            if (!id) {
                // Client error, respond directly and return
                return res.status(400).json({ error: 'Invalid rule ID' });
            }

            const updateData = {
                title,
                department,
                conditions,
                actions,
                logic,
                is_active,
            };

            const success = await RuleService.updateRule(id, updateData, updatedBy);

            if (!success) {
                // Client error, respond directly and return
                return res.status(404).json({ error: 'Rule not found' });
            }

            return res.status(200).json({
                success: true,
                message: 'Rule updated successfully'
            });
        } catch (err) {
            console.error('Update rule error:', err);
            next(err); // Pass the error to the next middleware
        }
    }

    // Delete rule
    static async deleteRule(req: Request, res: Response, next: NextFunction) { // Add next: NextFunction
        try {
            const { id } = req.params;

            if (!id) {
                // Client error, respond directly and return
                return res.status(400).json({ error: 'Invalid rule ID' });
            }

            const success = await RuleService.deleteRule(id);

            if (!success) {
                // Client error, respond directly and return
                return res.status(404).json({ error: 'Rule not found' });
            }

            return res.status(200).json({
                success: true,
                message: 'Rule deleted successfully'
            });
        } catch (err) {
            console.error('Delete rule error:', err);
            next(err); // Pass the error to the next middleware
        }
    }

    // Get rules by department
    static async getRulesByDepartment(req: Request, res: Response, next: NextFunction) { // Add next: NextFunction
        try {
            const { department } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const isActive = req.query.is_active ? req.query.is_active === 'true' : undefined;

            if (!department) {
                // Client error, respond directly and return
                return res.status(400).json({ error: 'Department parameter is required' });
            }

            const result = await RuleService.getRulesByDepartment(
                department,
                page,
                limit,
                isActive
            );

            return res.status(200).json({
                success: true,
                department,
                data: result.rules,
                pagination: {
                    page,
                    limit,
                    total: result.total,
                    totalPages: Math.ceil(result.total / limit)
                }
            });
        } catch (err) {
            console.error('Get rules by department error:', err);
            next(err); // Pass the error to the next middleware
        }
    }

    // Toggle rule active status
    static async toggleRuleStatus(req: Request, res: Response, next: NextFunction) { // Add next: NextFunction
        try {
            const { id } = req.params;
            const updatedBy = res.locals.user?.username || 'system';

            if (!id) {
                // Client error, respond directly and return
                return res.status(400).json({ error: 'Invalid rule ID' });
            }

            const newStatus = await RuleService.toggleRuleStatus(id, updatedBy);

            if (newStatus === null) {
                // Client error, respond directly and return
                return res.status(404).json({ error: 'Rule not found' });
            }

            return res.status(200).json({
                success: true,
                message: `Rule ${newStatus ? 'activated' : 'deactivated'} successfully`,
                is_active: newStatus
            });
        } catch (err) {
            console.error('Toggle rule status error:', err);
            next(err); // Pass the error to the next middleware
        }
    }

    static async getRuleStats(req: Request, res: Response, next: NextFunction) {
        try {
            const stats = await RuleService.getRuleStats();
            return res.status(200).json({ success: true, data: stats });
        } catch (error) {
            next(error);
        }
    }
}