import { NextFunction as ExpressNextFunction } from 'express';
import { PaginationMetadata, ProcessedQueryFilters } from '@rules/api-query.type.js';

/**
 * Datos comunes para todas las solicitudes
 */
export interface RequestContext {
    requestId?: string;
    userId?: string;
    timestamp: Date;
    ip?: string;
    userAgent?: string;
}

/**
 * Opciones para enviar respuestas
 */
export interface ResponseOptions {
    message?: string;
    statusCode?: number;
    metadata?: PaginationMetadata;
}

/**
 * Extensión de tipos de Express para nuestra API
 * Esto permite TypeScript reconocer nuestras propiedades personalizadas
 */
declare global {
    namespace Express {
        // Extender la interfaz Request original
        interface Request {
            /**
             * Filtros de query procesados
             * Se agrega automáticamente por ControllerBase
             */
            filters?: ProcessedQueryFilters | null;

            /**
             * Contexto de la solicitud
             */
            context?: RequestContext;

            /**
             * Usuario autenticado (si aplica)
             */
            user?: any;
        }

        // Extender la interfaz Response original
        interface Response {
            /**
             * Método para enviar respuestas formateadas
             * Se agrega automáticamente y ControllerBase maneja todo internamente
             */
            sendResult?: (
                data?: any,
                options?: ResponseOptions & {
                    prevCallback?: () => void;
                    nextCallback?: () => void;
                },
            ) => void;

            /**
             * Método alternativo para respuestas exitosas
             * Mantenido para compatibilidad pero ControllerBase usa métodos internos
             */
            sendSuccess?: <T = any>(
                data: T,
                message?: string,
                statusCode?: number,
                metadata?: PaginationMetadata,
            ) => void;
        }

        // Extender la interfaz Locals original
        interface Locals {
            /**
             * Datos locales específicos de la aplicación
             */
            requestStartTime?: number;
            cacheKey?: string;
            [key: string]: any;
        }

        type NextFunction = ExpressNextFunction;
    }
}

/**
 * Tipo para funciones asíncronas de controlador
 */
export type ControllerHandler = (
    req: Express.Request,
    res: Express.Response,
    next: Express.NextFunction,
) => Promise<any> | any;

/**
 * Tipo para funciones de middleware
 */
export type MiddlewareHandler = (
    req: Express.Request,
    res: Express.Response,
    next: Express.NextFunction,
) => void | Promise<void>;
