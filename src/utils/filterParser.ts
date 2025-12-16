import { 
  AccountStatuses, 
  AccountTypes, 
  BusinessStages,
  Currencies,
  ItemTypes,
  TimelineTypes,
  UserRoles,
  isValidAccountStatus, 
  isValidAccountType,
  isValidBusinessStage,
  isValidCurrency,
  isValidItemType,
  isValidTimelineType,
  isValidUserRole
} from '../types';
import { logger } from './logger';

// Entity field mappings - defines allowed fields for each entity
const ENTITY_FIELDS = {
  // Account entity fields
  account: {
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
    'responsible_id': 'responsible_id',
    // Relationships - now using object structure
    'responsible.id': 'users!responsible_id.id',
    'responsible.name': 'users!responsible_id.name',
    'responsible.email': 'users!responsible_id.email',
    'responsible.role': 'users!responsible_id.role'
  },
  
  // Business entity fields
  business: {
    'id': 'id',
    'title': 'title',
    'account_id': 'account_id',
    'value': 'value',
    'currency': 'currency',
    'stage': 'stage',
    'probability': 'probability',
    'responsible_id': 'responsible_id',
    'closing_date': 'closing_date',
    'created_at': 'created_at',
    // Relationships - now using object structure
    'account.id': 'account!account_id.id',
    'account.name': 'account!account_id.name',
    'account.segment': 'account!account_id.segment',
    'account.status': 'account!account_id.status',
    'account.type': 'account!account_id.type',
    'responsible.id': 'users!responsible_id.id',
    'responsible.name': 'users!responsible_id.name',
    'responsible.email': 'users!responsible_id.email',
    'responsible.role': 'users!responsible_id.role'
  },
  
  // User entity fields
  users: {
    'id': 'id',
    'name': 'name',
    'role': 'role',
    'manager_id': 'manager_id',
    'email': 'email',
    'created_at': 'created_at',
    // Relationships - now using object structure
    'manager.id': 'users!manager_id.id',
    'manager.name': 'users!manager_id.name',
    'manager.email': 'users!manager_id.email',
    'manager.role': 'users!manager_id.role'
  },
  
  // Item entity fields
  item: {
    'id': 'id',
    'name': 'name',
    'type': 'type',
    'price': 'price',
    'sku_code': 'sku_code',
    'description': 'description',
    'created_at': 'created_at'
  },
  
  // Account Timeline entity fields
  account_timeline: {
    'id': 'id',
    'account_id': 'account_id',
    'type': 'type',
    'title': 'title',
    'description': 'description',
    'date': 'date',
    'responsible_id': 'responsible_id',
    'created_at': 'created_at',
    // Relationships - now using object structure
    'account.id': 'account!account_id.id',
    'account.name': 'account!account_id.name',
    'account.segment': 'account!account_id.segment',
    'account.status': 'account!account_id.status',
    'account.type': 'account!account_id.type',
    'responsible.id': 'users!responsible_id.id',
    'responsible.name': 'users!responsible_id.name',
    'responsible.email': 'users!responsible_id.email',
    'responsible.role': 'users!responsible_id.role'
  }
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
  hasRelationshipFilter: boolean;
  relationshipFields: Set<string>;
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
 * Validates field values based on their type and entity context
 */
function validateFieldValue(field: string, value: string, entity?: string): boolean {
  // Extract base field name (remove relationship prefix)
  const baseField = field.includes('.') ? field.split('.')[1] : field;
  
  // UUID validation for ID fields
  if (baseField === 'id' || field.endsWith('_id')) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }
  
  // Email validation
  if (baseField === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }
  
  // Enum validations based on field name
  switch (baseField) {
    case 'status':
      return isValidAccountStatus(value);
    case 'type':
      if (entity === 'account') return isValidAccountType(value);
      if (entity === 'item') return isValidItemType(value);
      if (entity === 'account_timeline') return isValidTimelineType(value);
      return true;
    case 'role':
      return isValidUserRole(value);
    case 'stage':
      return isValidBusinessStage(value);
    case 'currency':
      return isValidCurrency(value);
    case 'price':
    case 'value':
    case 'probability':
      // Numeric validation
      return !isNaN(Number(value)) && Number(value) >= 0;
    case 'date':
    case 'closing_date':
    case 'created_at':
    case 'last_interaction':
      // ISO date validation
      return !isNaN(Date.parse(value));
    default:
      // For other fields, just check it's not empty and doesn't contain dangerous patterns
      return value.length > 0 && !/[<>{}]/.test(value);
  }
}

/**
 * Parses a filter string into structured conditions
 * Example: "status = 'ACTIVE' AND type = 'Lead' OR owner.name = 'Lucas'"
 */
