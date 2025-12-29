import { Logger } from '@utils/logger.js';

type BaseQueryOptions = {
    page?: string;
    limit?: string;
};

type DynamicQueryOptions = {
    [K in `order.${string}`]?: 'asc' | 'desc';
} & {
    [K in `q.${string}`]?: string | number;
};

export type QueryOptions = BaseQueryOptions & DynamicQueryOptions;

export abstract class BaseRepository<T, ID extends any = string> {
    protected readonly repositoryName: string;
    protected readonly databaseName: string;

    constructor(repositoryName: string, databaseName: string = 'default') {
        this.repositoryName = repositoryName;
        this.databaseName = databaseName;
    }

    protected async executeWithLogging<R>(operation: string, action: () => Promise<R>): Promise<R> {
        const startTime = Date.now();
        const firm = crypto.randomUUID();
        Logger.info(`[${this.repositoryName}] Starting ${operation}...`);

        try {
            const result = await action();
            const duration = Date.now() - startTime;

            Logger.info(`[${this.repositoryName}] ${operation} completed in ${duration}ms`);
            return result;
        } catch (error: any) {
            Logger.error(`Error in ${operation}:`, error);

            throw error;
        }
    }

    abstract create(data: Partial<T>): Promise<T>;

    abstract find(filter: Partial<T> | Record<string, unknown>, options?: unknown): Promise<T[]>;

    abstract findById(id: ID): Promise<T | null>;

    abstract findOne(filter: Partial<T> | Record<string, unknown>): Promise<T | null>;

    abstract update(id: ID, data: Partial<T>): Promise<T | null>;

    abstract delete(id: ID | ID[]): Promise<boolean>;

    abstract count(filter: Partial<T> | Record<string, unknown>): Promise<number>;

    protected sanitizeFilter(filter: Partial<T> | Record<string, unknown>): Partial<T> | Record<string, unknown> {
        const sanitized: Record<string, unknown> = {};

        Object.entries(filter).forEach(([key, value]) => {
            if (value !== undefined && value !== null) sanitized[key] = value;
        });

        return sanitized;
    }
}
