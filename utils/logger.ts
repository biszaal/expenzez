// Production-ready logging utility with sensitive data sanitization
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

// Patterns for sensitive data that should be redacted
const SENSITIVE_PATTERNS: { pattern: RegExp; replacement: string }[] = [
  // Tokens and secrets
  { pattern: /Bearer\s+[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/gi, replacement: 'Bearer [REDACTED_TOKEN]' },
  { pattern: /"(access_?[Tt]oken|refresh_?[Tt]oken|id_?[Tt]oken|token)"\s*:\s*"[^"]+"/gi, replacement: '"$1": "[REDACTED]"' },
  { pattern: /(access_?[Tt]oken|refresh_?[Tt]oken|id_?[Tt]oken)=([^&\s]+)/gi, replacement: '$1=[REDACTED]' },

  // Passwords and PINs
  { pattern: /"(password|pin|secret|apiKey|api_key)"\s*:\s*"[^"]+"/gi, replacement: '"$1": "[REDACTED]"' },

  // Personal identifiable information
  { pattern: /"(email)"\s*:\s*"([^@]+)@([^"]+)"/gi, replacement: '"$1": "[REDACTED]@$3"' },
  { pattern: /"(phone|phone_number|phoneNumber)"\s*:\s*"[^"]+"/gi, replacement: '"$1": "[REDACTED]"' },
  { pattern: /"(ssn|social_security|nationalId)"\s*:\s*"[^"]+"/gi, replacement: '"$1": "[REDACTED]"' },

  // Financial data
  { pattern: /"(card_number|cardNumber|account_number|accountNumber|routing_number|routingNumber)"\s*:\s*"[^"]+"/gi, replacement: '"$1": "[REDACTED]"' },
  { pattern: /"(cvv|cvc|security_code)"\s*:\s*"[^"]+"/gi, replacement: '"$1": "[REDACTED]"' },

  // AWS credentials
  { pattern: /AKIA[0-9A-Z]{16}/g, replacement: '[REDACTED_AWS_KEY]' },
  { pattern: /"(aws_secret_access_key|secretAccessKey)"\s*:\s*"[^"]+"/gi, replacement: '"$1": "[REDACTED]"' },
];

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';
  }

  /**
   * Sanitize sensitive data from log messages and data objects
   */
  private sanitize(input: string): string {
    let sanitized = input;
    for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
      sanitized = sanitized.replace(pattern, replacement);
    }
    return sanitized;
  }

  /**
   * Deep sanitize an object by converting to string and back
   */
  private sanitizeData(data: any): any {
    if (data === null || data === undefined) return data;

    try {
      const stringified = JSON.stringify(data);
      const sanitized = this.sanitize(stringified);
      return JSON.parse(sanitized);
    } catch {
      // If serialization fails, return a safe placeholder
      return '[UNSERIALIZABLE_DATA]';
    }
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const sanitizedMessage = this.sanitize(message);
    const sanitizedData = data ? this.sanitizeData(data) : null;
    const logData = sanitizedData ? ` | Data: ${JSON.stringify(sanitizedData)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${sanitizedMessage}${logData}`;
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
        // Sanitize before sending to monitoring
        const sanitizedMessage = this.sanitize(message);
        const sanitizedData = data ? this.sanitizeData(data) : undefined;

        // Example: Send to monitoring service
        // await Sentry.captureMessage(sanitizedMessage, { extra: sanitizedData });
      } catch {
        // Fallback - don't let logging errors crash the app
        // Silent fail in production
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