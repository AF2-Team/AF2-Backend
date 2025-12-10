import { Logger } from '@utils/logger';
import { AppError, ValidationError } from '@errors/app.error';

export abstract class BaseService {
    protected serviceName: string;

    constructor(serviceName: string) {
        this.serviceName = serviceName;
    }

    protected validateRequired(data: Record<string, unknown>, requiredFields: string[]): void {
        const missingFields = requiredFields.filter(
            (field) => data[field] === undefined || data[field] === null || data[field] === '',
        );

        if (missingFields.length > 0)
            throw new ValidationError({
                message: `Missing required fields: ${missingFields.join(', ')}`,
                data: { missingFields },
            });
    }

    protected sanitizeData<T>(data: Partial<T>, allowedFields: (keyof T)[]): Partial<T> {
        const sanitized: Partial<T> = {};

        allowedFields.forEach((field) => {
            if (data[field] !== undefined && data[field] !== null) sanitized[field] = data[field];
        });

        return sanitized;
    }

    protected logOperation(operation: string, data?: unknown): void {
        Logger.info(`[${this.serviceName}] ${operation}`, data || {});
    }

    protected async retryOperation<T>(
        operation: () => Promise<T>,
        maxRetries: number = 3,
        delayMs: number = 1000,
    ): Promise<T> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error as Error;
                Logger.warn(`[${this.serviceName}] Attempt ${attempt} failed:`, error);

                if (attempt < maxRetries) await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
            }
        }

        throw new AppError({
            message: `Operation failed after ${maxRetries} attempts: ${lastError?.message}`,
            cause: lastError ?? undefined,
        });
    }
}
