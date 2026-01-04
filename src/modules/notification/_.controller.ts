import { ControllerBase } from '@bases/controller.base.js';
import { Request, Response } from 'express';
import NotificationService from './_.service.js';

class NotificationController extends ControllerBase {
    list = async (_req: Request, _res: Response) => {
        const user = this.getUser<{ id: string }>();
        if (!user) {
            this.throwValidationError('Unauthorized');
        }

        const options = this.getQueryFilters();
        const result = await NotificationService.getNotifications(user.id, options);

        return this.success(result);
    };

    markRead = async (_req: Request, _res: Response) => {
        const user = this.getUser<{ id: string }>();
        if (!user) {
            this.throwValidationError('Unauthorized');
        }

        await NotificationService.markAllRead(user.id);
        return this.success({ read: true });
    };
}

export default new NotificationController();
