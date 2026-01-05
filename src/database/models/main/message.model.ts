import { Schema } from 'mongoose';
import { MongooseModelBase } from '@database/models/bases/mongoose.model.js';

export default class MessageModel extends MongooseModelBase {
    static override get modelName(): string {
        return 'Message';
    }

    static override definition() {
        return {
            conversation: {
                type: Schema.Types.ObjectId,
                ref: 'Conversation',
                required: true,
            },

            sender: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },

            receiver: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },

            text: {
                type: String,
                required: true,
                trim: true,
                minlength: 1,
                maxlength: 5000,
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
        schema.index({ conversation: 1, createdAt: -1 });
        schema.index({ sender: 1 });
        schema.index({ receiver: 1 });
        schema.index({ readAt: 1 });
        schema.index({ status: 1 });
    }
}
