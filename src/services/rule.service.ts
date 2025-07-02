import { RuleDao } from '../dao/rule.dao';

export class RuleService {
    static async processAndStoreRule(parsedRule: any, username: string) {
        const ruleData = {
            title: parsedRule.rule.title,
            department: parsedRule.rule.department || null,
            description: parsedRule.rule.description || null,
            logic: parsedRule.logic || null, // ✅ Add this line
            is_active: true,
            created_by: username,
            created_at: new Date().toISOString()
        };

        const { id: ruleId } = await RuleDao.createRule(ruleData);

        const conditions = parsedRule.conditions.map((cond: any) => ({
            rule_id: ruleId,
            field: cond.field,
            operator: cond.operator,
            value: cond.value,
            created_by: username,
            created_at: new Date().toISOString()
        }));

        const actions = parsedRule.actions.map((action: any) => ({
            rule_id: ruleId,
            type: action.type,
            value: action.value,
            created_by: username,
            created_at: new Date().toISOString()
        }));

        await RuleDao.createRuleConditions(conditions);
        await RuleDao.createRuleActions(actions);

        return ruleId;
    };


    static async getAllRules(
        page: number = 1,
        limit: number = 10,
        isActive?: boolean,
        department?: string
    ) {
        const offset = (page - 1) * limit;
        return await RuleDao.getAllRules(limit, offset, isActive, department);
    }

    static async getRuleById(id: string) {
        return await RuleDao.getRuleById(id);
    }

    static async updateRule(id: string, updateData: any, updatedBy: string) {
        const { conditions, actions, ...ruleData } = updateData;

        // Update rule basic data
        ruleData.updated_by = updatedBy;
        ruleData.updated_at = new Date().toISOString();

        const ruleUpdated = await RuleDao.updateRule(id, ruleData);

        if (!ruleUpdated) return false;

        // Update conditions if provided
        if (conditions && Array.isArray(conditions)) {
            await RuleDao.deleteRuleConditions(id);
            const newConditions = conditions.map((cond: any) => ({
                rule_id: id,
                field: cond.field,
                operator: cond.operator,
                value: cond.value,
                updated_by: updatedBy,
                updated_at: new Date().toISOString()
            }));
            await RuleDao.createRuleConditions(newConditions);
        }

        // Update actions if provided
        if (actions && Array.isArray(actions)) {
            await RuleDao.deleteRuleActions(id);
            const newActions = actions.map((action: any) => ({
                rule_id: id,
                type: action.type,
                value: action.value,
                updated_by: updatedBy,
                updated_at: new Date().toISOString()
            }));
            await RuleDao.createRuleActions(newActions);
        }

        return true;
    }

    static async deleteRule(id: string) {
        return await RuleDao.deleteRule(id);
    }

    static async getRulesByDepartment(
        department: string,
        page: number = 1,
        limit: number = 10,
        isActive?: boolean
    ) {
        const offset = (page - 1) * limit;
        return await RuleDao.getRulesByDepartment(department, limit, offset, isActive);
    }

    static async toggleRuleStatus(id: string, updatedBy: string) {
        return await RuleDao.toggleRuleStatus(id, updatedBy);
    }

    static async getRuleStats() {
        // Call directly the existing DAO method

        try {

            const stats = await RuleDao.getRuleStats();
            return {
                totalRules: stats.totalRules,
                activeRules: stats.activeRules,
                inactiveRules: stats.inactiveRules,
                totalDepartments: stats.totalDepartments
            };
        } catch (error) {
            console.error('Error fetching rule stats:', error);
            throw new Error('Failed to fetch rule statistics');
        }
    }
}
