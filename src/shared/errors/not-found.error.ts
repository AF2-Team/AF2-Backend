import { AppError, AppErrorOptions } from '@errors/app.error.js';

export class NotFoundError extends AppError {
    constructor(resource: string = 'Resource', identifier?: any, options: Partial<AppErrorOptions> = {}) {
        const message = identifier ? `${resource} with identifier '${identifier}' not found` : `${resource} not found`;

        super({
            statusCode: 404,
            message,
            code: 'NOT_FOUND',
            userMessage: `The requested ${resource.toLowerCase()} was not found.`,
            data: {
                resource,
                identifier,
                ...options.data,
            },
            ...options,
        });
    }
}
