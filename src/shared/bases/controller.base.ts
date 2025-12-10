import { Request, Response, NextFunction } from 'express';
import { Logger } from '@utils/logger';

export abstract class BaseController {
    protected controllerName: string;

    constructor(controllerName: string) {
        this.controllerName = controllerName;
        this.wrapPublicMethods();
    }

    /**
     * Envuelve todos los métodos públicos automáticamente.
     * Si ocurre un error, lo envía al middleware global de errores.
     */
    private wrapPublicMethods(): void {
        const proto = Object.getPrototypeOf(this);
        const methodNames = Object.getOwnPropertyNames(proto);

        methodNames.forEach((name) => {
            if (name === 'constructor') return;

            const original = (this as any)[name];
            if (typeof original !== 'function') return;
            if (name.startsWith('_')) return; // evitar privados

            (this as any)[name] = async (req: Request, res: Response, next: NextFunction) => {
                const start = Date.now();

                try {
                    const result = await original.call(this, req, res, next);

                    // Solo enviamos respuesta si el método no la envió
                    if (!res.headersSent && result !== undefined) this.sendSuccess(res, result);

                    Logger.info(`[${this.controllerName}] ${req.method} ${req.path} OK (${Date.now() - start}ms)`);
                } catch (error) {
                    Logger.error(
                        `[${this.controllerName}] ${req.method} ${req.path} FAILED (${Date.now() - start}ms)`,
                        error,
                    );

                    next(error); // Enviar error al middleware de error
                }
            };
        });
    }

    protected sendSuccess(res: Response, data: any, message: string = 'Success', statusCode: number = 200): void {
        res.status(statusCode).json({
            success: true,
            message,
            data,
            timestamp: new Date(),
        });
    }

    protected sendError(res: Response, message: string, statusCode: number = 400, error?: any): void {
        const response: any = {
            success: false,
            message,
            timestamp: new Date(),
        };

        if (process.env.NODE_ENV === 'development' && error) {
            response.error = error instanceof Error ? error.message : error;
            response.stack = error instanceof Error ? error.stack : undefined;
        }

        res.status(statusCode).json(response);
    }

    protected validateRequest(req: Request, rules: Record<string, (value: any) => boolean>): void {
        const errors: string[] = [];

        Object.entries(rules).forEach(([field, validator]) => {
            let value;

            // Buscar en body, params y query
            if (req.body[field] !== undefined) value = req.body[field];
            else if (req.params[field] !== undefined) value = req.params[field];
            else if (req.query[field] !== undefined) value = req.query[field];

            if (!validator(value)) errors.push(`Invalid value for ${field}: ${value}`);
        });

        if (errors.length > 0) throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    protected extractData(req: Request, sources: ('body' | 'params' | 'query')[] = ['body']): any {
        const data: any = {};

        sources.forEach((source) => {
            if (req[source]) Object.assign(data, req[source]);
        });

        return data;
    }

    protected paginateData(data: any[], page: number = 1, limit: number = 10): any {
        page = Math.max(1, page);
        limit = Math.max(1, limit);
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const results = {
            data: data.slice(startIndex, endIndex),
            pagination: {
                total: data.length,
                page,
                limit,
                totalPages: Math.ceil(data.length / limit),
                hasNext: endIndex < data.length,
                hasPrev: startIndex > 0,
            },
        };

        return results;
    }
}
