import { AccountStatuses, AccountTypes, isValidAccountStatus, isValidAccountType } from '../types';
import { logger } from './logger';

// Allowed fields for filtering
const ALLOWED_FIELDS = {
  // Account fields (snake_case for database)
  'id': 'id',
  'name': 'name',
  'segment': 'segment',
  'status': 'status',
  'type': 'type',
  'pipeline': 'pipeline',
  'email': 'email',
  'phone': 'phone',
  'cnpj': 'cnpj',
  'instagram': 'instagram',
  'linkedin': 'linkedin',
  'whatsapp': 'whatsapp',
  'created_at': 'created_at',
  'last_interaction': 'last_interaction',
  
  // Owner relationship fields (will be handled with joins)
  'owner.id': 'profiles.id',
  'owner.name': 'profiles.name',
  'owner.email': 'profiles.email',
  'owner.role': 'profiles.role'
} as const;

// Allowed operators
const ALLOWED_OPERATORS = ['=', '!=', '<>', '<', '>', '<=', '>=', 'LIKE', 'ILIKE', 'IN', 'NOT IN'] as const;

// Allowed logical operators
const LOGICAL_OPERATORS = ['AND', 'OR'] as const;

interface FilterCondition {
  field: string;
  operator: string;
  value: string | string[];
  logicalOperator?: 'AND' | 'OR';
}

interface ParsedFilter {
  conditions: FilterCondition[];
  hasOwnerFilter: boolean;
}

/**
 * Sanitizes a value to prevent SQL injection
 */
