/**
 * Structured Logger for Google Cloud Logging compliance.
 * Outputs logs in JSON format so strict filters and severity levels work in Cloud Console.
 */

type LogSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';

interface LogPayload {
    message: string;
    severity: LogSeverity;
    [key: string]: any;
}

const emitLog = (severity: LogSeverity, message: string, data?: any) => {
    const payload: LogPayload = {
        message,
        severity,
        timestamp: new Date().toISOString(),
        ...data,
    };
    // Cloud Run captures stdout as INFO and stderr as ERROR by default,
    // but JSON payload allows overriding severity in Cloud Logging.
    console.log(JSON.stringify(payload));
};

export const logger = {
    info: (message: string, data?: any) => emitLog('INFO', message, data),
    warn: (message: string, data?: any) => emitLog('WARNING', message, data),
    error: (message: string, error?: any, data?: any) => {
        emitLog('ERROR', message, {
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined,
            ...data
        });
    },
    debug: (message: string, data?: any) => emitLog('DEBUG', message, data),
};
