// Crash reporting and error monitoring setup
import * as Sentry from '@sentry/react-native';

class CrashReporting {
  private initialized = false;

  public initialize(): void {
    if (this.initialized) return;

    // Only initialize in production or when explicitly enabled
    const shouldInitialize = 
      !__DEV__ || 
      process.env.EXPO_PUBLIC_ENABLE_CRASH_REPORTING === 'true';

    if (shouldInitialize) {
      Sentry.init({
        dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
        environment: __DEV__ ? 'development' : 'production',
        enableAutoSessionTracking: true,
        sessionTrackingIntervalMillis: 30000,
        maxBreadcrumbs: 50,
        beforeSend: (event) => {
          // Filter out sensitive data
          if (event.exception) {
            // Remove any financial data from error messages
            const sensitivePatterns = [
              /\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/, // Credit card
              /\d{3}-\d{2}-\d{4}/, // SSN
              /account.*\d{8,}/, // Account numbers
              /balance.*\d+/, // Balance information
            ];

            event.exception.values?.forEach(exception => {
              if (exception.value) {
                sensitivePatterns.forEach(pattern => {
                  exception.value = exception.value?.replace(pattern, '[REDACTED]');
                });
              }
            });
          }
          
          return event;
        },
      });

      this.initialized = true;
      console.log('✅ Crash reporting initialized');
    }
  }

  public captureException(error: Error, context?: Record<string, any>): void {
    if (__DEV__) {
      console.error('Error captured:', error, context);
    }

    if (this.initialized) {
      Sentry.withScope(scope => {
        if (context) {
          Object.keys(context).forEach(key => {
            scope.setContext(key, context[key]);
          });
        }
        Sentry.captureException(error);
      });
    }
  }

  public captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>): void {
    if (__DEV__) {
      console.log(`Message captured [${level}]:`, message, context);
    }

    if (this.initialized) {
      Sentry.withScope(scope => {
        scope.setLevel(level);
        if (context) {
          Object.keys(context).forEach(key => {
            scope.setContext(key, context[key]);
          });
        }
        Sentry.captureMessage(message);
      });
    }
  }

  public setUserContext(userId: string, email?: string): void {
    if (this.initialized) {
      Sentry.setUser({
        id: userId,
        email: email,
      });
    }
  }

  public addBreadcrumb(message: string, category: string, data?: Record<string, any>): void {
    if (this.initialized) {
      Sentry.addBreadcrumb({
        message,
        category,
        data,
        level: 'info',
        timestamp: Date.now() / 1000,
      });
    }
  }

  // Banking-specific error reporting
  public reportBankingError(operation: string, error: Error, bankDetails?: { bankName?: string, accountId?: string }): void {
    this.captureException(error, {
      banking: {
        operation,
        bankName: bankDetails?.bankName,
        accountId: bankDetails?.accountId ? `***${bankDetails.accountId.slice(-4)}` : undefined,
      }
    });
  }

  // Transaction-specific error reporting
  public reportTransactionError(error: Error, transactionContext?: { 
    transactionId?: string, 
    amount?: number, 
    category?: string 
  }): void {
    this.captureException(error, {
      transaction: {
        transactionId: transactionContext?.transactionId,
        amount: transactionContext?.amount ? '[REDACTED]' : undefined,
        category: transactionContext?.category,
      }
    });
  }

  // Authentication error reporting
  public reportAuthError(error: Error, context?: { action: string, userId?: string }): void {
    this.captureException(error, {
      auth: {
        action: context?.action,
        userId: context?.userId,
      }
    });
  }
}

export const crashReporting = new CrashReporting();

// Export wrapped version of Sentry for direct use if needed
export { Sentry };