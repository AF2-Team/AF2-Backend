export type IData = Record<string, unknown>;

export interface AppErrorOptions {
    statusCode?: number;
    message?: string;
    data?: IData;
    cause?: Error;
    code?: string | number;
}

export class AppError extends Error {
    public statusCode: number;
    public data?: IData;
    public code?: AppErrorOptions['code'];

    constructor(options: AppErrorOptions = {}) {
        super(options.message || 'Application error');
        this.name = this.constructor.name;
        this.statusCode = options.statusCode || 500;
        this.code = options?.code ?? this.statusCode;
        this.data = options.data;

        if (options.cause) (this as any).cause = options.cause;

        // Mantener stack trace correcto
        if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
    }
}

export class NotFoundError extends AppError {
    constructor({ message = 'Resource not found', code, data, cause }: Partial<AppErrorOptions> = {}) {
        super({ statusCode: 404, message, code, data });
    }
}

export class ValidationError extends AppError {
    constructor({ message = 'Validation failed', code, data }: Partial<AppErrorOptions> = {}) {
        super({ statusCode: 400, message, code, data });
    }
}

export class UnauthorizedError extends AppError {
    constructor({ message = 'Unauthorized', code, data }: Partial<AppErrorOptions> = {}) {
        super({ statusCode: 401, message, code, data });
    }
}

export class ForbiddenError extends AppError {
    constructor({ message = 'Forbidden', code, data }: Partial<AppErrorOptions> = {}) {
        super({ statusCode: 403, message, code, data });
    }
}

export class ConflictError extends AppError {
    constructor({ message = 'Conflict', code, data }: Partial<AppErrorOptions> = {}) {
        super({ statusCode: 409, message, code, data });
    }
}
