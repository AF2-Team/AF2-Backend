import { Schema } from 'mongoose';
import { MongooseModelBase } from '@database/models/bases/mongoose.model.js';

export default class UserModel extends MongooseModelBase {
    static override get modelName(): string {
        return 'User';
    }

    static override definition() {
        return {
            name: { type: String, required: true, trim: true },
            email: {
                type: String,
                required: true,
                lowercase: true,
                trim: true,
            },
            age: { type: Number, default: 18 },
            status: { type: Number, default: 1 },
        };
    }

    static override applyIndices(schema: Schema): void {
        schema.index({ email: 1 }, { unique: true });
        schema.index({ status: 1 });
    }

    static override applyHooks(_schema: Schema): void {}
}
