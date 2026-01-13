import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ProcessedQueryFilters } from '@rules/api-query.type.js';

type NotifyInput = {
    user: string;
    actor: string;
    type: string;
    entityId?: string;
};

class NotificationService extends BaseService {
    private repo() {
        return Database.repository('main', 'notification');
    }

    async list(userId: string, options: ProcessedQueryFilters) {
        this.validateRequired({ userId }, ['userId']);

        return this.repo().getAllActive(options, {
            user: userId,
            status: 1,
        });
    }

    async markRead(userId: string, notificationId: string) {
        this.validateRequired({ userId, notificationId }, ['userId', 'notificationId']);

        const notification = await this.repo().getById(notificationId);

        if (!notification || notification.user !== userId) {
            throw new Error('Notification not found');
        }

        await this.repo().update(notificationId, {
            readAt: new Date(),
        });

        return { read: true };
    }

    async markAllRead(userId: string) {
        this.validateRequired({ userId }, ['userId']);

        const notifications = await this.repo().getAllActive(
            {},
            {
                user: userId,
                readAt: null,
                status: 1,
            },
        );

        for (const notification of notifications) {
            await this.repo().update(notification._id.toString(), {
                readAt: new Date(),
            });
        }

        return true;
    }

    async notify(data: NotifyInput) {
        if (!data?.user || !data?.actor || !data?.type) return null;
        if (data.user === data.actor) return null;

        return this.repo().create({
            user: data.user,
            actor: data.actor,
            type: data.type,
            entityId: data.entityId,
            readAt: null,
            status: 1,
        });
    }
}

export default new NotificationService();
