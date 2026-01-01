import { Request, Response, NextFunction } from 'express';
import { QueryBuilder } from '@utils/query-builder.js';
import { ApiResponse } from '@rules/api-response.type.js';
import { PaginationMetadata, ProcessedQueryFilters } from '@rules/api-query.type.js';
import { AppError, ValidationError, UnknownError, ProblematicResponseError } from '@errors';

/**
 * ControllerBase - Clase base para todos los controladores
 * Proporciona manejo automático de errores, query parsing y formato de respuesta
 */
export abstract class ControllerBase {
    protected controllerName: string;

    // Contexto de la solicitud actual
    private currentRequest: Request | null = null;
    private currentResponse: Response | null = null;
    private currentNext: NextFunction | null = null;
    private queryFilters: ProcessedQueryFilters | undefined | null;
    private requestStartTime: number = 0;

    constructor() {
        this.controllerName = this.constructor.name;

        // Crear proxy que envuelve automáticamente los métodos
        return this.createControllerProxy();
    }

    /**
     * Crea un proxy que intercepta llamadas a métodos públicos
     */
    private createControllerProxy(): this {
        const handler: ProxyHandler<this> = {
            get: (target: this, prop: string | symbol, receiver: any) => {
                const originalMethod = Reflect.get(target, prop, receiver);

                // Determinar si el método debe ser envuelto
                const shouldWrapMethod = this.shouldWrapMethod(prop, originalMethod);

                if (shouldWrapMethod && typeof originalMethod === 'function') {
                    // Devolver función envuelta - solución TypeScript-safe
                    return async (...args: any[]): Promise<any> => {
                        const boundMethod = () => originalMethod.apply(target, args);
                        return this.executeWithWrapper(boundMethod, args);
                    };
                }

                return originalMethod;
            },
        };

        return new Proxy(this, handler);
    }

    /**
     * Determina si un método debe ser envuelto por el proxy
     */
    private shouldWrapMethod(prop: string | symbol, method: any): boolean {
        // Solo envolver si:
        // 1. Es una función
        // 2. No es el constructor
        // 3. No empieza con _ (privado)
        // 4. No es una propiedad getter/setter
        return (
            typeof method === 'function' &&
            prop !== 'constructor' &&
            !prop.toString().startsWith('_') &&
            !prop.toString().startsWith('get ') &&
            !prop.toString().startsWith('set ')
        );
    }

    /**
     * Ejecuta un método con el wrapper de manejo de contexto
     */
    private async executeWithWrapper(method: Function, args: any[]): Promise<any> {
        // Extraer req, res, next de los argumentos
        const [req, res, next] = args as [Request, Response, NextFunction];

        // Configurar contexto de ejecución
        this.setupExecutionContext(req, res, next);

        try {
            // 1. Procesar query parameters
            this.processQueryFilters(req);

            // 2. Ejecutar método del controlador
            const result = await method(...args);

            // 3. Manejar respuesta si no se ha hecho
            this.handleResponseIfNeeded(result);

            return result;
        } catch (error) {
            // 4. Manejar errores
            this.handleError(error);
        } finally {
            // 5. Limpiar contexto
            this.cleanupExecutionContext();
        }
    }

    /**
     * Configura el contexto de ejecución para esta solicitud
     */
    private setupExecutionContext(req: Request, res: Response, next: NextFunction): void {
        this.requestStartTime = Date.now();
        this.currentRequest = req;
        this.currentResponse = res;
        this.currentNext = next;
        this.queryFilters = null;

        // Asegurar que req tenga la propiedad filters
        if (!req.filters) req.filters = undefined;
    }

    /**
     * Procesa los query parameters y construye los filtros
     */
    private processQueryFilters(req: Request): void {
        this.queryFilters = QueryBuilder.buildFromQuery(req.query);
        req.filters = this.queryFilters;
    }

    /**
     * Maneja la respuesta automáticamente si el método no lo hizo
     */
    private handleResponseIfNeeded(result: any): void {
        // CORRECCIÓN: Si la respuesta ya se envió (ej. usando this.success), salimos inmediatamente.
        if (this.currentResponse && this.currentResponse.headersSent) return;

        // Solo manejar si hay un resultado y no es un stream
        if (
            result !== undefined &&
            this.currentResponse &&
            !this.isStreamResponse(result)
        ) {
            this.sendAutoResponse(result);
        } else {
            // Solo lanzamos error si no se envió nada Y tampoco se retornó nada
            this.sendErrorResponse(new ProblematicResponseError());
        }
    }

    /**
     * Verifica si el resultado es un stream o respuesta especial
     */
    private isStreamResponse(result: any): boolean {
        return (
            result &&
            (typeof result.pipe === 'function' || // Stream
                (result.headers && typeof result.send === 'function') || // Response object
                typeof result.end === 'function') // Response-like
        );
    }

