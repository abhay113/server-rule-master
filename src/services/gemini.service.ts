import { gemini } from '../config/gemini.config';
import { Condition } from '../types/interface.types';
import { normalizeOperator } from '../services/operator.service';
export class GeminiService {
  static async generateRuleFromPrompt(userPrompt: string, department: string) {
    const systemPrompt = `
You are a rule parser and validator. Convert the user input into structured JSON.

⚠️ VERY IMPORTANT:
- The rule must be relevant to the department: "${department}".
- If the user's prompt describes logic outside of this department (e.g., software, finance, HR, etc.), DO NOT generate a rule.
- Instead, return: { "error": "The rule does not pertain to the '${department}' department." }

✅ Always set:
"rule": {
  "title": "...",
  "department": "${department}",
  "description": "..."
}

🧠 Do NOT assume department from the prompt. Only allow rule creation if the prompt context clearly belongs to the "${department}" department.

Output format (if valid):
{
  "rule": { "title": "...", "department": "${department}", "description": "..." },
  "logic": "(cond1 AND cond2)",
  "conditions": [ { "id": "cond1", "field": "...", "operator": "...", "value": "..." } ],
  "actions": [ { "type": "...", "value": "..." } ]
}

If the rule is not valid for the "${department}" department, return:
{ "error": "The rule does not pertain to the '${department}' department." }

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

    // Normalize operators
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