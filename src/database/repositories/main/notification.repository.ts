import NotificationModel from '@database/models/main/notification.model.js';
import { MongooseRepositoryBase } from '@database/repositories/bases/mongoose.repository.js';

class NotificationRepository extends MongooseRepositoryBase<typeof NotificationModel> {
    constructor() {
        super(NotificationModel);
    }

    async getByUser(userId: string, options: any = {}) {
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
        await this.execute('markAllRead', async () => {
            await this.model.updateMany(
                {
                    user: userId,
                    readAt: { $exists: false },
                },
                {
                    $set: { readAt: new Date() },
                },
            );
        });

        return true;
    }
}

export default new NotificationRepository();
