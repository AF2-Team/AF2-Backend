import { ValidationError } from '@errors/validation.error.js';

export class Validator {
    static isEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        return emailRegex.test(email);
    }

    static isNotEmpty(value: any): boolean {
        if (value === undefined || value === null) return false;
        if (typeof value === 'string' && value.trim() === '') return false;
        if (Array.isArray(value) && value.length === 0) return false;
        if (typeof value === 'object' && Object.keys(value).length === 0) return false;

        return true;
    }

    static isString(value: any): boolean {
        return typeof value === 'string';
    }

    static isNumber(value: any): boolean {
        return typeof value === 'number' && !isNaN(value);
    }

    static isBoolean(value: any): boolean {
        return typeof value === 'boolean';
    }

    static isDate(value: any): boolean {
        return value instanceof Date && !isNaN(value.getTime());
    }

    static isObjectId(value: string): boolean {
        return /^[0-9a-fA-F]{24}$/.test(value);
    }

    static minLength(value: string, min: number): boolean {
        return value.length >= min;
    }

    static maxLength(value: string, max: number): boolean {
        return value.length <= max;
    }

    static minValue(value: number, min: number): boolean {
        return value >= min;
    }

    static maxValue(value: number, max: number): boolean {
        return value <= max;
    }

    static inRange(value: number, min: number, max: number): boolean {
        return value >= min && value <= max;
    }

    static isUrl(value: string): boolean {
        try {
            new URL(value);

            return true;
        } catch {
            return false;
        }
    }

    static isPhone(value: string): boolean {
        const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/;

        return phoneRegex.test(value.replace(/\s/g, ''));
    }

    static sanitizeString(value: string): string {
        return value
            .trim()
            .replace(/[<>]/g, '') // Eliminar caracteres peligrosos
            .replace(/\s+/g, ' '); // Normalizar espacios
    }

    static sanitizeObject(obj: Record<string, unknown>, allowedFields: string[]): Record<string, unknown> {
        const sanitized: Record<string, unknown> = {};

        allowedFields.forEach((field) => {
            if (obj[field] !== undefined) {
                if (typeof obj[field] === 'string') sanitized[field] = this.sanitizeString(obj[field]);
                else sanitized[field] = obj[field];
            }
        });

        return sanitized;
    }

    static validateObject(obj: any, rules: Record<string, (value: any) => boolean>): string[] {
        const errors: string[] = [];

        Object.entries(rules).forEach(([field, validator]) => {
            if (!validator(obj[field])) errors.push(`Invalid value for ${field}`);
        });

        return errors;
    }

    static requireArg(
        obj: Record<string, unknown>,
        requiredArg: string,
        alarm: boolean = true,
    ): unknown | boolean | void {
        const value = obj[requiredArg];

        if (value !== undefined && value !== null) return value;
        if (alarm) throw new ValidationError(`Argument '${requiredArg}' is required`, { argument: requiredArg });

        return false;
    }
}
