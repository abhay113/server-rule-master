import { Request, Response, NextFunction } from 'express';
import { GeminiService } from '../services/gemini.service';
import { RuleService } from '../services/rule.service';
import { hasAdminRole } from '../middlewares/auth';

export class ChatController {
    static async handleChatPrompt(req: Request, res: Response, next: NextFunction) {
        try {
            const { prompt } = req.body;
            const user = res.locals.user?.username || 'system';
            const roles = res.locals.user?.roles || [];


            if (!prompt) {
                return res.status(400).json({ error: 'Prompt required' });
            }

            const intent = await GeminiService.detectIntentFromPrompt(prompt);

            switch (intent) {
                case 'create': {
                    if (!hasAdminRole(roles)) {
                        return res.status(403).json({
                            success: false,
                            message: 'You are not allowed to create rules.',
                        });
                    }
                    const parsedRule = await GeminiService.generateRuleFromPrompt(prompt);
                    const ruleId = await RuleService.processAndStoreRule(parsedRule, user);

                    return res.status(201).json({
                        success: true,
                        ruleId,
                        parsedRule,
                        message: 'Rule created successfully from prompt',
                    });
                }

                case 'list': {
                    const result = await RuleService.getAllRules(1, 100);
                    return res.status(200).json({
                        success: true,
                        count: result.total,
                        data: result.rules,
                    });
                }

                case 'casual':
                default: {
                    const reply = await GeminiService.answerCasualPrompt(prompt);
                    return res.status(200).json({ success: true, message: reply });
                }
            }
        } catch (err) {
            next(err);
        }
    }
}
