/**
 * Restaurant OS - Conditional Logger
 * 
 * A production-safe logging utility that only outputs in development mode.
 * Replaces direct console.log usage throughout the codebase.
 * 
 * @example
 * import { logger } from '@/lib/logger';
 * 
 * logger.debug('Development only message');
 * logger.info('Info message with prefix');
 * logger.warn('Warning message');
 * logger.error('Error message', error);
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
    prefix?: string;
    enabled?: boolean;
}

const isDevelopment = process.env.NODE_ENV === 'development';

const formatMessage = (level: LogLevel, message: string, prefix?: string): string => {
    const timestamp = new Date().toISOString();
    const levelEmoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌'
    }[level];

    return `${levelEmoji} [${prefix || 'Restaurant OS'}] ${message}`;
};

export const logger = {
    /**
     * Debug log - Only in development, completely silent in production
     */
    debug: (message: string, ...args: unknown[]): void => {
        if (isDevelopment) {
            console.log(formatMessage('debug', message), ...args);
        }
    },

    /**
     * Info log - Important operational info, visible in all environments
     */
    info: (message: string, ...args: unknown[]): void => {
        console.log(formatMessage('info', message), ...args);
    },

    /**
     * Warning log - Potential issues, visible in all environments
     */
    warn: (message: string, ...args: unknown[]): void => {
        console.warn(formatMessage('warn', message), ...args);
    },

    /**
     * Error log - Errors and exceptions, visible in all environments
     */
    error: (message: string, error?: unknown, ...args: unknown[]): void => {
        console.error(formatMessage('error', message), error, ...args);
    },

    /**
     * Group logs together (development only)
     */
    group: (label: string): void => {
        if (isDevelopment) {
            console.group(label);
        }
    },

    /**
     * End log group (development only)
     */
    groupEnd: (): void => {
        if (isDevelopment) {
            console.groupEnd();
        }
    },

    /**
     * Performance timing (development only)
     */
    time: (label: string): void => {
        if (isDevelopment) {
            console.time(label);
        }
    },

    /**
     * End performance timing (development only)
     */
    timeEnd: (label: string): void => {
        if (isDevelopment) {
            console.timeEnd(label);
        }
    }
};

export default logger;
