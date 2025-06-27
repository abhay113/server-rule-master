import { Request, Response } from 'express';
import { RuleService } from '../services/rule.service'

export class RuleController {
    static async createRuleFromAI(req: Request, res: Response) {
        try {
            const { parsedRule, userId } = req.body;

            if (!parsedRule || !userId) {
                return res.status(400).json({ error: 'Missing parsedRule or userId' });
            }

            const ruleId = await RuleService.processAndStoreRule(parsedRule, userId);
            res.status(201).json({ message: 'Rule created', ruleId });
        } catch (error: any) {
            console.error('Rule creation error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
} 
