import { Schema } from 'mongoose';
import { MongooseModelBase } from '@database/models/bases/mongoose.model.js';

export default class FavoriteModel extends MongooseModelBase {
    static override get modelName(): string {
        return 'Favorite';
    }

    static override definition() {
        return {
            user: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },

            post: {
                type: Schema.Types.ObjectId,
                ref: 'Post',
                required: true,
            },

            status: {
                type: Number,
                default: 1,
            },
        };
    }

    static override applyIndices(schema: Schema): void {
        schema.index({ user: 1 });
        schema.index({ post: 1 });
        schema.index({ status: 1 });
        schema.index({ user: 1, post: 1 }, { unique: true });
    }
}
