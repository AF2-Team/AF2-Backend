import { AppError, AppErrorOptions } from '@errors/app.error.js';

export class DatabaseError extends AppError {
    constructor(
        message: string = 'Database operation failed',
        operation?: string,
        details?: Record<string, unknown>,
        options: Partial<AppErrorOptions> = {},
    ) {
        super({
            statusCode: 500,
            message,
            code: 'DATABASE_ERROR',
            userMessage: 'A database error occurred. Please try again later.',
            data: {
                operation,
                database: details?.database,
                ...details,
                ...options.data,
            },
            ...options,
        });
    }
}

export class DatabaseConnectionError extends DatabaseError {
    constructor(databaseName: string, details?: Record<string, unknown>) {
        super(`Failed to connect to database '${databaseName}'`, 'connect', { database: databaseName, ...details });
    }
}

export class DatabaseQueryError extends DatabaseError {
    constructor(query: string, details?: Record<string, unknown>) {
        super('Database query failed', 'query', { query, ...details });
    }
}

export class DatabaseRepositoryError extends DatabaseError {
    constructor(description: string, details?: Record<string, unknown>) {
        super(`Database repository ${description}`, 'app', { details });
    }
}
