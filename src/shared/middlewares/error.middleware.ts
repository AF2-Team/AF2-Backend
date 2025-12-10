import { Request, Response, NextFunction } from 'express';
import { Logger } from '@utils/logger';
import { AppError, AppErrorOptions } from '@errors/app.error';

interface AppErrorOptionsWithStack extends AppErrorOptions {
    stack?: string;
}

export const errorHandler = (error: AppErrorOptionsWithStack, req: Request, res: Response, next: NextFunction) => {
    Logger.error(`[ErrorMiddleware] ${req.method} ${req.path}:`, error);

    let statusCode: number = 500;
    let message: string = 'Internal server error';
    let data: AppErrorOptions['data'];
    let code: AppErrorOptions['code'];

    if (error instanceof AppError) {
        statusCode = error.statusCode;
        message = error.message;
        data = error.data;
        code = error.code;
    } else if (error instanceof Error) {
        message = error.message;
    }

    const response: Record<string, unknown> = {
        success: false,
        message,
        data,
        code,
    };

    if (process.env.NODE_ENV === 'development') {
        response.path = req.path;
        response.method = req.method;
        response.stack = error?.stack;

        if ((error as any)?.cause) response.cause = (error as any).cause;
    }

    res.status(statusCode).json(response);
};
