import { Request, Response, NextFunction } from 'express';
import { JWTUtil } from '@utils/jwt.util.js';

export class AuthMiddleware {
    static authenticate(req: Request, res: Response, next: NextFunction): void {
        try {
            const authHeader = req.header('Authorization');

            if (!authHeader || !authHeader.startsWith('Bearer ')) throw new Error('No token provided');

            const token = authHeader.replace('Bearer ', '');
            const decoded = JWTUtil.verifyToken(token);

            if (!decoded || !decoded.userId) throw new Error('Invalid token');

            (req as any).user = {
                userId: decoded.userId,
                email: decoded.email,
                ...decoded,
            };

            next();
        } catch (error) {
            res.status(401).json({
                success: false,
                message: error instanceof Error ? error.message : 'Authentication failed',
            });
        }
    }

    static optionalAuth(req: Request, res: Response, next: NextFunction): void {
        const authHeader = req.header('Authorization');

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.replace('Bearer ', '');

            try {
                const decoded = JWTUtil.verifyToken(token);

                if (decoded && decoded.userId) {
                    (req as any).user = {
                        userId: decoded.userId,
                        email: decoded.email,
                        ...decoded,
                    };
                }
            } catch (error) {
                // Token inválido, continuar sin autenticación
            }
        }

        next();
    }

    static authorize(...roles: string[]) {
        return (req: Request, res: Response, next: NextFunction): void => {
            try {
                const user = (req as any).user;

                if (!user) throw new Error('User not authenticated');

                if (roles.length > 0 && !roles.includes(user.role)) throw new Error('Insufficient permissions');

                next();
            } catch (error) {
                res.status(403).json({
                    success: false,
                    message: error instanceof Error ? error.message : 'Authorization failed',
                });
            }
        };
    }
}
