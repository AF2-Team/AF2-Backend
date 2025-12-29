import { Model as MongooseModel } from 'mongoose';
import { BaseRepository } from './base.repository';
import { DatabaseError } from '@errors/database.error';

export class MongoRepository<T = any> extends BaseRepository<T> {
    private model: MongooseModel<any>;

    constructor(model: MongooseModel<any>, databaseName: string = 'default') {
        super(databaseName);
        this.model = model;
    }

    async find(filter?: any, options?: any): Promise<T[]> {
        try {
            const query = this.model.find(this.sanitizeFilter(filter));

            if (options?.skip) query.skip(options.skip);
            if (options?.limit) query.limit(options.limit);
            if (options?.sort) query.sort(options.sort);
            if (options?.select) query.select(options.select);

            const results = await query.lean().exec();
            return results as T[];
        } catch (error: any) {
            throw new DatabaseError(
                `MongoDB find operation failed`,
                'find',
                { filter, database: this.databaseName, error: error.message },
                { cause: error },
            );
        }
    }

    async findById(id: string): Promise<T | null> {
        try {
            this.validateId(id);

            const result = await this.model.findById(id).lean().exec();
            return result as T | null;
        } catch (error: any) {
            throw new DatabaseError(
                `MongoDB findById operation failed`,
                'findById',
                { id, database: this.databaseName, error: error.message },
                { cause: error },
            );
        }
    }

    async findOne(filter: any): Promise<T | null> {
        try {
            const result = await this.model.findOne(this.sanitizeFilter(filter)).lean().exec();
            return result as T | null;
        } catch (error: any) {
            throw new DatabaseError(
                `MongoDB findOne operation failed`,
                'findOne',
                { filter, database: this.databaseName, error: error.message },
                { cause: error },
            );
        }
    }

    async create(data: Partial<T>): Promise<T> {
        try {
            const document = new this.model(data);
            const saved = await document.save();
            return saved.toObject() as T;
        } catch (error: any) {
            throw new DatabaseError(
                `MongoDB create operation failed`,
                'create',
                { data, database: this.databaseName, error: error.message },
                { cause: error },
            );
        }
    }

    async update(id: string, data: Partial<T>): Promise<T | null> {
        try {
            this.validateId(id);

            const updated = await this.model
                .findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })
                .lean()
                .exec();

            return updated as T | null;
        } catch (error: any) {
            throw new DatabaseError(
                `MongoDB update operation failed`,
                'update',
                { id, data, database: this.databaseName, error: error.message },
                { cause: error },
            );
        }
    }

    async delete(id: string): Promise<boolean> {
        try {
            this.validateId(id);

            const result = await this.model.findByIdAndDelete(id);
            return result !== null;
        } catch (error: any) {
            throw new DatabaseError(
                `MongoDB delete operation failed`,
                'delete',
                { id, database: this.databaseName, error: error.message },
                { cause: error },
            );
        }
    }

    async count(filter?: any): Promise<number> {
        try {
            const count = await this.model.countDocuments(this.sanitizeFilter(filter));
            return count;
        } catch (error: any) {
            throw new DatabaseError(
                `MongoDB count operation failed`,
                'count',
                { filter, database: this.databaseName, error: error.message },
                { cause: error },
            );
        }
    }

    getModel(): MongooseModel<any> {
        return this.model;
    }

    async aggregate(pipeline: any[]): Promise<any[]> {
        try {
            return await this.model.aggregate(pipeline).exec();
        } catch (error: any) {
            throw new DatabaseError(
                `MongoDB aggregate operation failed`,
                'aggregate',
                { pipeline, database: this.databaseName, error: error.message },
                { cause: error },
            );
        }
    }
}
