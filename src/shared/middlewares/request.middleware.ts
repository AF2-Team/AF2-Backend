import { Request, Response, NextFunction } from 'express';

export interface RequestMiddlewareOptions {
    map?: (req: Request) => void; // función para transformar req
    schema?: {
        body?: any;
        params?: any;
        query?: any;
    };
}

export const requestMiddleware = (options: RequestMiddlewareOptions) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            // Validar body/params/query
            if (options.schema) {
                if (options.schema.body) {
                    const { error } = options.schema.body.validate(req.body);
                    if (error) throw new Error(`Body validation failed: ${error.details[0].message}`);
                }
                if (options.schema.params) {
                    const { error } = options.schema.params.validate(req.params);
                    if (error) throw new Error(`Params validation failed: ${error.details[0].message}`);
                }
                if (options.schema.query) {
                    const { error } = options.schema.query.validate(req.query);
                    if (error) throw new Error(`Query validation failed: ${error.details[0].message}`);
                }
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};