function sanitizeValue(value: string): string {
  // Remove dangerous characters and patterns
  return value
    .replace(/[';\\]/g, '') // Remove semicolons and backslashes
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove block comment start
    .replace(/\*\//g, '') // Remove block comment end
    .replace(/\bDROP\b/gi, '') // Remove DROP statements
    .replace(/\bDELETE\b/gi, '') // Remove DELETE statements
    .replace(/\bUPDATE\b/gi, '') // Remove UPDATE statements
    .replace(/\bINSERT\b/gi, '') // Remove INSERT statements
    .replace(/\bALTER\b/gi, '') // Remove ALTER statements
    .replace(/\bCREATE\b/gi, '') // Remove CREATE statements
    .replace(/\bEXEC\b/gi, '') // Remove EXEC statements
    .replace(/\bUNION\b/gi, '') // Remove UNION statements
    .trim();
}

/**
 * Validates field values based on their type
 */
function validateFieldValue(field: string, value: string): boolean {
  switch (field) {
    case 'status':
      return isValidAccountStatus(value);
    case 'type':
      return isValidAccountType(value);
    case 'id':
    case 'owner.id':
      // UUID validation
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(value);
    case 'email':
    case 'owner.email':
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    default:
      // For other fields, just check it's not empty and doesn't contain dangerous patterns
      return value.length > 0 && !/[<>{}]/.test(value);
  }
}

/**
 * Parses a filter string into structured conditions
 * Example: "status = 'ACTIVE' AND type = 'Lead' OR owner.name = 'Lucas'"
 */
export function parseFilter(filterString: string): ParsedFilter {
  if (!filterString || filterString.trim() === '') {
    return { conditions: [], hasOwnerFilter: false };
  }

  const conditions: FilterCondition[] = [];
  let hasOwnerFilter = false;

  // More robust parsing that handles quoted values properly
  const parseConditions = (str: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    let i = 0;

    while (i < str.length) {
      const char = str[i];
      
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
        current += char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
        current += char;
      } else if (!inQuotes && str.substring(i).match(/^\s+(AND|OR)\s+/i)) {
        // Found logical operator outside quotes
        const match = str.substring(i).match(/^\s+(AND|OR)\s+/i);
        if (match) {
          result.push(current.trim());
          result.push(match[1].toUpperCase());
          current = '';
          i += match[0].length - 1;
        }
      } else {
        current += char;
      }
      i++;
    }
    
    if (current.trim()) {
      result.push(current.trim());
    }
    
    return result;
  };

  const tokens = parseConditions(filterString);
  let currentLogicalOperator: 'AND' | 'OR' | undefined;

  for (const token of tokens) {
    // Check if this token is a logical operator
    if (LOGICAL_OPERATORS.some(op => op === token)) {
      currentLogicalOperator = token as 'AND' | 'OR';
      continue;
    }

    // Parse condition: field operator value
    const conditionMatch = token.match(/^(\w+(?:\.\w+)?)\s*(=|!=|<>|<=|>=|<|>|LIKE|ILIKE|IN|NOT IN)\s*(.+)$/i);
    
    if (!conditionMatch) {
      throw new Error(`Invalid filter condition: ${token}`);
    }

    const [, fieldName, operator, valueStr] = conditionMatch;

    // Validate field name
    if (!(fieldName in ALLOWED_FIELDS)) {
      throw new Error(`Invalid field: ${fieldName}. Allowed fields: ${Object.keys(ALLOWED_FIELDS).join(', ')}`);
    }

    // Validate operator
    if (!ALLOWED_OPERATORS.some(op => op.toLowerCase() === operator.toLowerCase())) {
      throw new Error(`Invalid operator: ${operator}. Allowed operators: ${ALLOWED_OPERATORS.join(', ')}`);
    }

    // Parse value(s)
    let value: string | string[];
    
    if (operator.toUpperCase().includes('IN')) {
      // Handle IN/NOT IN operators with array values
      const inMatch = valueStr.match(/^\((.+)\)$/);
      if (!inMatch) {
        throw new Error(`IN operator requires parentheses: ${valueStr}`);
      }
      
      value = inMatch[1]
        .split(',')
        .map(v => {
          const trimmed = v.trim().replace(/^['"]|['"]$/g, ''); // Remove quotes
          const sanitized = sanitizeValue(trimmed);
          
          if (!validateFieldValue(fieldName, sanitized)) {
            throw new Error(`Invalid value for field ${fieldName}: ${sanitized}`);
          }
          
          return sanitized;
        });
    } else {
      // Handle single value
      const singleValue = valueStr.replace(/^['"]|['"]$/g, ''); // Remove quotes
      const sanitized = sanitizeValue(singleValue);
      
      if (!validateFieldValue(fieldName, sanitized)) {
        throw new Error(`Invalid value for field ${fieldName}: ${sanitized}`);
      }
      
      value = sanitized;
    }

    // Check if this is an owner filter
    if (fieldName.startsWith('owner.')) {
      hasOwnerFilter = true;
    }

    conditions.push({
      field: fieldName,
      operator: operator.toUpperCase(),
      value,
      logicalOperator: currentLogicalOperator
    });

    // Reset logical operator after using it
    currentLogicalOperator = undefined;
  }

  return { conditions, hasOwnerFilter };
}

/**
 * Converts parsed filter conditions to Supabase query filters
 */
export function applyFiltersToQuery(query: any, parsedFilter: ParsedFilter): any {
  if (parsedFilter.conditions.length === 0) {
    return query;
  }

  // If we have owner filters, we need to join with profiles table
  if (parsedFilter.hasOwnerFilter) {
    query = query.select(`
      *,
      profiles!owner_id (
        id,
        name,
        email,
        role
      )
    `);
  }

  // Apply each condition sequentially for simplicity
  for (const condition of parsedFilter.conditions) {
    const dbField = ALLOWED_FIELDS[condition.field as keyof typeof ALLOWED_FIELDS];

    if (condition.field.startsWith('owner.')) {
      // Handle owner relationship filters - skip for now as they're complex
      logger.warn('FILTER', 'Owner filters not yet implemented', { field: condition.field });
      continue;
    }

    // Handle direct field filters
    switch (condition.operator) {
      case '=':
        query = query.eq(dbField, condition.value);
        break;
      case '!=':
      case '<>':
        query = query.neq(dbField, condition.value);
        break;
      case '<':
        query = query.lt(dbField, condition.value);
        break;
      case '>':
        query = query.gt(dbField, condition.value);
        break;
      case '<=':
        query = query.lte(dbField, condition.value);
        break;
      case '>=':
        query = query.gte(dbField, condition.value);
        break;
      case 'LIKE':
        // For LIKE, use the value as-is (user provides the % wildcards)
        query = query.like(dbField, condition.value as string);
        break;
      case 'ILIKE':
        // For ILIKE, use the value as-is (user provides the % wildcards)
        query = query.ilike(dbField, condition.value as string);
        break;
      case 'IN':
        if (Array.isArray(condition.value)) {
          query = query.in(dbField, condition.value);
        }
        break;
      case 'NOT IN':
        if (Array.isArray(condition.value)) {
          query = query.not(dbField, 'in', condition.value);
        }
        break;
    }
  }

  return query;
}