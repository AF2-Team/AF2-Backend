import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ProcessedQueryFilters } from '@rules/api-query.type.js';
import { NotificationType } from '@database/models/main/notification.model.js';

class NotificationService extends BaseService {
    async getNotifications(userId: string, options: ProcessedQueryFilters) {
        const repo = Database.repository('main', 'notification');
        return repo.getByUser(userId, options);
    }

    async markAllRead(userId: string) {
        const repo = Database.repository('main', 'notification');
        return repo.markAllRead(userId);
    }

    async notify(data: { user: string; actor: string; type: NotificationType; entityId?: string }) {
        if (data.user === data.actor) return null;

        const repo = Database.repository('main', 'notification');

        return repo.create({
            user: data.user,
            actor: data.actor,
            type: data.type,
            entityId: data.entityId,
            status: 1,
        });
    }
}

export default new NotificationService();
