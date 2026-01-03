import { Schema } from 'mongoose';
import { MongooseModelBase } from '@database/models/bases/mongoose.model.js';

export default class NotificationModel extends MongooseModelBase {
    static override get modelName(): string {
        return 'Notification';
    }

    static override definition() {
        return {
            user: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },

            actor: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },

            type: {
                type: String,
                enum: ['like', 'comment', 'repost', 'follow', 'message'],
                required: true,
            },

            entityModel: {
                type: String,
                enum: ['Post', 'User', 'Interaction', 'Conversation'],
                required: true,
            },

            entity: {
                type: Schema.Types.ObjectId,
                required: true,
                refPath: 'entityModel',
            },

            readAt: {
                type: Date,
                default: null,
            },

            status: {
                type: Number,
                default: 1,
            },
        };
    }

    static override applyIndices(schema: Schema): void {
        schema.index({ user: 1, createdAt: -1 });
        schema.index({ user: 1, readAt: 1, createdAt: -1 });
        schema.index({ status: 1 });
    }
}
