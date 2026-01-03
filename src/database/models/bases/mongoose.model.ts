import mongoose, { Schema, Model, SchemaDefinition, SchemaOptions, Document } from 'mongoose';
import { BaseModel } from '@bases/model.base.js';

export interface MongooseModelWithDbInstance<T extends Document> extends Model<T> {
    dbInstanceName: string;
}

export abstract class MongooseModelBase extends BaseModel {
    static instance: MongooseModelWithDbInstance<any>;

    static definition(): SchemaDefinition {
        throw new Error('definition() must be implemented');
    }

    static applyIndices(_schema: Schema): void {}

    static applyHooks(_schema: Schema): void {}

    static schemaOptions(): SchemaOptions {
        return {
            timestamps: true,
            versionKey: false,
            toJSON: {
                virtuals: true,
                transform: (_doc, ret: any) => {
                    ret.id = ret._id;
                    delete ret._id;
                    delete ret.__v;
                    return ret;
                },
            },
            toObject: { virtuals: true },
        };
    }

    static override init(_dbInstance: any, dbInstanceName: string): MongooseModelWithDbInstance<any> {
        if (!dbInstanceName || typeof dbInstanceName !== 'string') {
            throw new Error(`[${this.modelName}] dbInstanceName must be a non-empty string`);
        }

        const schema = new Schema(this.definition(), this.schemaOptions());

        this.applyIndices(schema);

        if (this.applyHooks !== MongooseModelBase.applyHooks) {
            this.applyHooks(schema);
        }

        let model: Model<any>;

        if (mongoose.models[this.modelName]) {
            model = mongoose.models[this.modelName];
        } else {
            model = mongoose.model(this.modelName, schema);
        }

        const typedModel = model as unknown as MongooseModelWithDbInstance<any>;

        typedModel.dbInstanceName = dbInstanceName;

        this.instance = typedModel;

        return typedModel;
    }
}
