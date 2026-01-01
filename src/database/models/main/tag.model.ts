import { Schema } from 'mongoose';
import { MongooseModelBase } from '@database/models/bases/mongoose.model.js';

export default class TagModel extends MongooseModelBase {
    static override get modelName(): string {
        return 'Tag';
    }

    static override definition() {
        return {
            name: {
                type: String,
                required: true,
                trim: true,
            },
            normalized: {
                type: String,
                required: true,
                trim: true,
            },
            postsCount: {
                type: Number,
                default: 0,
            },
            status: {
                type: Number,
                default: 1,
            },
        };
    }

    static override applyIndices(schema: Schema): void {
        schema.index({ normalized: 1 }, { unique: true });
        schema.index({ name: 1 });
        schema.index({ postsCount: -1 });
        schema.index({ status: 1 });
    }

    static override applyHooks(_schema: Schema): void {
        // Si luego hay que normalizar, este es el lugar
    }
}
