import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ProcessedQueryFilters } from '@rules/api-query.type.js';

type NotificationRepo = {
    getByUser(userId: string, options?: any): Promise<any>;
    markAllRead(userId: string): Promise<boolean>;
    create(data: { user: string; actor: string; type: string; entityId?: string; status?: number }): Promise<any>;
};

class NotificationService extends BaseService {
    private repo(): NotificationRepo {
        return Database.repository('main', 'notification') as unknown as NotificationRepo;
    }

    async getNotifications(userId: string, options: ProcessedQueryFilters) {
        if (!userId) throw new Error('Unauthorized');
        return this.repo().getByUser(userId, options);
    }

    async markAllRead(userId: string) {
        if (!userId) throw new Error('Unauthorized');
        return this.repo().markAllRead(userId);
    }

    async notify(data: { user: string; actor: string; type: string; entityId?: string }) {
        if (!data?.user || !data?.actor || !data?.type) return null;
        if (data.user === data.actor) return null;

        return this.repo().create({
            user: data.user,
            actor: data.actor,
            type: data.type,
            entityId: data.entityId,
            status: 1,
        });
    }
}

export default new NotificationService();
