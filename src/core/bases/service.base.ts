import { ValidationError } from '@errors';

export abstract class BaseService {
    protected serviceName: string;

    constructor() {
        this.serviceName = this.constructor.name;
    }

    protected validateRequired(data: Record<string, unknown>, requiredFields: string[]): void {
        const missingFields = requiredFields.filter(
            (field) => data[field] === undefined || data[field] === null || data[field] === '',
        );

        if (missingFields.length > 0)
            throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`, missingFields);
    }

    protected sanitizeData<T>(data: Partial<T>, allowedFields: (keyof T)[]): Partial<T> {
        const sanitized: Partial<T> = {};

        allowedFields.forEach((field) => {
            if (data[field] !== undefined && data[field] !== null) sanitized[field] = data[field];
        });

        return sanitized;
    }
}
