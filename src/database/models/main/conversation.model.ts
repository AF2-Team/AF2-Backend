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

            lastMessage: {
                type: String,
                trim: true,
            },

            lastMessageAt: {
                type: Date,
            },

            status: {
                type: Number,
                default: 1,
            },
        };
    }

    static override applyIndices(schema: Schema): void {
        schema.index({ participants: 1 });
        schema.index({ lastMessageAt: -1 });
        schema.index({ status: 1 });
    }
}
