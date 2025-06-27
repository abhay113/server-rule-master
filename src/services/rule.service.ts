import { createRule, createRuleActions, createRuleConditions } from '../dao/rule.dao';

export class RuleService {
    static async processAndStoreRule(parsedRule: any, userId: string) {
        const ruleData = {
            title: parsedRule.rule.title,
            department: parsedRule.rule.department || null,
            is_active: true,
            created_by: userId,
            created_at: new Date().toISOString()
        };

        const { id: ruleId } = await createRule(ruleData);

        const conditions = parsedRule.conditions.map((cond: any) => ({
            rule_id: ruleId,
            field: cond.field,
            operator: cond.operator,
            value: cond.value,
            created_by: userId,
            created_at: new Date().toISOString()
        }));

        const actions = parsedRule.actions.map((action: any) => ({
            rule_id: ruleId,
            type: action.type,
            value: action.value,
            created_by: userId,
            created_at: new Date().toISOString()
        }));

        await createRuleConditions(conditions);
        await createRuleActions(actions);

        return ruleId;
    };
}
