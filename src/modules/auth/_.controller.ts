import { ControllerBase } from '@bases/controller.base.js';
import { Request, Response } from 'express';
import AuthService from './_.service.js';

class AuthController extends ControllerBase {
    signup = async (req: Request, res: Response) => {
       try {
            const result = await AuthService.signup(req.body);
            
            // 2. Respondemos DIRECTAMENTE usando 'res'
            // Esto "cierra" la conexión y le avisa al celular que todo salió bien.
            return res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: result
            });
            
            // O si tu ControllerBase.created acepta el res, úsalo así:
            // this.created(res, result, 'User registered successfully');
            
        } catch (error) {
            // Es buena práctica pasar el error al middleware de Express
            const err = error as any;
            return res.status(err.status || 400).json({
                message: err.message || 'Error registration'
            });
        }
    };

    login = async (req: Request, res: Response) => {
      try {
            const result = await AuthService.login(req.body);
            return res.status(200).json({
                success: true,
                message: 'Login successful',
                data: result
            });
        } catch (error) {
             const err = error as any;
             return res.status(err.status || 401).json({
                message: err.message || 'Login failed'
            });
        }
    };

    me = async (req: Request, _res: Response) => {
        this.success((req as any).user, 'Authenticated user');
    };

    logout = async (_req: Request, _res: Response) => {
        this.success({ success: true }, 'Logout successful');
    };

    forgotPassword = async (req: Request, _res: Response) => {
        const result = await AuthService.forgotPassword(req.body);
        this.success(result, 'Password reset token generated');
    };

    resetPassword = async (req: Request, _res: Response) => {
        const result = await AuthService.resetPassword(req.body);
        this.success(result, 'Password reset successful');
    };
}

export default new AuthController();
