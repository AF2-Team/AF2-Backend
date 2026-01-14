import InteractionModel, { Interaction } from '@database/models/main/interaction.model.js';
import { MongooseRepositoryBase } from '@database/repositories/bases/mongoose.repository.js';

class InteractionRepository extends MongooseRepositoryBase<Interaction> {
    constructor() {
        super(InteractionModel);
    }

    async existsLike(user: string, post: string): Promise<boolean> {
        const result = await this.model.exists({
            user,
            post,
            type: 'like',
            status: 1,
        });

        return !!result;
    }

    async getCommentsByPost(postId: string, options: any = {}) {
        return this.getAll(options, {
            post: postId,
            type: 'comment',
            status: 1,
        });
    }

    async createLike(user: string, post: string) {
        return this.create({
            user,
            post,
            type: 'like',
            status: 1,
        });
    }

    async removeLike(user: string, post: string): Promise<void> {
        await this.model.deleteOne({
            user,
            post,
            type: 'like',
        });
    }
}

export default new InteractionRepository();
