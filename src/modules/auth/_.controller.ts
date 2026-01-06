import { ControllerBase } from '@bases/controller.base.js';
import { Request, Response } from 'express';
import AuthService from './_.service.js';

class AuthController extends ControllerBase {
    signup = async (req: Request, _res: Response) => {
        const result = await AuthService.signup(req.body);
        this.created(result, 'User registered successfully');
    };

    login = async (req: Request, _res: Response) => {
        const result = await AuthService.login(req.body);
        this.success(result, 'Login successful');
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
