import { Schema } from 'mongoose';
import { MongooseModelBase } from '@database/models/bases/mongoose.model.js';

export default class HistoryModel extends MongooseModelBase {
    static override get modelName(): string {
        return 'History';
    }

    static override definition() {
        return {
            user: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },

            query: {
                type: String,
                required: true,
                trim: true,
                minlength: 2,
                maxlength: 200,
            },

            type: {
                type: String,
                enum: ['all', 'user', 'post', 'tag'],
                default: 'all',
                required: true,
            },

            status: {
                type: Number,
                default: 1,
            },
        };
    }

    static override applyIndices(schema: Schema): void {
        schema.index({
            user: 1,
            query: 1,
            type: 1,
            createdAt: -1,
        });

        schema.index({
            user: 1,
            status: 1,
            createdAt: -1,
        });

        schema.index({ status: 1 });
    }
}
