import { AppError } from '@errors/app.error.js';

export class UnknownError extends AppError {
    constructor(originalError: Error, additionalInfo?: Record<string, unknown>) {
        // Extraer información útil del error original
        const errorName = originalError.name || 'UnknownError';
        const errorMessage = originalError.message || 'An unexpected error occurred';

        // Capturar stack trace más detallado
        const stackLines = originalError.stack?.split('\n') || [];
        const relevantStack = stackLines.slice(0, 12).join('\n');

        // Información adicional para debugging
        const debugInfo: Record<string, unknown> = {
            originalErrorName: errorName,
            originalErrorMessage: errorMessage,
            stackTrace: relevantStack,
            ...additionalInfo,
        };

        // Mensaje amigable para el usuario
        const userMessage =
            process.env.NODE_ENV === 'development'
                ? `${errorName}: ${errorMessage}`
                : 'An unexpected error occurred. Please contact support if the problem persists.';

        super({
            statusCode: 500,
            message: `Unexpected error: ${errorMessage}`,
            code: 'UNKNOWN_ERROR',
            userMessage,
            cause: originalError,
            data: {
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'development',
                ...debugInfo,
            },
        });
    }
}
