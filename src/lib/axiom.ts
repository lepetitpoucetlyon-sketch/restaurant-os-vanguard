type LogLevel = "debug" | "info" | "warn" | "error";

interface LogMetadata {
    instanceId?: string;
    userId?: string;
    version?: string;
    module?: string;
    [key: string]: import('@/shared/nexus-contract').SovereignField;
}


interface AppLogger {
    debug: (message: string, meta?: LogMetadata) => void;
    info: (message: string, meta?: LogMetadata) => void;
    warn: (message: string, meta?: LogMetadata) => void;
    error: (message: string, meta?: LogMetadata) => void;
    flush: () => Promise<void>;
}

const _isProd = process.env.NODE_ENV === "production";

function writeLog(level: LogLevel, message: string, meta?: LogMetadata) {
    const timestamp = new Date().toISOString();
    const _structuredLog = {
        timestamp,
        level,
        message,
        ...meta,
        env: process.env.NODE_ENV
    };

    // AXIOM INDUSTRIAL LOGGING (v4.0)
    const _AXIOM_DATASET = 'restaurant-os-audit';
    
    // In local dev/static mode, we produce high-visibility industrial console logs
    // In actual production, this would be a POST to https://api.axiom.co/v1/datasets/${AXIOM_DATASET}/ingest
    const logPrefix = `[AXIOM:${level.toUpperCase()}]`;
    const color = level === 'error' ? '\x1b[31m' : level === 'warn' ? '\x1b[33m' : '\x1b[32m';
    const reset = '\x1b[0m';

    const auditPayload = {
        ...meta,
        message,
        timestamp,
        level,
        audit_id: `AUD-${crypto.randomUUID().replace(/-/g, '').toUpperCase()}`,
        node: 'COCKPIT_MCC_PRIMARY'
    };

    console.log(`${color}${logPrefix}${reset} ${message}`, auditPayload);
}

export const logger: AppLogger = {
    debug: (message, meta) => writeLog("debug", message, meta),
    info: (message, meta) => writeLog("info", message, meta),
    warn: (message, meta) => writeLog("warn", message, meta),
    error: (message, meta) => writeLog("error", message, meta),
    flush: async () => {
        // Mocking flush for now, in prod this would ensure all logs are sent
        return Promise.resolve();
    },
};
