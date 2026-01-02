import TagModel from '@database/models/main/tag.model.js';
import { MongooseRepositoryBase } from '@database/repositories/bases/mongoose.repository.js';
import { DatabaseError } from '@errors/database.error.js';
import { ProcessedQueryFilters } from '@rules/api-query.type.js';

export type Tag = {
    id: string;
    name: string;
    normalized: string;
    postsCount: number;
    status: number;
};

class TagRepository extends MongooseRepositoryBase<Tag> {
    constructor() {
        super(TagModel);
    }

    async updOrCreate(tagName: string): Promise<Tag> {
        const normalized = tagName.toLowerCase().trim();

        return await this.upsert(
            { normalized },
            {
                name: tagName,
                normalized,
                postsCount: 0,
                status: 1,
            },
        );
    }

    async incrementPosts(tagId: string, value: number): Promise<boolean> {
        return this.executeWithLogging('incrementPosts', async () => {
            try {
                const result = await this.model.updateOne({ _id: tagId }, { $inc: { postsCount: value } });

                return (result.modifiedCount ?? 0) > 0;
            } catch (error: any) {
                throw new DatabaseError(
                    'Mongoose incrementPosts failed',
                    'incrementPosts',
                    { tagId, value, error: error.message },
                    { cause: error },
                );
            }
        });
    }

    async getTrending(options: ProcessedQueryFilters): Promise<Tag[]> {
        return this.executeWithLogging('getTrending', async () => {
            try {
                const query = this.model.find({ status: 1 });

                if (options.pagination) {
                    query.skip(options.pagination.offset);

                    if (options.pagination.limit && options.pagination.limit > 0) query.limit(options.pagination.limit);
                }

                query.sort({ postsCount: -1 });

                const docs = await query.exec();

                return docs.map((d) => d.toJSON()) as Tag[];
            } catch (error: any) {
                throw new DatabaseError(
                    'Mongoose getTrending failed',
                    'getTrending',
                    { error: error.message },
                    { cause: error },
                );
            }
        });
    }
}

export default new TagRepository();
