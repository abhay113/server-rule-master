import { Request, Response } from 'express';
import { GeminiService } from '../services/gemini.service';
import { RuleService } from '../services/rule.service';
export class ChatController {
    static async handleChatPrompt(req: Request, res: Response) {
        try {
            const { prompt } = req.body;
            const user = res.locals.user?.username || 'system';

            if (!prompt) return res.status(400).json({ error: 'Prompt required' });

            // Step 1: detect the intent (create, list, casual, etc.)
            const intent = await GeminiService.detectIntentFromPrompt(prompt);

            // Step 2: handle based on detected intent
            switch (intent) {
                case 'create': {

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
            console.error('Chat prompt handling error:', err);
            res.status(500).json({ error: 'Failed to process prompt' });
        }
    }

}
