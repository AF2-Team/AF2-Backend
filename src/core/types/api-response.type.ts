import { PaginationMetadata } from '@rules/api-query.type.js';

/**
 * Formato estándar de respuesta de la API
 */
export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T | null;
    metadata?: PaginationMetadata;
}

/**
 * Formato estándar para respuestas de error
 */
type ErrorData = string | string[] | { [key: string]: ErrorData };

export interface ApiErrorResponse {
    success: false;
    error: {
        message: string;
        code: string;
        statusCode: number;
        errors?: Record<string, ErrorData>;
        debug?: {
            stack?: string;
            devDetails?: Record<string, any>;
        };
    };
}