    /**
     * Envía respuesta automática formateada
     */
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

        // Agregar tiempo de ejecución en desarrollo
        if (process.env.NODE_ENV === 'development') (response as any).executionTime = `${executionTime}ms`;
        this.currentResponse.status(200).json(response);
    }

    /**
     * Normaliza cualquier error a AppError
     */
    private normalizeError(error: any): AppError {
        // Si ya es AppError, retornarlo
        if (error instanceof AppError) return error;

        // Si es Error de JavaScript, convertirlo
        if (error instanceof Error) {
            return new UnknownError(error, {
                controller: this.constructor.name,
                path: this.currentRequest?.path,
                method: this.currentRequest?.method,
            });
        }

        // Para cualquier otro tipo
        const errorMessage = typeof error === 'object' ? JSON.stringify(error) : String(error);

        return new UnknownError(new Error(errorMessage), {
            controller: this.constructor.name,
            originalValue: error,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Maneja errores de forma consistente
     */
    private handleError(error: any): void {
        const normalizedError = this.normalizeError(error);

        // Si aún no se ha enviado una respuesta, enviarlo
        this.sendErrorResponse(normalizedError);
    }

    /**
     * Envía respuesta de error
     */
    private sendErrorResponse(error: AppError): void {
        if (!this.currentResponse || this.currentResponse.headersSent) return;

        this.currentResponse.status(error.statusCode).json(error.toJSON());
    }

    /**
     * Limpia el contexto de ejecución
     */
    private cleanupExecutionContext(): void {
        this.currentRequest = null;
        this.currentResponse = null;
        this.currentNext = null;
        this.queryFilters = null;
        this.requestStartTime = 0;
    }

    /**
     * Envía respuesta exitosa formateada
     */
    protected success<T = any>(
        data: T,
        message: string = 'Success',
        statusCode: number = 200,
        metadata?: PaginationMetadata,
    ): void {
        if (!this.currentResponse || this.currentResponse.headersSent) {
            console.warn(`[ControllerBase] Cannot send success response - headers already sent`);
            return;
        }

        const response: ApiResponse<T> = {
            success: true,
            message,
            data,
            metadata,
        };

        this.currentResponse.status(statusCode).json(response);
    }

    /**
     * Envía respuesta 201 (Created)
     */
    protected created<T = any>(data: T, message: string = 'Resource created successfully'): void {
        this.success(data, message, 201);
    }

    /**
     * Envía respuesta 200 (Updated)
     */
    protected updated<T = any>(data: T, message: string = 'Resource updated successfully'): void {
        this.success(data, message, 200);
    }

    /**
     * Envía respuesta 204 (No Content)
     */
    protected noContent(message: string = 'No content'): void {
        this.success(null, message, 204);
    }

    /**
     * Obtiene los filtros de query procesados
     */
    protected getQueryFilters(): ProcessedQueryFilters {
        if (!this.queryFilters) {
            return {
                pagination: { offset: 0, limit: 10 },
                order: [],
                qc: {},
                raw: {},
            };
        }
        return this.queryFilters;
    }

    /**
     * Obtiene opciones de paginación
     */
    protected getPagination(): { offset: number; limit?: number } {
        return this.getQueryFilters().pagination;
    }

    /**
     * Obtiene opciones de ordenamiento
     */
    protected getOrder(): Array<[string, 'asc' | 'desc']> {
        return this.getQueryFilters().order;
    }

    /**
     * Obtiene el request actual
     */
    protected getRequest(): Request {
        if (!this.currentRequest) throw new Error('No request available in current context');

        return this.currentRequest;
    }

    /**
     * Obtiene el response actual
     */
    protected getResponse(): Response {
        if (!this.currentResponse) throw new Error('No response available in current context');

        return this.currentResponse;
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

    /**
     * Obtiene headers de la solicitud
     */
    protected getHeaders(): Record<string, any> {
        return this.getRequest().headers;
    }

    /**
     * Obtiene el usuario autenticado (si existe)
     */
    protected getUser<T = any>(): T | null {
        const req = this.getRequest();
        return (req as any).user || null;
    }

    /**
     * Lanza error de validación
     */
    protected throwValidationError(message: string, details: Record<string, any> = {}): never {
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
     * Valida que exista un query parameter requerido
     */
    protected requireQuery(paramName: string): any {
        const value = this.getRequest().query[paramName];
        if (value === undefined || value === null || value === '') {
            this.throwValidationError(`Query parameter '${paramName}' is required`, {
                parameter: paramName,
            });
        }
        return QueryBuilder.parseValue(value);
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
