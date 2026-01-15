import { ControllerBase } from '@bases/controller.base.js';
import NotificationService from './_.service.js';

class NotificationController extends ControllerBase {
    async list() {
        const user = this.getUser<{ _id: string }>();
        const options = this.getQueryFilters();
        const result = await NotificationService.list(user!._id, options);

        this.success(result);
    }

    async markRead() {
        const user = this.getUser<{ _id: string }>();
        const notificationId = this.requireParam('id');
        const result = await NotificationService.markRead(user!._id, notificationId);

        this.success(result);
    }

    async markAllRead() {
        const user = this.getUser<{ _id: string }>();
        await NotificationService.markAllRead(user!._id);
        this.success({ read: true });
    }
}

export default new NotificationController();
