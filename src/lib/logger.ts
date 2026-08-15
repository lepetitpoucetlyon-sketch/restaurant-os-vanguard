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

import { redactPII, redactStringPII } from '@/lib/security/redactPII';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface _LoggerOptions {
    prefix?: string;
    enabled?: boolean;
}

const isDevelopment = process.env.NODE_ENV === 'development';

const formatMessage = (level: LogLevel, message: string, prefix?: string): string => {
    const _timestamp = new Date().toISOString();
    const levelEmoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌'
    }[level];

    const safeMessage = redactStringPII(message);
    return `${levelEmoji} [${prefix || 'Restaurant OS'}] ${safeMessage}`;
};

export const logger = {
    /**
     * Debug log - Only in development, completely silent in production
     */
    debug: (message: string, ...args: unknown[]): void => {
        if (isDevelopment) {
            const safeArgs = args.map(a => redactPII(a));
            console.log(formatMessage('debug', message), ...safeArgs);
        }
    },

    /**
     * Info log - Important operational info, visible in all environments
     */
    info: (message: string, ...args: unknown[]): void => {
        const safeArgs = args.map(a => redactPII(a));
        console.log(formatMessage('info', message), ...safeArgs);
    },

    /**
     * Warning log - Potential issues, visible in all environments
     */
    warn: (message: string, ...args: unknown[]): void => {
        const safeArgs = args.map(a => redactPII(a));
        console.warn(formatMessage('warn', message), ...safeArgs);
    },

    /**
     * Error log - Errors and exceptions, visible in all environments
     */
    error: (message: string, error?: unknown, ...args: unknown[]): void => {
        const safeError = redactPII(error);
        const safeArgs = args.map(a => redactPII(a));
        console.error(formatMessage('error', message), safeError, ...safeArgs);
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
