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
}