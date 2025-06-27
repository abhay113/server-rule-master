import { supabase } from '../config/supabase.client';

export const createRule = async (rule: any) => {
    const { data, error } = await supabase
        .from('rules')
        .insert(rule)
        .select('id')
        .single();
    if (error) throw error;
    return data;
};

export const createRuleConditions = async (conditions: any[]) => {
    const { error } = await supabase.from('rule_conditions').insert(conditions);
    if (error) throw error;
};

export const createRuleActions = async (actions: any[]) => {
    const { error } = await supabase.from('rule_actions').insert(actions);
    if (error) throw error;
};
