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
    
    let logMessage = `[${timestamp}] ${level} [${module}] ${message}`;
    
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
}

// Export singleton instance
export const logger = new Logger();