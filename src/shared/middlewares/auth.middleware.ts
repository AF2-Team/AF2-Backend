import { Request, Response, NextFunction } from 'express';
import { JWTUtil } from '@utils/jwt.util.js';

export class AuthMiddleware {
    static authenticate(req: Request, res: Response, next: NextFunction): void {
        try {
            const authHeader = req.header('Authorization');

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new Error('No token provided');
            }

            const token = authHeader.replace('Bearer ', '');
            const decoded = JWTUtil.verifyToken(token);

            if (!decoded || !decoded.userId) {
                throw new Error('Invalid token');
            }

            (req as any).user = {
                id: decoded.userId,
                email: decoded.email,
                role: decoded.role,
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
            try {
                const token = authHeader.replace('Bearer ', '');
                const decoded = JWTUtil.verifyToken(token);

                if (decoded?.userId) {
                    (req as any).user = {
                        id: decoded.userId,
                        email: decoded.email,
                        role: decoded.role,
                    };
                }
            } catch {
                // Silencioso → usuario anónimo
            }
        }
    }

    static authorize(...roles: string[]) {
        return (req: Request, res: Response, next: NextFunction): void => {
            const user = (req as any).user;

            if (!user) {
                res.status(403).json({
                    success: false,
                    message: 'User not authenticated',
                });
                return;
            }

            if (roles.length && !roles.includes(user.role)) {
                res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions',
                });
                return;
            }
        };
    }
}
