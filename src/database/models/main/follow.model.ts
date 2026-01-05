import { Schema } from 'mongoose';
import { MongooseModelBase } from '@database/models/bases/mongoose.model.js';

export type FollowTargetModel = 'User' | 'Tag';

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

            targetModel: {
                type: String,
                enum: ['User', 'Tag'],
                required: true,
            },

            target: {
                type: Schema.Types.ObjectId,
                required: true,
                refPath: 'targetModel',
            },

            status: {
                type: Number,
                default: 1,
            },
        };
    }

    static override applyIndices(schema: Schema): void {
        schema.index({ follower: 1, target: 1, targetModel: 1 }, { unique: true });

        schema.index({ targetModel: 1, target: 1 });
        schema.index({ status: 1 });
    }
}
