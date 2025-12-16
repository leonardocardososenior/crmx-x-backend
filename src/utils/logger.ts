/**
 * Centralized logging utility for the CRM Accounts Module
 */

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: any;
  error?: Error;
}

class Logger {
  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private formatLogEntry(entry: LogEntry): string {
    const { timestamp, level, module, message, data, error } = entry;
    
    let logMessage = `[${timestamp}] ${level} [${module}] | ${message}`;
    
    if (data) {
      logMessage += ` | Data: ${JSON.stringify(data)}`;
    }
    
    if (error) {
      logMessage += `\n  Error: ${error.message}`;
      if (error.stack) {
        logMessage += `\n  Stack: ${error.stack}`;
      }
    }
    
    return logMessage;
  }

  private log(level: LogLevel, module: string, message: string, data?: any, error?: Error): void {
    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      module,
      message,
      data,
      error
    };

    const formattedMessage = this.formatLogEntry(entry);

    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.DEBUG:
        if (process.env.NODE_ENV === 'development') {
          console.log(formattedMessage);
        }
        break;
    }
  }

  error(module: string, message: string, error?: Error, data?: any): void {
    this.log(LogLevel.ERROR, module, message, data, error);
  }

  warn(module: string, message: string, data?: any): void {
    this.log(LogLevel.WARN, module, message, data);
  }

  info(module: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, module, message, data);
  }

  debug(module: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, module, message, data);
  }

  // Specific methods for common scenarios
  apiRequest(method: string, path: string, userId?: string): void {
    this.info('API', `${method} ${path}`, { userId });
  }

  apiResponse(method: string, path: string, statusCode: number, duration?: number): void {
    this.info('API', `${method} ${path} - ${statusCode}`, { statusCode, duration });
  }

  apiError(method: string, path: string, error: Error, statusCode?: number): void {
    this.error('API', `${method} ${path} - Error`, error, { statusCode });
  }

  dbQuery(operation: string, table: string, duration?: number): void {
    this.debug('DATABASE', `${operation} on ${table}`, { duration });
  }

  dbError(operation: string, table: string, error: Error): void {
    this.error('DATABASE', `${operation} on ${table} failed`, error);
  }

  authAttempt(success: boolean, reason?: string): void {
    if (success) {
      this.info('AUTH', 'Authentication successful');
    } else {
      this.warn('AUTH', 'Authentication failed', { reason });
    }
  }

  filterParsing(filter: string, success: boolean, error?: Error): void {
    if (success) {
      this.debug('FILTER', 'Filter parsed successfully', { filter });
    } else {
      this.error('FILTER', 'Filter parsing failed', error, { filter });
    }
  }

  serverStart(port: number): void {
    this.info('SERVER', `CRM Accounts Module started on port ${port}`);
  }

  serverError(error: Error): void {
    this.error('SERVER', 'Server error occurred', error);
  }

  // Business proposal specific logging methods
  proposalOperation(operation: string, proposalId?: string, userId?: string, data?: any): void {
    this.info('BUSINESS_PROPOSAL', `${operation} operation`, { proposalId, userId, ...data });
  }

  proposalError(operation: string, error: Error, proposalId?: string, userId?: string): void {
    this.error('BUSINESS_PROPOSAL', `${operation} operation failed`, error, { proposalId, userId });
  }

  proposalItemOperation(operation: string, itemId?: string, proposalId?: string, data?: any): void {
    this.info('PROPOSAL_ITEM', `${operation} operation`, { itemId, proposalId, ...data });
  }

  proposalItemError(operation: string, error: Error, itemId?: string, proposalId?: string): void {
    this.error('PROPOSAL_ITEM', `${operation} operation failed`, error, { itemId, proposalId });
  }

  // Enhanced request/response logging with more context
  requestWithContext(method: string, path: string, requestId?: string, userId?: string, data?: any): void {
    this.info('API_REQUEST', `${method} ${path}`, { requestId, userId, ...data });
  }

  responseWithContext(method: string, path: string, statusCode: number, requestId?: string, duration?: number): void {
    this.info('API_RESPONSE', `${method} ${path} - ${statusCode}`, { requestId, statusCode, duration });
  }

  // Security and constraint violation logging
  constraintViolation(constraintType: string, tableName: string, details?: string, requestId?: string): void {
    this.warn('CONSTRAINT', `${constraintType} constraint violation on ${tableName}`, { 
      constraintType, 
      tableName, 
      details, 
      requestId 
    });
  }

  securityEvent(eventType: string, details: string, requestId?: string, userId?: string): void {
    this.warn('SECURITY', `Security event: ${eventType}`, { eventType, details, requestId, userId });
  }

  // Performance monitoring
  performanceMetric(operation: string, duration: number, metadata?: any): void {
    const level = duration > 5000 ? LogLevel.WARN : LogLevel.INFO;
    this.log(level, 'PERFORMANCE', `${operation} completed in ${duration}ms`, metadata);
  }

  // Database connection monitoring
  dbConnectionEvent(event: string, details?: any): void {
    this.info('DB_CONNECTION', event, details);
  }

  // Rate limiting events
  rateLimitEvent(identifier: string, limit: number, current: number, requestId?: string): void {
    this.warn('RATE_LIMIT', `Rate limit approached for ${identifier}`, {
      identifier,
      limit,
      current,
      percentage: Math.round((current / limit) * 100),
      requestId
    });
  }

  // Business logic validation errors
  businessValidationError(rule: string, entity: string, entityId?: string, details?: any): void {
    this.warn('BUSINESS_VALIDATION', `Business rule violation: ${rule} for ${entity}`, {
      rule,
      entity,
      entityId,
      ...details
    });
  }
}

// Export singleton instance
export const logger = new Logger();