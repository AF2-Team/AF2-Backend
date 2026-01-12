import { ControllerBase } from '@bases/controller.base.js';
import { Request, Response } from 'express';
import AuthService from './_.service.js';

class AuthController extends ControllerBase {
    async signup(req: Request, res: Response) {
        const result = await AuthService.signup(req.body);

        this.created(result);
    }

    async login(req: Request, res: Response) {
        const result = await AuthService.login(req.body);

        this.success(result);
    }

    async me(req: Request, _res: Response) {
        this.success((req as any).user, 'Authenticated user');
    }

    async logout(_req: Request, _res: Response) {
        this.success({ success: true }, 'Logout successful');
    }

    async forgotPassword(req: Request, _res: Response) {
        const result = await AuthService.forgotPassword(req.body);

        this.success(result, 'Password reset token generated');
    }

    async resetPassword(req: Request, _res: Response) {
        const result = await AuthService.resetPassword(req.body);

        this.success(result, 'Password reset successful');
    }
    async changePassword(req: Request, _res: Response) {
        const userId = (req as any).user._id || (req as any).user.id;
        const result = await AuthService.changePassword(userId, req.body);

        this.success(result, 'Password changed successfully');
    }
}

export default new AuthController();
