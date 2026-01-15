import HistoryModel from '@database/models/main/history.model.js';
import { MongooseRepositoryBase } from '@database/repositories/bases/mongoose.repository.js';

class HistoryRepository extends MongooseRepositoryBase<typeof HistoryModel> {
    constructor() {
        super(HistoryModel);
    }

    async getAllActive(options: any = {}, filter: any = {}) {
        const limit = options.pagination?.limit || 20;
        const offset = options.pagination?.offset || 0;

        const query = {
            status: 1,
            ...filter,
        };

        const sort: any = {};
        if (options.order?.length) {
            options.order.forEach(([field, dir]: any) => {
                sort[field] = dir === 'asc' ? 1 : -1;
            });
        } else {
            sort.createdAt = -1;
        }

        return this.model.find(query).sort(sort).skip(offset).limit(limit).lean().exec();
    }

    async getByUser(userId: string, options: any = {}): Promise<any[]> {
        return this.getAll(options, {
            user: userId,
            status: 1,
        });
    }

    async hasRecentSearch(userId: string, query: string, type: string, minutes: number = 5): Promise<boolean> {
        return this.execute('hasRecentSearch', async () => {
            const timeAgo = new Date(Date.now() - minutes * 60 * 1000);

            const count = await this.model.countDocuments({
                user: userId,
                query,
                type,
                status: 1,
                createdAt: { $gte: timeAgo },
            });

            return count > 0;
        });
    }

    async clearUserHistory(userId: string): Promise<boolean> {
        return this.execute('clearUserHistory', async () => {
            const result = await this.model.updateMany(
                {
                    user: userId,
                    status: 1,
                },
                {
                    $set: { status: 0 },
                },
            );

            return result.modifiedCount > 0;
        });
    }
}

export default new HistoryRepository();
