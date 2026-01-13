import 'express';

declare global {
    namespace Express {
        interface Request {
            user?: any;
            files?: any[];
            file?: any;
        }
    }
}

export {};
