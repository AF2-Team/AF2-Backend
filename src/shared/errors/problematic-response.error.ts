import { AppError, AppErrorOptions } from '@errors/app.error.js';

export class ProblematicResponseError extends AppError {
    constructor(message: string = 'Internal Server Error', options: Partial<AppErrorOptions> = {}) {
        super({
            statusCode: 500,
            message,
            code: 'RESPONSE_PROBLEM',
            userMessage: 'The api failed to return a valid response',
            ...options,
        });
    }
}
