import { Schema } from 'mongoose';
import { MongooseModelBase } from '@database/models/bases/mongoose.model.js';

export type FollowTargetType = 'user' | 'tag';

export default class FollowModel extends MongooseModelBase {
    static override get modelName(): string {
        return 'Follow';
    }

    static override definition() {
        return {
            follower: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },

            target: {
                type: Schema.Types.ObjectId,
                required: true,
            },

            targetType: {
                type: String,
                enum: ['user', 'tag'],
                required: true,
            },

            status: { type: Number, default: 1 },
        };
    }

    static override applyIndices(schema: Schema): void {
        schema.index({ follower: 1 });
        schema.index({ target: 1 });
        schema.index({ targetType: 1 });
        schema.index({ status: 1 });

        schema.index({ follower: 1, target: 1, targetType: 1 }, { unique: true });
    }
}
