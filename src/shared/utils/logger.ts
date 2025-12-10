export class Logger {
    private static getTimestamp(): string {
        return new Date().toISOString();
    }

    private static formatMessage(level: string, message: string, meta?: any): string {
        const timestamp = this.getTimestamp();
        const metaStr = meta ? JSON.stringify(meta, null, 2) : '';

        return `[${timestamp}] ${level}: ${message} ${metaStr}`.trim();
    }

    static info(message: string, meta?: any): void {
        console.log(this.formatMessage('INFO', message, meta));
    }

    static error(message: string, error?: any): void {
        console.error(this.formatMessage('ERROR', message, error));
    }

    static warn(message: string, meta?: any): void {
        console.warn(this.formatMessage('WARN', message, meta));
    }

    static debug(message: string, meta?: any): void {
        if (process.env.NODE_ENV === 'development') {
            console.debug(this.formatMessage('DEBUG', message, meta));
        }
    }

    static http(message: string, meta?: any): void {
        console.log(this.formatMessage('HTTP', message, meta));
    }

    static audit(operation: string, userId?: string, metadata?: any): void {
        const auditData = {
            operation,
            userId,
            timestamp: new Date(),
            ...metadata,
        };
        console.log(this.formatMessage('AUDIT', 'Security audit', auditData));
    }
}