export function parseFilter(filterString: string, entity?: string): ParsedFilter {
  if (!filterString || filterString.trim() === '') {
    return { conditions: [], hasRelationshipFilter: false, relationshipFields: new Set() };
  }

  const conditions: FilterCondition[] = [];
  let hasRelationshipFilter = false;
  const relationshipFields = new Set<string>();

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

    // Validate field name against entity fields
    const entityFields = entity ? ENTITY_FIELDS[entity as keyof typeof ENTITY_FIELDS] : null;
    if (entityFields && !(fieldName in entityFields)) {
      throw new Error(`Invalid field: ${fieldName} for entity ${entity}. Allowed fields: ${Object.keys(entityFields).join(', ')}`);
    }
    
    // If no entity specified, check if field exists in any entity (for backward compatibility)
    if (!entityFields) {
      const fieldExists = Object.values(ENTITY_FIELDS).some(fields => fieldName in fields);
      if (!fieldExists) {
        throw new Error(`Invalid field: ${fieldName}. Field not found in any entity.`);
      }
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
          
          if (!validateFieldValue(fieldName, sanitized, entity)) {
            throw new Error(`Invalid value for field ${fieldName}: ${sanitized}`);
          }
          
          return sanitized;
        });
    } else {
      // Handle single value
      const singleValue = valueStr.replace(/^['"]|['"]$/g, ''); // Remove quotes
      const sanitized = sanitizeValue(singleValue);
      
      if (!validateFieldValue(fieldName, sanitized, entity)) {
        throw new Error(`Invalid value for field ${fieldName}: ${sanitized}`);
      }
      
      value = sanitized;
    }

    // Check if this is a relationship filter
    if (fieldName.includes('.')) {
      hasRelationshipFilter = true;
      const relationshipName = fieldName.split('.')[0];
      relationshipFields.add(relationshipName);
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

  return { conditions, hasRelationshipFilter, relationshipFields };
}

/**
 * Converts parsed filter conditions to Supabase query filters
 * Uses advanced filter parser for relationship filters
 */
export function applyFiltersToQuery(query: any, parsedFilter: ParsedFilter, entity?: string): any {
  if (parsedFilter.conditions.length === 0) {
    return query;
  }

  // If we have relationship filters, use the advanced parser
  if (parsedFilter.hasRelationshipFilter) {
    const { parseAdvancedFilter, applyAdvancedFiltersToQuery } = require('./advancedFilterParser');
    
    // Convert conditions back to filter string for advanced parsing
    const filterString = parsedFilter.conditions.map(condition => {
      let valueStr = '';
      if (Array.isArray(condition.value)) {
        valueStr = `(${condition.value.map(v => `'${v}'`).join(',')})`;
      } else {
        valueStr = `'${condition.value}'`;
      }
      
      let conditionStr = `${condition.field} ${condition.operator} ${valueStr}`;
      if (condition.logicalOperator) {
        conditionStr = `${condition.logicalOperator} ${conditionStr}`;
      }
      return conditionStr;
    }).join(' ');
    
    const advancedFilter = parseAdvancedFilter(filterString, entity);
    return applyAdvancedFiltersToQuery(query, advancedFilter, entity);
  }

  const entityFields = entity ? ENTITY_FIELDS[entity as keyof typeof ENTITY_FIELDS] : null;

  // Apply each condition for direct fields only
  for (const condition of parsedFilter.conditions) {
    let dbField: string;
    
    if (entityFields && condition.field in entityFields) {
      dbField = entityFields[condition.field as keyof typeof entityFields];
    } else {
      // Fallback: use field name as-is for direct fields
      dbField = condition.field;
    }

    // Skip relationship filters (handled by advanced parser)
    if (condition.field.includes('.')) {
      continue;
    }

    // Handle direct field filters
    try {
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
          query = query.like(dbField, condition.value as string);
          break;
        case 'ILIKE':
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
    } catch (error) {
      logger.error('FILTER', 'Error applying filter condition', error as Error, { 
        filterField: condition.field,
        operator: condition.operator,
        value: condition.value
      });
      throw new Error(`Failed to apply filter for field ${condition.field}: ${(error as Error).message}`);
    }
  }

  return query;
}

/**
 * Helper function to get entity name from table name
 */
export function getEntityFromTable(tableName: string): string {
  const tableToEntity: Record<string, string> = {
    'account': 'account',
    'business': 'business', 
    'users': 'users',
    'item': 'item',
    'account_timeline': 'account_timeline'
  };
  
  return tableToEntity[tableName] || tableName;
}