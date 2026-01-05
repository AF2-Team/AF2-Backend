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

    async getTrending(options: any = {}) {
        return this.getAll(
            {
                ...options,
                order: [['postsCount', 'desc']],
            },
            {
                status: 1,
            },
        );
    }
}

export default new TagRepository();
