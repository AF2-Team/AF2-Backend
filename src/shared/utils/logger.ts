import { ANSI } from '@utils/ansi.util.js';

export interface ILoggerOptions {
    extension?: string[];
    firm?: string;
}

type ErrorTypes = 'info' | 'log' | 'error' | 'warn';

export class Logger {
    private static resetFormatCode: string = ANSI.getCode('reset');
    private static prefix: string = '>> ';

    private static formatMessage(
        type: ErrorTypes,
        message: string,
        { format, firm }: { format?: string; firm?: string } = {},
    ): string {
        const timestamp = new Date().toISOString();
        const prefixFormat = format != null ? format : '';
        const suffixFormat = ANSI.getCode('reset');
        let logType: string = '';

        if (firm != null) logType = `(${firm}) `;
        logType += `${ANSI.getCode('underline')}${type.toUpperCase()}${ANSI.getCode('resetUnderline')}`;

        return `${this.prefix}${prefixFormat}[${timestamp}] ${logType}${this.resetFormatCode}: ${message}${suffixFormat}`.trim();
    }

    private static showLog(type: ErrorTypes, ...content: any[]) {
        const uniqueSep = '[_!_]';
        let _content: string | string[] = content.flat().join(uniqueSep + `\n${this.prefix}` + uniqueSep);
        _content = _content.split(uniqueSep);

        console[type as ErrorTypes](..._content);
    }

    private static showPrefixedLog(type: ErrorTypes, ...content: any[]) {
        const uniqueSep = '[¡_!_¡]';
        let _content: string | string[] = this.prefix + content.flat().join(uniqueSep + `\n${this.prefix}` + uniqueSep);
        _content = _content.split(uniqueSep);

        console[type as ErrorTypes](..._content);
    }

    static logDefinition(message: string, type: any): void {
        if (typeof message !== 'string' || (typeof message === 'string' && message.trim() == '')) return;

        const color = ANSI.getCode('cyan');
        const formatted = Logger.formatMessage('log', `(${type}) -> ${message}`, { format: color });

        Logger.showLog('info', [formatted]);
    }

    static info(message: string, { extension, firm }: ILoggerOptions = {}): void {
        const color = ANSI.getCode('cyan');

        this.showLog('log', [
            this.formatMessage('info', `${message}`, { format: color, firm }),
            ...((extension ?? []) as Array<string>),
        ]);
    }

    static error(message: string, error: Error): void {
        const reason: string = error ? error.message : '';
        const stack: string = error && error?.stack ? error.stack : '';
        const color = ANSI.getCode('error');

        this.showLog('error', [
            this.formatMessage('error', `${message}`, { format: color }),
            `  ${color + ANSI.getCode('underline')}REASON:${this.resetFormatCode} ${reason}`,
            `  ${color + ANSI.getCode('underline')}STACK:${this.resetFormatCode} ${stack}`,
        ]);
    }

    static warn(message: string, { extension, firm }: ILoggerOptions = {}): void {
        const color = ANSI.getCode('yellow');

        this.showLog('warn', [
            this.formatMessage('warn', `${message}`, { format: color, firm }),
            ...((extension ?? []) as Array<string>),
        ]);
    }

    static natural(message: string, extension?: ILoggerOptions['extension']): void {
        this.showPrefixedLog(
            'log',
            [message, ...((extension ?? []) as Array<string>)].filter((e) => e),
        );
    }
}
