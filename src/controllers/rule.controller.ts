import { Request, Response } from 'express';
import { RuleService } from '../services/rule.service';
import { GeminiService } from '../services/gemini.service';

export class RuleController {
    static async createRuleFromPrompt(req: Request, res: Response) {
        try {
            const { prompt } = req.body;
            const createdBy = res.locals.user?.username || 'system';
            console.log('Created by:', createdBy);

            if (!prompt) {
                return res.status(400).json({ error: 'Missing prompt' });
            }

            const parsedRule = await GeminiService.generateRuleFromPrompt(prompt);
            const ruleId = await RuleService.processAndStoreRule(parsedRule, createdBy);

            return res.status(201).json({ ruleId, parsedRule });
        } catch (err) {
            console.error('Rule creation error:', err);
            res.status(500).json({ error: 'Failed to create rule from prompt' });
        }
    }
}