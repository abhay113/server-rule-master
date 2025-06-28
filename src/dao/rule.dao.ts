import { supabase } from '../config/supabase.client';


export class RuleDao {


    // get rules

    static async getAllRules(limit: number, offset: number, isActive?: boolean) {
        let query = supabase
            .from('rules')
            .select(`
        *,
        rule_conditions (*),
        rule_actions (*)
      `)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (isActive !== undefined) {
            query = query.eq('is_active', isActive);
        }

        const { data: rules, error } = await query;
        if (error) throw error;

        // Get total count
        let countQuery = supabase
            .from('rules')
            .select('*', { count: 'exact', head: true });

        if (isActive !== undefined) {
            countQuery = countQuery.eq('is_active', isActive);
        }

        const { count, error: countError } = await countQuery;
        if (countError) throw countError;

        return {
            rules: rules || [],
            total: count || 0
        };
    }

    static async getRuleById(id: string) {
        const { data, error } = await supabase
            .from('rules')
            .select(`
        *,
        rule_conditions (*),
        rule_actions (*)
      `)
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // No rows found
            throw error;
        }

        return data;
    }

    static async updateRule(id: string, updateData: any) {
        const { error } = await supabase
            .from('rules')
            .update(updateData)
            .eq('id', id)
            .select('id')
            .single();

        if (error) {
            if (error.code === 'PGRST116') return false; // No rows found
            throw error;
        }

        return true;
    }

    static async deleteRule(id: string) {
        // First delete related conditions and actions
        await this.deleteRuleConditions(id);
        await this.deleteRuleActions(id);

        // Then delete the rule
        const { error } = await supabase
            .from('rules')
            .delete()
            .eq('id', id)
            .select('id')
            .single();

        if (error) {
            if (error.code === 'PGRST116') return false; // No rows found
            throw error;
        }

        return true;
    }

    static async deleteRuleConditions(ruleId: string) {
        const { error } = await supabase
            .from('rule_conditions')
            .delete()
            .eq('rule_id', ruleId);

        if (error) throw error;
    }

    static async deleteRuleActions(ruleId: string) {
        const { error } = await supabase
            .from('rule_actions')
            .delete()
            .eq('rule_id', ruleId);

        if (error) throw error;
    }

    //get ends


    // create rules 
    static async createRule(rule: any) {
        const { data, error } = await supabase
            .from('rules')
            .insert(rule)
            .select('id')
            .single();
        if (error) throw error;
        return data;
    };

    static async createRuleConditions(conditions: any[]) {
        const { error } = await supabase.from('rule_conditions').insert(conditions);
        if (error) throw error;
    };

    static async createRuleActions(actions: any[]) {
        const { error } = await supabase.from('rule_actions').insert(actions);
        if (error) throw error;
    };

    static async getRulesByDepartment(
        department: string,
        limit: number,
        offset: number,
        isActive?: boolean
    ) {
        let query = supabase
            .from('rules')
            .select(`
        *,
        rule_conditions (*),
        rule_actions (*)
      `)
            .ilike('department', department) // ✅ Case-insensitive exact match
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (isActive !== undefined) {
            query = query.eq('is_active', isActive);
        }

        const { data: rules, error } = await query;
        if (error) throw error;

        // Get total count for this department
        let countQuery = supabase
            .from('rules')
            .select('*', { count: 'exact', head: true })
            .eq('department', department);

        if (isActive !== undefined) {
            countQuery = countQuery.eq('is_active', isActive);
        }

        const { count, error: countError } = await countQuery;
        if (countError) throw countError;

        return {
            rules: rules || [],
            total: count || 0
        };
    }


    static async toggleRuleStatus(id: string, updatedBy: string) {
        // First get current status
        const { data: currentRule, error: fetchError } = await supabase
            .from('rules')
            .select('is_active')
            .eq('id', id)
            .single();

        if (fetchError) {
            if (fetchError.code === 'PGRST116') return null; // No rows found
            throw fetchError;
        }

        const newStatus = !currentRule.is_active;

        // Update with new status
        const { error: updateError } = await supabase
            .from('rules')
            .update({
                is_active: newStatus,
                updated_by: updatedBy,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (updateError) throw updateError;

        return newStatus;
    }


    static async getDepartments() {
        const { data, error } = await supabase
            .from('rules')
            .select('department')
            .not('department', 'is', null);

        if (error) throw error;

        // Get unique departments
        const departments = [...new Set(data.map(rule => rule.department))];
        return departments;
    }

    static async getRuleStats() {
        const { data: totalRules, error: totalError } = await supabase
            .from('rules')
            .select('*', { count: 'exact', head: true });

        const { data: activeRules, error: activeError } = await supabase
            .from('rules')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true);

        const { data: departments, error: deptError } = await supabase
            .from('rules')
            .select('department')
            .not('department', 'is', null);

        if (totalError || activeError || deptError) {
            throw totalError || activeError || deptError;
        }

        const uniqueDepartments = [...new Set(departments.map(rule => rule.department))];

        return {
            totalRules: totalRules.length,
            activeRules: activeRules.length,
            inactiveRules: totalRules.length - activeRules.length,
            totalDepartments: uniqueDepartments.length
        };
    }

} 