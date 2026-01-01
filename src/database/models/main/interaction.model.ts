import { Schema } from 'mongoose';
import { MongooseModelBase } from '@database/models/bases/mongoose.model.js';

export type InteractionType = 'like' | 'comment';

export default class InteractionModel extends MongooseModelBase {
    static override get modelName(): string {
        return 'Interaction';
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

            type: {
                type: String,
                enum: ['like', 'comment'],
                required: true,
            },

            text: {
                type: String,
                trim: true,
            },

            status: {
                type: Number,
                default: 1,
            },
        };
    }

    static override applyIndices(schema: Schema): void {
        // Búsqueda
        schema.index({ post: 1, createdAt: -1 });
        schema.index({ user: 1 });
        schema.index({ type: 1 });
        schema.index({ status: 1 });

        // Like único por usuario/post
        schema.index(
            { user: 1, post: 1, type: 1 },
            {
                unique: true,
                partialFilterExpression: {
                    type: 'like',
                },
            },
        );
    }
}
