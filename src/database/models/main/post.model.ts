import { Schema } from 'mongoose';
import { MongooseModelBase } from '@database/models/bases/mongoose.model.js';

export type PostType = 'post' | 'repost';

export default class PostModel extends MongooseModelBase {
    static override get modelName(): string {
        return 'Post';
    }

    static override definition() {
        return {
            user: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },

            type: {
                type: String,
                enum: ['post', 'repost'],
                default: 'post',
            },

            originalPost: {
                type: Schema.Types.ObjectId,
                ref: 'Post',
            },

            text: {
                type: String,
                trim: true,
            },

            fontStyle: {
                type: String,
                default: 'regular',
            },

            tags: [{ type: String }],

            status: { type: Number, default: 1 },

            publishStatus: {
                type: String,
                enum: ['draft', 'published', 'archived'],
                default: 'published',
            },

            likesCount: { type: Number, default: 0 },
            commentsCount: { type: Number, default: 0 },
            repostsCount: { type: Number, default: 0 },
            favoritesCount: { type: Number, default: 0 },
        };
    }

    static override applyIndices(schema: Schema): void {
        schema.index({ user: 1, createdAt: -1 });
        schema.index({ publishStatus: 1, createdAt: -1 });
        schema.index({ tags: 1 });
        schema.index({ type: 1 });
        schema.index({ status: 1 });
        schema.index({ originalPost: 1 });
    }
}
