import TagModel from '@database/models/main/tag.model.js';
import { MongooseRepositoryBase } from '@database/repositories/bases/mongoose.repository.js';

class TagRepository extends MongooseRepositoryBase<typeof TagModel> {
    constructor() {
        super(TagModel);
    }

    async findOrCreate(normalized: string, name: string) {
        return this.execute('findOrCreate', async () => {
            return this.model
                .findOneAndUpdate(
                    { normalized },
                    {
                        $setOnInsert: {
                            name,
                            normalized,
                            postsCount: 0,
                            status: 1,
                        },
                    },
                    {
                        upsert: true,
                        new: true,
                        runValidators: true,
                    },
                )
                .exec();
        });
    }

    async getTrending(limit = 10) {
        return this.execute('getTrending', async () => {
            return this.model
                .find({ status: 1, postsCount: { $gt: 0 } })
                .sort({ postsCount: -1 })
                .limit(limit)
                .lean()
                .exec();
        });
    }
}

export default new TagRepository();
