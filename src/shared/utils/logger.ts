export interface ILoggerOptions {
    meta?: any;
    firm?: string;
}

interface IFormatMessageOptions extends ILoggerOptions {
    message: string;
}

export class Logger {
    private static getTimestamp(): string {
        return new Date().toISOString();
    }

    private static formatMessage(type: string, { message, meta, firm }: IFormatMessageOptions): string {
        const timestamp = this.getTimestamp();
        const metaStr = meta ? JSON.stringify(meta, null, 2) : '';

        return `[${timestamp}] ${firm != '' ? `(${firm}) ` : ''}${type}: ${message} ${metaStr}`.trim();
    }

    static info(message: string, { meta, firm }: ILoggerOptions = {}): void {
        console.log(this.formatMessage('INFO', { message, meta, firm }));
    }

    static error(message: string, { meta: error, firm }: ILoggerOptions = {}): void {
        console.error(this.formatMessage('ERROR', { message, meta: error, firm }));
    }

    static warn(message: string, { meta, firm }: ILoggerOptions = {}): void {
        console.warn(this.formatMessage('WARN', { message, meta, firm }));
    }

    static debug(message: string, { meta, firm }: ILoggerOptions = {}): void {
        if (process.env.NODE_ENV === 'development') console.debug(this.formatMessage('DEBUG', { message, meta, firm }));
    }

    static http(message: string, { meta, firm }: ILoggerOptions = {}): void {
        console.log(this.formatMessage('HTTP', { message, meta, firm }));
    }

    static audit(operation: string, userId?: string, metadata?: any, firm?: string): void {
        const auditData = {
            operation,
            userId,
            timestamp: new Date(),
            ...metadata,
        };

        console.log(this.formatMessage('AUDIT', { message: 'Security audit', meta: auditData, firm }));
    }
}
