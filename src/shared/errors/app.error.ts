import { AppConfig } from '@config/app.config.js';
import { Logger } from '@utils/logger.js';
import { nanoid } from 'nanoid';

export interface AppErrorOptions {
    statusCode?: number;
    message?: string;
    data?: Record<string, unknown>;
    cause?: Error;
    code?: string;
    traceId?: string;
    userMessage?: string;
}

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly data?: Record<string, unknown>;
    public readonly code: string;
    public readonly traceId: string;
    public readonly timestamp: Date;
    public readonly userMessage?: string;
    public readonly originalError?: Error;

    constructor(options: AppErrorOptions = {}) {
        const message = options.message || 'An application error occurred with a non-specific message.';
        super(message);

        this.name = this.constructor.name;
        this.statusCode = options.statusCode || 500;
        this.code = options.code || 'SERVER_ERROR';
        this.data = options.data;
        this.traceId = options.traceId || nanoid(10);
        this.timestamp = new Date();
        this.userMessage = options.userMessage;
        this.originalError = options.cause;

        // Preservar stack trace
        if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);

        // Si hay error original, combinar stacks
        if (options.cause) this.stack = `${this.stack}\nCaused by: ${options.cause.stack}`;

        this.logError();
    }

    private logError(): void {
        Logger.error(this.message, this);
        /*
        const colors = {
            red: '\x1b[31m',
            yellow: '\x1b[33m',
            cyan: '\x1b[36m',
            reset: '\x1b[0m',
        };

        console.log(`\n${colors.red}══════════ ${this.name} ══════════${colors.reset}`);
        console.log(`${colors.cyan}Trace ID:${colors.reset} ${this.traceId}`);
        console.log(`${colors.cyan}Message:${colors.reset} ${this.message}`);
        console.log(`${colors.cyan}Code:${colors.reset} ${this.code}`);
        console.log(`${colors.cyan}StatusCode:${colors.reset} ${this.statusCode}`);
        console.log(`${colors.cyan}Timestamp:${colors.reset} ${this.timestamp.toISOString()}`);

        if (this.userMessage) console.log(`${colors.cyan}User Message:${colors.reset} ${this.userMessage}`);

        if (this.data && Object.keys(this.data).length > 0) {
            console.log(`${colors.yellow}Data:${colors.reset}`);
            console.log(JSON.stringify(this.data, null, 2));
        }

        console.log(`${colors.yellow}Stack Trace:${colors.reset}`);
        console.log(this.stack?.split('\n').slice(0, 8).join('\n'));

        if (this.originalError)
            console.log(`${colors.yellow}Original Error:${colors.reset} ${this.originalError.message}`);

        console.log(`${colors.red}══════════════════════════════════════${colors.reset}\n`);*/
    }

    public toJSON() {
        const isDev = AppConfig.isDevelopment();

        return {
            success: false,
            error: {
                name: this.name,
                message: this.message,
                userMessage: this.userMessage || this.getDefaultUserMessage(),
                code: this.code,
                statusCode: this.statusCode,
                timestamp: this.timestamp.toISOString(),
                traceId: this.traceId,
                ...(isDev && {
                    debug: {
                        stack: this.stack,
                        data: this.data,
                        originalError: this.originalError?.message,
                    },
                }),
            },
        };
    }

    private getDefaultUserMessage(): string {
        switch (this.statusCode) {
            case 400:
                return 'The request was invalid. Please check your input.';
            case 401:
                return 'You need to be authenticated to access this resource.';
            case 403:
                return 'You do not have permission to access this resource.';
            case 404:
                return 'The requested resource was not found.';
            case 409:
                return 'A conflict occurred with the current state.';
            case 422:
                return 'The request was well-formed but contains semantic errors.';
            case 429:
                return 'Too many requests. Please try again later.';
            case 500:
                return 'An unexpected error occurred on the server.';
            case 503:
                return 'Service temporarily unavailable.';
            default:
                return 'An unexpected error occurred.';
        }
    }
}
