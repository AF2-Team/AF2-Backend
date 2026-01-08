import { Request, Response, NextFunction } from 'express';
import { QueryBuilder } from '@utils/query-builder.js';
import { ApiResponse } from '@rules/api-response.type.js';
import { PaginationMetadata, ProcessedQueryFilters } from '@rules/api-query.type.js';
import { AppError, ValidationError, UnknownError, ProblematicResponseError } from '@errors';

export abstract class ControllerBase {
    protected controllerName: string;

    private currentRequest: Request | null = null;
    private currentResponse: Response | null = null;
    private currentNext: NextFunction | null = null;
    private queryFilters: ProcessedQueryFilters | null = null;
    private requestStartTime = 0;

    constructor() {
        this.controllerName = this.constructor.name;
        return this.createControllerProxy();
    }

    private createControllerProxy(): this {
        const handler: ProxyHandler<this> = {
            get: (target, prop, receiver) => {
                const originalMethod = Reflect.get(target, prop, receiver);

                if (
                    typeof originalMethod === 'function' &&
                    prop !== 'constructor' &&
                    !prop.toString().startsWith('_')
                ) {
                    return async (...args: any[]) => {
                        const boundMethod = () => originalMethod.apply(target, args);
                        return this.executeWithWrapper(boundMethod, args);
                    };
                }

                return originalMethod;
            },
        };

        return new Proxy(this, handler);
    }

    private async executeWithWrapper(method: Function, args: any[]): Promise<any> {
        const [req, res, next] = args;

        this.setupExecutionContext(req, res, next);

        try {
            if (this.currentRequest) {
                this.processQueryFilters(this.currentRequest);
            }

            const result = await method(...args);

            this.handleResponseIfNeeded(result);

            return result;
        } catch (error) {
            this.handleError(error);
        } finally {
            this.cleanupExecutionContext();
        }
    }

    // FIX 1: blindar contexto
    private setupExecutionContext(req: any, res: any, next: any): void {
        this.requestStartTime = Date.now();

        this.currentRequest = req && typeof req === 'object' ? req : null;

        this.currentResponse = res && typeof res.status === 'function' && typeof res.json === 'function' ? res : null;

        this.currentNext = typeof next === 'function' ? next : null;
        this.queryFilters = null;

        if (this.currentRequest && !this.currentRequest.filters) {
            this.currentRequest.filters = undefined;
        }
    }

    private processQueryFilters(req: Request): void {
        this.queryFilters = QueryBuilder.buildFromQuery(req.query);
        req.filters = this.queryFilters;
    }

    private handleResponseIfNeeded(result: any): void {
        if (!this.currentResponse || this.currentResponse.headersSent) return;

        if (result !== undefined && !this.isStreamResponse(result)) {
            this.sendAutoResponse(result);
        } else {
            // FIX 2: no forzar error si no hay response válida
            this.sendErrorResponse(new ProblematicResponseError());
        }
    }

    private isStreamResponse(result: any): boolean {
        return (
            result &&
            (typeof result.pipe === 'function' ||
                typeof result.end === 'function' ||
                (result.headers && typeof result.send === 'function'))
        );
    }

    private sendAutoResponse(result: any): void {
        if (!this.currentResponse) return;

        const processed = QueryBuilder.processResponse(result, this.queryFilters);
        const executionTime = Date.now() - this.requestStartTime;

        const response: ApiResponse = {
            success: true,
            message: 'Operation completed successfully',
            data: processed.data,
            metadata: processed.metadata,
        };

        if (process.env.NODE_ENV === 'development') {
            (response as any).executionTime = `${executionTime}ms`;
        }

        this.currentResponse.status(200).json(response);
    }

    private normalizeError(error: any): AppError {
        if (error instanceof AppError) return error;

        if (error instanceof Error) {
            return new UnknownError(error, {
                controller: this.controllerName,
                path: this.currentRequest?.path,
                method: this.currentRequest?.method,
            });
        }

        return new UnknownError(new Error(String(error)));
    }

    private handleError(error: any): void {
        const normalized = this.normalizeError(error);
        this.sendErrorResponse(normalized);
    }

    // FIX 3: validar Response antes de usar `.status`
    private sendErrorResponse(error: AppError): void {
        if (
            !this.currentResponse ||
            typeof this.currentResponse.status !== 'function' ||
            this.currentResponse.headersSent
        ) {
            console.error('[ControllerBase] Cannot send error response', {
                controller: this.controllerName,
                error: error.message,
            });
            return;
        }

        this.currentResponse.status(error.statusCode).json(error.toJSON());
    }

    private cleanupExecutionContext(): void {
        this.currentRequest = null;
        this.currentResponse = null;
        this.currentNext = null;
        this.queryFilters = null;
        this.requestStartTime = 0;
    }

    /* ======================
       Helpers públicos
    ====================== */

    protected success<T = any>(data: T, message = 'Success', statusCode = 200, metadata?: PaginationMetadata): void {
        if (!this.currentResponse || this.currentResponse.headersSent) return;

        this.currentResponse.status(statusCode).json({
            success: true,
            message,
            data,
            metadata,
        });
    }

    protected created<T = any>(data: T, message = 'Resource created successfully'): void {
        this.success(data, message, 201);
    }

    /**
     * Envía respuesta 204 (No Content)
     */
    protected noContent(message: string = 'No content'): void {
        this.success(null, message, 204);
    }

    protected getQueryFilters(): ProcessedQueryFilters {
        return (
            this.queryFilters ?? {
                pagination: { offset: 0, limit: 10 },
                order: [],
                qc: {},
                raw: {},
            }
        );
    }

    /**
     * Obtiene parámetros de la ruta
     */
    protected getParams(): Record<string, any> {
        return this.getRequest().params;
    }

    /**
     * Obtiene parámetros de query
     */
    protected getQuery(): Record<string, any> {
        return this.getRequest().query;
    }

    /**
     * Obtiene el cuerpo de la solicitud
     */
    protected getBody<T = any>(): T {
        return this.getRequest().body;
    }

    protected getRequest(): Request {
        if (!this.currentRequest) throw new Error('No request available');
        return this.currentRequest;
    }

    protected getUser<T = any>(): T | null {
        return (this.getRequest() as any).user || null;
    }

    protected throwValidationError(message: string, details: any = {}): never {
        throw new ValidationError(message, details);
    }

    /**
     * Valida que exista un parámetro requerido
     */
    protected requireParam(paramName: string): any {
        const value = this.getRequest().params[paramName];
        if (value === undefined || value === null || value === '') {
            this.throwValidationError(`Parameter '${paramName}' is required`, {
                parameter: paramName,
            });
        }
        return value;
    }

    /**
     * Valida que exista un campo en el body requerido
     */
    protected requireBodyField(fieldName: string): any {
        const value = this.getRequest().body[fieldName];
        if (value === undefined || value === null || value === '') {
            this.throwValidationError(`Field '${fieldName}' is required`, {
                field: fieldName,
            });
        }
        return value;
    }
}
