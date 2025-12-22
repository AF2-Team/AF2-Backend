import { AppError, AppErrorOptions } from '@errors/app.error.js';

export class AuthError extends AppError {
    constructor(message: string = 'Authentication failed', options: Partial<AppErrorOptions> = {}) {
        super({
            statusCode: 401,
            message,
            code: 'AUTH_ERROR',
            userMessage: 'Authentication is required to access this resource.',
            ...options,
        });
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = 'Access forbidden', options: Partial<AppErrorOptions> = {}) {
        super({
            statusCode: 403,
            message,
            code: 'FORBIDDEN',
            userMessage: 'You do not have permission to access this resource.',
            ...options,
        });
    }
}
