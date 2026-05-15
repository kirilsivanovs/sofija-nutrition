/**
 * Structured Logger
 * Replaces console.log with level-based logging.
 * In production, only info/warn/error are shown.
 * Debug logs are suppressed unless NODE_ENV=development.
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const currentLevel: LogLevel =
  process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO;

function formatMessage(level: string, context: string, message: string, data?: unknown): string {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level}] [${context}] ${message}`;
  return data !== undefined ? `${base} ${JSON.stringify(data)}` : base;
}

export interface Logger {
  debug(message: string, data?: unknown): void;
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, data?: unknown): void;
}

export function createLogger(context: string): Logger {
  return {
    debug(message: string, data?: unknown) {
      if (currentLevel <= LogLevel.DEBUG) {
        console.debug(formatMessage('DEBUG', context, message, data));
      }
    },
    info(message: string, data?: unknown) {
      if (currentLevel <= LogLevel.INFO) {
        console.info(formatMessage('INFO', context, message, data));
      }
    },
    warn(message: string, data?: unknown) {
      if (currentLevel <= LogLevel.WARN) {
        console.warn(formatMessage('WARN', context, message, data));
      }
    },
    error(message: string, data?: unknown) {
      if (currentLevel <= LogLevel.ERROR) {
        console.error(formatMessage('ERROR', context, message, data));
      }
    },
  };
}
