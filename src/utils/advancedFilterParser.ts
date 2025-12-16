import { logger } from './logger';

/**
 * Advanced filter parser that handles relationship filters using PostgREST syntax
 * This extends the basic filter parser to support complex relationship queries
 */

interface RelationshipFilter {
  relationshipName: string;
  fieldName: string;
  operator: string;
  value: string | string[];
  logicalOperator?: 'AND' | 'OR';
}

interface AdvancedParsedFilter {
  directFilters: Array<{
    field: string;
    operator: string;
    value: string | string[];
    logicalOperator?: 'AND' | 'OR';
  }>;
  relationshipFilters: RelationshipFilter[];
  hasRelationshipFilter: boolean;
}

/**
 * Parses filters and separates direct field filters from relationship filters
 */
export function parseAdvancedFilter(filterString: string, entity?: string): AdvancedParsedFilter {
  if (!filterString || filterString.trim() === '') {
    return { 
      directFilters: [], 
      relationshipFilters: [], 
      hasRelationshipFilter: false 
    };
  }

  const directFilters: Array<{
    field: string;
    operator: string;
    value: string | string[];
    logicalOperator?: 'AND' | 'OR';
  }> = [];
  
  const relationshipFilters: RelationshipFilter[] = [];
  let hasRelationshipFilter = false;

  // Parse conditions similar to the basic parser
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
    if (['AND', 'OR'].includes(token)) {
      currentLogicalOperator = token as 'AND' | 'OR';
      continue;
    }

    // Parse condition: field operator value
    const conditionMatch = token.match(/^(\w+(?:\.\w+)?)\s*(=|!=|<>|<=|>=|<|>|LIKE|ILIKE|IN|NOT IN)\s*(.+)$/i);
    
    if (!conditionMatch) {
      throw new Error(`Invalid filter condition: ${token}`);
    }

    const [, fieldName, operator, valueStr] = conditionMatch;

    // Parse value(s)
    let value: string | string[];
    
    if (operator.toUpperCase().includes('IN')) {
      const inMatch = valueStr.match(/^\((.+)\)$/);
      if (!inMatch) {
        throw new Error(`IN operator requires parentheses: ${valueStr}`);
      }
      
      value = inMatch[1]
        .split(',')
        .map(v => v.trim().replace(/^['"]|['"]$/g, ''));
    } else {
      value = valueStr.replace(/^['"]|['"]$/g, '');
    }

    // Determine if this is a relationship filter
    if (fieldName.includes('.')) {
      hasRelationshipFilter = true;
      const [relationshipName, relFieldName] = fieldName.split('.');
      
      relationshipFilters.push({
        relationshipName,
        fieldName: relFieldName,
        operator: operator.toUpperCase(),
        value,
        logicalOperator: currentLogicalOperator
      });
    } else {
      directFilters.push({
        field: fieldName,
        operator: operator.toUpperCase(),
        value,
        logicalOperator: currentLogicalOperator
      });
    }

    currentLogicalOperator = undefined;
  }

  return { directFilters, relationshipFilters, hasRelationshipFilter };
}

/**
 * Applies advanced filters to Supabase query with proper relationship handling
 */
export function applyAdvancedFiltersToQuery(query: any, parsedFilter: AdvancedParsedFilter, entity?: string): any {
  // Apply direct field filters first
  for (const condition of parsedFilter.directFilters) {
    try {
      switch (condition.operator) {
        case '=':
          query = query.eq(condition.field, condition.value);
          break;
        case '!=':
        case '<>':
          query = query.neq(condition.field, condition.value);
          break;
        case '<':
          query = query.lt(condition.field, condition.value);
          break;
        case '>':
          query = query.gt(condition.field, condition.value);
          break;
        case '<=':
          query = query.lte(condition.field, condition.value);
          break;
        case '>=':
          query = query.gte(condition.field, condition.value);
          break;
        case 'LIKE':
          query = query.like(condition.field, condition.value as string);
          break;
        case 'ILIKE':
          query = query.ilike(condition.field, condition.value as string);
          break;
        case 'IN':
          if (Array.isArray(condition.value)) {
            query = query.in(condition.field, condition.value);
          }
          break;
        case 'NOT IN':
          if (Array.isArray(condition.value)) {
            query = query.not(condition.field, 'in', condition.value);
          }
          break;
      }
    } catch (error) {
      logger.error('FILTER', 'Error applying direct filter condition', error as Error, { 
        filterField: condition.field,
        operator: condition.operator,
        value: condition.value
      });
      throw new Error(`Failed to apply filter for field ${condition.field}: ${(error as Error).message}`);
    }
  }

  // Handle relationship filters using PostgREST syntax
  if (parsedFilter.hasRelationshipFilter) {
    // Build select clause with relationships
    const selectFields = ['*'];
    const relationshipSelects = new Set<string>();

    // Group relationship filters by relationship name
    const relationshipGroups = new Map<string, RelationshipFilter[]>();
    
    for (const relFilter of parsedFilter.relationshipFilters) {
      if (!relationshipGroups.has(relFilter.relationshipName)) {
        relationshipGroups.set(relFilter.relationshipName, []);
      }
      relationshipGroups.get(relFilter.relationshipName)!.push(relFilter);
    }

    // Build relationship selects and filters
    for (const [relationshipName, filters] of relationshipGroups) {
      let relationshipSelect = '';
      let relationshipTable = '';
      let foreignKey = '';

      // Map relationship names to table and foreign key
      switch (relationshipName) {
        case 'responsible':
          relationshipTable = 'users';
          foreignKey = 'responsible_id';
          relationshipSelect = 'users!responsible_id(id,name,email,role)';
          break;
        case 'responsible':
          relationshipTable = 'users';
          foreignKey = 'responsible_id';
          relationshipSelect = 'users!responsible_id(id,name,email,role)';
          break;
        case 'manager':
          relationshipTable = 'users';
          foreignKey = 'manager_id';
          relationshipSelect = 'users!manager_id(id,name,email,role)';
          break;
        case 'account':
          relationshipTable = 'account';
          foreignKey = 'account_id';
          relationshipSelect = 'account!account_id(id,name,segment,status,type)';
          break;
        case 'responsible':
          relationshipTable = 'users';
          foreignKey = 'responsible_id';
          relationshipSelect = 'users!responsible_id(id,name,email,role)';
          break;
        default:
          logger.warn('FILTER', 'Unknown relationship', { relationshipName });
          continue;
      }

      relationshipSelects.add(relationshipSelect);

      // Apply relationship filters using PostgREST syntax
      for (const filter of filters) {
        const relationshipFilterField = `${relationshipTable}.${filter.fieldName}`;
        
        try {
          switch (filter.operator) {
            case '=':
              query = query.eq(relationshipFilterField, filter.value);
              break;
            case '!=':
            case '<>':
              query = query.neq(relationshipFilterField, filter.value);
              break;
            case '<':
              query = query.lt(relationshipFilterField, filter.value);
              break;
            case '>':
              query = query.gt(relationshipFilterField, filter.value);
              break;
            case '<=':
              query = query.lte(relationshipFilterField, filter.value);
              break;
            case '>=':
              query = query.gte(relationshipFilterField, filter.value);
              break;
            case 'LIKE':
              query = query.like(relationshipFilterField, filter.value as string);
              break;
            case 'ILIKE':
              query = query.ilike(relationshipFilterField, filter.value as string);
              break;
            case 'IN':
              if (Array.isArray(filter.value)) {
                query = query.in(relationshipFilterField, filter.value);
              }
              break;
            case 'NOT IN':
              if (Array.isArray(filter.value)) {
                query = query.not(relationshipFilterField, 'in', filter.value);
              }
              break;
          }
        } catch (error) {
          logger.warn('FILTER', 'Relationship filter may not be supported by PostgREST', { 
            relationshipName,
            field: filter.fieldName,
            operator: filter.operator,
            value: filter.value,
            error: (error as Error).message
          });
          // Continue with other filters even if this one fails
        }
      }
    }

    // Update select clause if we have relationship filters
    if (relationshipSelects.size > 0) {
      selectFields.push(...Array.from(relationshipSelects));
      query = query.select(selectFields.join(','), { count: 'exact' });
    }
  }

  return query;
}