export const normalizeOperator = (operator: string): string => {
    const map: Record<string, string> = {
        'is': '=',
        'equals': '=',
        'equal to': '=',
        'is equal to': '=',
        'not equal to': '!=',
        'is not': '!=',
        'greater than': '>',
        'more than': '>',
        'less than': '<',
        'fewer than': '<',
        'greater than or equal to': '>=',
        'at least': '>=',
        'less than or equal to': '<=',
        'at most': '<=',
        'in': 'IN',
        'is in': 'IN',
        'not in': 'NOT IN',
        'is not in': 'NOT IN',
        'contains': 'LIKE',
        'does not contain': 'NOT LIKE',
        'starts with': 'LIKE',
        'ends with': 'LIKE',
        'between': 'BETWEEN',
        'is null': 'IS NULL',
        'is not null': 'IS NOT NULL',
        // Allow fallback for actual symbols
        '=': '=', '!=': '!=', '>': '>', '<': '<', '>=': '>=', '<=': '<=',
    };

    return map[operator.trim().toLowerCase()] || operator;
};
