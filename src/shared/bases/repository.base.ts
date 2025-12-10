import { Logger } from '@utils/logger';

export interface QueryOptions<T> {
    skip?: number;
    limit?: number;
    sort?: Record<string, 'asc' | 'desc' | 1 | -1>;
    select?: string[];
}

export abstract class BaseRepository<T, ID = string> {
    protected readonly repositoryName: string;

    constructor(repositoryName: string) {
        this.repositoryName = repositoryName;
    }

    protected async executeWithLogging<R>(operation: string, action: () => Promise<R>): Promise<R> {
        const startTime = Date.now();
        Logger.info(`[${this.repositoryName}] Starting ${operation}...`);

        try {
            const result = await action();
            const duration = Date.now() - startTime;

            Logger.info(`[${this.repositoryName}] ${operation} completed in ${duration}ms`);
            return result;
        } catch (error) {
            Logger.error(`[${this.repositoryName}] Error in ${operation}:`, error);
            throw error;
        }
    }

    abstract create(data: Partial<T>): Promise<T>;

    abstract find(filter: Partial<T> | Record<string, unknown>, options?: QueryOptions<T>): Promise<T[]>;

    abstract findById(id: ID): Promise<T | null>;

    abstract findOne(filter: Partial<T> | Record<string, unknown>): Promise<T | null>;

    abstract update(id: ID, data: Partial<T>): Promise<T | null>;

    abstract delete(id: ID): Promise<boolean>;

    abstract count(filter: Partial<T> | Record<string, unknown>): Promise<number>;

    // Sanitización genérica
    protected sanitizeFilter(filter: Partial<T> | Record<string, unknown>): Partial<T> | Record<string, unknown> {
        const sanitized: Record<string, unknown> = {};

        Object.entries(filter).forEach(([key, value]) => {
            if (value !== undefined && value !== null) sanitized[key] = value;
        });

        return sanitized;
    }
}
