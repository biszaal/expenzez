// Production-ready logging utility
interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

const LOG_LEVELS: LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

class Logger {
  private isDevelopment: boolean;
  
  constructor() {
    this.isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const logData = data ? ` | Data: ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${logData}`;
  }

  private shouldLog(level: string): boolean {
    if (this.isDevelopment) return true;
    
    // In production, only log errors and warnings
    return level === LOG_LEVELS.ERROR || level === LOG_LEVELS.WARN;
  }

  private async sendToMonitoring(level: string, message: string, data?: any): Promise<void> {
    // In production, send to monitoring service (Sentry, AWS CloudWatch, etc.)
    if (!this.isDevelopment && (level === LOG_LEVELS.ERROR || level === LOG_LEVELS.WARN)) {
      try {
        // Example: Send to monitoring service
        // await crashlytics().recordError(new Error(message));
        // await analytics().logEvent('app_error', { level, message, data });
      } catch (error) {
        // Fallback - don't let logging errors crash the app
        console.error('Failed to send log to monitoring:', error);
      }
    }
  }

  error(message: string, data?: any): void {
    if (this.shouldLog(LOG_LEVELS.ERROR)) {
      console.error(this.formatMessage(LOG_LEVELS.ERROR, message, data));
    }
    this.sendToMonitoring(LOG_LEVELS.ERROR, message, data);
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog(LOG_LEVELS.WARN)) {
      console.warn(this.formatMessage(LOG_LEVELS.WARN, message, data));
    }
    this.sendToMonitoring(LOG_LEVELS.WARN, message, data);
  }

  info(message: string, data?: any): void {
    if (this.shouldLog(LOG_LEVELS.INFO)) {
      console.info(this.formatMessage(LOG_LEVELS.INFO, message, data));
    }
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.debug(this.formatMessage(LOG_LEVELS.DEBUG, message, data));
    }
  }

  // API-specific logging
  apiRequest(method: string, url: string, data?: any): void {
    this.debug(`API Request: ${method} ${url}`, data);
  }

  apiResponse(method: string, url: string, status: number, data?: any): void {
    const level = status >= 400 ? LOG_LEVELS.ERROR : LOG_LEVELS.DEBUG;
    const message = `API Response: ${method} ${url} - ${status}`;
    
    if (level === LOG_LEVELS.ERROR) {
      this.error(message, data);
    } else {
      this.debug(message, data);
    }
  }

  // Security-specific logging
  securityEvent(event: string, details?: any): void {
    this.warn(`Security Event: ${event}`, details);
  }

  // Banking-specific logging
  bankingOperation(operation: string, success: boolean, details?: any): void {
    const level = success ? LOG_LEVELS.INFO : LOG_LEVELS.ERROR;
    const message = `Banking Operation: ${operation} - ${success ? 'SUCCESS' : 'FAILED'}`;
    
    if (level === LOG_LEVELS.ERROR) {
      this.error(message, details);
    } else {
      this.info(message, details);
    }
  }
}

export const logger = new Logger();

// Replace console.log usage throughout the app
export const log = {
  error: (message: string, data?: any) => logger.error(message, data),
  warn: (message: string, data?: any) => logger.warn(message, data),
  info: (message: string, data?: any) => logger.info(message, data),
  debug: (message: string, data?: any) => logger.debug(message, data),
  api: {
    request: (method: string, url: string, data?: any) => logger.apiRequest(method, url, data),
    response: (method: string, url: string, status: number, data?: any) => logger.apiResponse(method, url, status, data)
  },
  security: (event: string, details?: any) => logger.securityEvent(event, details),
  banking: (operation: string, success: boolean, details?: any) => logger.bankingOperation(operation, success, details)
};