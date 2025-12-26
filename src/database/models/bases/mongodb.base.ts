import { Schema, model as mongooseModel } from 'mongoose';
import { BaseModel } from '@bases/model.base.js';

export abstract class MongoModelBase extends BaseModel {
    static schema(): Schema {
        throw new Error('schema() must be implemented');
    }

    static override init(): unknown {
        return mongooseModel(this.modelName, this.schema());
    }
}
