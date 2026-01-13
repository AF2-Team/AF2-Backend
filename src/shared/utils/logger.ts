import { ANSI } from '@utils/ansi.util.js';

export interface ISeparatorOptions {
    sepStart?: boolean;
    sepEnd?: boolean;
}
export interface ILoggerOptions extends ISeparatorOptions {
    extension?: string[];
    firm?: string;
}

type LogTypes = 'info' | 'log' | 'error' | 'warn';

export class Logger {
    private static resetFormatCode: string = ANSI.getCode('reset');
    private static prefix: string = '>> ';

    private static formatMessage(
        type: LogTypes,
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

    private static showLog(
        type: LogTypes,
        content: any[],
        { sepStart = false, sepEnd = false }: ISeparatorOptions = {},
        allPrefixed: boolean = false,
    ) {
        const uniqueSep = '[_!_]';
        let _content: string | string[] = `${allPrefixed ? this.prefix : ''}${content
            .flat()
            .join(uniqueSep + `\n${this.prefix}` + uniqueSep)}`;
        _content = _content.split(uniqueSep);

        if (sepStart) console.log();
        console[type as LogTypes](..._content);
        if (sepEnd) console.log();
    }

    private static showPrefixedLog(type: LogTypes, content: any[], options: ISeparatorOptions = {}) {
        Logger.showLog(type, content, options, true);
    }

    static logDefinition(message: string, type: any): void {
        if (typeof message !== 'string' || (typeof message === 'string' && message.trim() == '')) return;

        const color = ANSI.getCode('cyan');
        const formatted = Logger.formatMessage('log', `(${type}) -> ${message}`, { format: color });

        Logger.showLog('info', [formatted]);
    }

    static info(message: string, { extension, firm, sepStart, sepEnd }: ILoggerOptions = {}): void {
        const color = ANSI.getCode('cyan');

        this.showLog(
            'log',
            [this.formatMessage('info', `${message}`, { format: color, firm }), (extension ?? []) as Array<string>],
            { sepStart, sepEnd },
        );
    }

    static error(message: string | null, error: Error, { sepStart, sepEnd }: ISeparatorOptions = {}): void {
        const reason: string = error ? error.message : '';
        const stack: string = error && error?.stack ? error.stack : '';
        const color = ANSI.getCode('error');

        this.showLog(
            'error',
            [
                this.formatMessage('error', `${message ?? ''}`, { format: color }),
                `  ${color + ANSI.getCode('underline')}REASON:${this.resetFormatCode} ${reason}`,
                `  ${color + ANSI.getCode('underline')}STACK:${this.resetFormatCode} ${stack}`,
            ],
            { sepStart, sepEnd },
        );
    }

    static warn(message: string, { extension, firm, sepStart, sepEnd }: ILoggerOptions = {}): void {
        const color = ANSI.getCode('yellow');

        this.showLog(
            'warn',
            [this.formatMessage('warn', `${message}`, { format: color, firm }), (extension ?? []) as Array<string>],
            { sepStart, sepEnd },
        );
    }

    static natural(message: string, { extension, sepStart, sepEnd }: ILoggerOptions = {}): void {
        this.showPrefixedLog(
            'log',
            [message, (extension ?? []) as Array<string>].filter((e) => e),
            { sepStart, sepEnd },
        );
    }
}
