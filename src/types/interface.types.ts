
export interface User {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface OnboardUser extends User {
  groupName: string;
  roleName: string;
}

export interface Rule {
  id: string; // UUID
  title: string;
  department: string;
  is_active: boolean;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
}


export interface RuleCondition {
  id: string; // UUID
  rule_id: string;
  field: string;
  operator: string;
  value: string;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
}


export interface RuleAction {
  id: string; // UUID
  rule_id: string;
  type: string;
  value: string;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RuleWithDetails extends Rule {
  conditions: RuleCondition[];
  actions: RuleAction[];
}


export interface Condition {
  id: string;
  field: string;
  operator: string;
  value: string | number | string[];
};

export interface ParsedRule {
  rule: {
    title: string;
    department: string;
  };
  logic: string;
  conditions: Condition[];
  actions: { type: string; value: string }[];
};
