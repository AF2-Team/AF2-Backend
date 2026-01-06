import { ControllerBase } from '@bases/controller.base.js';
import NotificationService from './_.service.js';

class NotificationController extends ControllerBase {
    list = async () => {
        const user = this.getUser<{ _id: string }>();
        if (!user) this.throwValidationError('Unauthorized');

        const options = this.getQueryFilters();
        const result = await NotificationService.list(user._id, options);

        return this.success(result);
    };

    markRead = async () => {
        const user = this.getUser<{ _id: string }>();
        if (!user) this.throwValidationError('Unauthorized');

        const notificationId = this.requireParam('id');
        const result = await NotificationService.markRead(user._id, notificationId);

        return this.success(result);
    };

    markAllRead = async () => {
        const user = this.getUser<{ _id: string }>();
        if (!user) this.throwValidationError('Unauthorized');

        await NotificationService.markAllRead(user._id);
        return this.success({ read: true });
    };
}

export default new NotificationController();
