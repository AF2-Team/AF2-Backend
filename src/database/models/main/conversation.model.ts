import { Schema } from 'mongoose';
import { MongooseModelBase } from '@database/models/bases/mongoose.model.js';

export default class ConversationModel extends MongooseModelBase {
    static override get modelName(): string {
        return 'Conversation';
    }

    static override definition() {
        return {
            participants: [
                {
                    type: Schema.Types.ObjectId,
                    ref: 'User',
                    required: true,
                },
            ],

            lastMessageText: {
                type: String,
                trim: true,
                maxlength: 2000,
                default: null,
            },

            lastMessageAt: {
                type: Date,
                default: null,
            },

            status: {
                type: Number,
                default: 1,
            },
        };
    }

    static override applyHooks(schema: Schema): void {
        schema
            .path('participants')
            .validate(
                (value: any[]) => Array.isArray(value) && value.length >= 2,
                'A conversation must have at least 2 participants',
            );
    }

    static override applyIndices(schema: Schema): void {
        schema.index({ participants: 1 });
        schema.index({ participants: 1, lastMessageAt: -1 });
        schema.index({ status: 1 });
    }
}
