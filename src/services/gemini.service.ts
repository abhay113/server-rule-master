import { gemini } from '../config/gemini.config';
import { Condition } from '../types/interface.types';
import { normalizeOperator } from '../services/operator.service';
export class GeminiService {
  static async generateRuleFromPrompt(userPrompt: string) {
    const systemPrompt = `
You are a rule parser. Convert the user input into structured JSON.

Format:
{
  "rule": { "title": "...", "department": "..." },
  "logic": "(cond1 AND cond2)",
  "conditions": [
    { "id": "cond1", "field": "...", "operator": "...", "value": "..." }
  ],
  "actions": [
    { "type": "...", "value": "..." }
  ]
}

Use symbolic operators like >, <, =, !=, >=, <=, IN, NOT IN, LIKE etc.

User Rule:
"${userPrompt}"
`.trim();

    const result = await gemini.generateContent({
      contents: [{ role: 'user', parts: [{ text: systemPrompt }] }]
    });

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No valid JSON found in Gemini output');

    const parsed = JSON.parse(jsonMatch[0]);

    // Normalize operators in conditions
    if (Array.isArray(parsed.conditions)) {
      parsed.conditions = parsed.conditions.map((cond: Condition) => ({
        ...cond,
        operator: normalizeOperator(cond.operator)
      }));
    }

    return parsed;
  }

  static async detectIntentFromPrompt(prompt: string): Promise<'create' | 'list' | 'casual'> {
    const systemPrompt = `
You are a natural language intent classifier for a rule engine.

Classify the prompt as one of:
- create (if it's for making a new rule)
- list (if it's asking to show/list rules)
- casual (if it's not related to rules)

Only return one word.

Prompt:
"${prompt}"
`.trim();

    const result = await gemini.generateContent({
      contents: [{ role: 'user', parts: [{ text: systemPrompt }] }]
    });

    const intent = result.response.text().trim().toLowerCase();
    return ['create', 'list'].includes(intent) ? intent as any : 'casual';
  }

  static async answerCasualPrompt(prompt: string): Promise<string> {
    const systemPrompt = `
You are a helpful assistant. Answer the user's general query briefly and clearly.

User asked:
"${prompt}"
`.trim();

    const result = await gemini.generateContent({
      contents: [{ role: 'user', parts: [{ text: systemPrompt }] }]
    });

    return result.response.text().trim();
  }

}