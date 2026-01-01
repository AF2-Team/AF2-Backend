import NotificationModel from '@database/models/main/notification.model.js';
import { MongooseRepositoryBase } from '@database/repositories/bases/mongoose.repository.js';
import { ProcessedQueryFilters } from '@rules/api-query.type.js';

class NotificationRepository extends MongooseRepositoryBase<any> {
    constructor() {
        super(NotificationModel);
    }

    async getByUser(userId: string, options: ProcessedQueryFilters) {
        return this.getAll(
            {
                ...options,
                order: [['createdAt', 'desc']],
            },
            {
                user: userId,
                status: 1,
                type: { $ne: 'message' },
            },
        );
    }

    async markAllRead(userId: string): Promise<boolean> {
        await this.model.updateMany(
            {
                user: userId,
                readAt: { $exists: false },
            },
            {
                $set: { readAt: new Date() },
            },
        );

        return true;
    }
}

export default new NotificationRepository();
