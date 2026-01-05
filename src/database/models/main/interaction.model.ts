import { Schema } from 'mongoose';
import { MongooseModelBase } from '@database/models/bases/mongoose.model.js';

export type Interaction = {
    user: string;
    post: string;
    type: 'like' | 'comment';
    text?: string;
    status: number;
};

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
                minlength: 1,
                maxlength: 2000,
                required: function (this: any) {
                    return this.type === 'comment';
                },
            },

            status: {
                type: Number,
                default: 1,
            },
        };
    }

    static override applyHooks(schema: Schema): void {
        schema.pre('validate', function (next) {
            const doc: any = this;
            if (doc.type !== 'comment') {
                doc.text = undefined;
            }
        });
    }

    static override applyIndices(schema: Schema): void {
        schema.index({ post: 1, createdAt: -1 });

        schema.index(
            { user: 1, post: 1, type: 1 },
            {
                unique: true,
                partialFilterExpression: { type: 'like' },
            },
        );

        schema.index({ status: 1 });
    }
}
