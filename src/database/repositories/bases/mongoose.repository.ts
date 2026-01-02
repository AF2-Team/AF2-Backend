import { Model, Types, FilterQuery } from 'mongoose';
import { BaseRepository } from '@bases/repository.base.js';
import { DatabaseError } from '@errors/database.error.js';
import { ProcessedQueryFilters } from '@rules/api-query.type.js';
import { MongooseModelBase } from '@database/models/bases/mongoose.model.js';

export type MongooseModelClass = typeof MongooseModelBase & {
    instance?: Model<any>;
};

export class MongooseRepositoryBase<T = any> extends BaseRepository<T, string, Model<any>> {
    constructor(modelClass: MongooseModelClass) {
        if (!modelClass.instance) throw new Error(`Model ${modelClass.name} has not been initialized`);
        super(modelClass.instance);
    }

    async create(data: Partial<T>): Promise<T> {
        return this.executeWithLogging('create', async () => {
            try {
                const result = await this.model.create(data);
                return result.toJSON() as T;
            } catch (error: any) {
                throw new DatabaseError('Mongoose create failed', 'create', { error: error.message }, { cause: error });
            }
        });
    }

    async getAll(options: ProcessedQueryFilters, filter?: Partial<T> | Record<string, unknown>): Promise<T[]> {
        return this.executeWithLogging('find', async () => {
            try {
                const mongooseFilter = this.buildFilter(filter);
                const query = this.model.find(mongooseFilter);

                if (options.pagination) {
                    query.skip(options.pagination.offset);
                    if (options.pagination.limit && options.pagination.limit > 0) {
                        query.limit(options.pagination.limit);
                    }
                }

                if (options.order && options.order.length > 0) {
                    const sortObject: any = {};
                    options.order.forEach(([field, direction]) => {
                        sortObject[field] = direction === 'asc' ? 1 : -1;
                    });
                    query.sort(sortObject);
                }

                const results = await query.exec();
                return results.map((r) => r.toJSON()) as T[];
            } catch (error: any) {
                throw new DatabaseError('Mongoose find failed', 'find', { error: error.message }, { cause: error });
            }
        });
    }

    async getAllActive(options: ProcessedQueryFilters, filter?: Partial<T>): Promise<T[]> {
        return this.getAll(options, { ...filter, status: 1 } as any);
    }

    async getById(id: string): Promise<T | null> {
        return this.executeWithLogging('findById', async () => {
            try {
                const result = await this.model.findById(id);
                return result ? (result.toJSON() as T) : null;
            } catch (error: any) {
                throw new DatabaseError(
                    'Mongoose findById failed',
                    'findById',
                    { id, error: error.message },
                    { cause: error },
                );
            }
        });
    }

    async getOne(filter: Partial<T> | Record<string, unknown>): Promise<T | null> {
        return this.executeWithLogging('findOne', async () => {
            try {
                const mongooseFilter = this.buildFilter(filter);
                const result = await this.model.findOne(mongooseFilter);
                return result ? (result.toJSON() as T) : null;
            } catch (error: any) {
                throw new DatabaseError(
                    'Mongoose findOne failed',
                    'findOne',
                    { error: error.message },
                    { cause: error },
                );
            }
        });
    }

    async update(id: string, data: Partial<T>): Promise<T | null> {
        return this.executeWithLogging('update', async () => {
            try {
                const result = await this.model.findByIdAndUpdate(
                    id,
                    { $set: data },
                    { new: true, runValidators: true },
                );
                return result ? (result.toJSON() as T) : null;
            } catch (error: any) {
                throw new DatabaseError(
                    'Mongoose update failed',
                    'update',
                    { id, data, error: error.message },
                    { cause: error },
                );
            }
        });
    }

    async getOrCreate(filter: Record<string, any>, createData: Partial<T>): Promise<T> {
        return this.executeWithLogging('getOrCreate', async () => {
            try {
                const existing = await this.getOne(filter);
                if (existing) return existing;
                
                return await this.create(createData);
            } catch (error: any) {
                throw new DatabaseError(
                    `Mongoose getOrCreate failed in ${this.model.modelName}`,
                    'getOrCreate',
                    { filter, createData, error: error.message },
                    { cause: error },
                );
            }
        });
    }

    async upsert(filter: Record<string, any>, data: Partial<T>): Promise<T> {
        return this.executeWithLogging('upsert', async () => {
            try {
                const doc = await this.model.findOneAndUpdate(
                    filter,
                    {
                        $setOnInsert: { ...data },
                    },
                    {
                        upsert: true,
                        new: true,
                        runValidators: true,
                        setDefaultsOnInsert: true,
                    },
                );
                return doc!.toJSON() as T;
            } catch (error: any) {
                throw new DatabaseError(
                    `Mongoose upsert failed in ${this.model.modelName}`,
                    'upsert',
                    { filter, data, error: error.message },
                    { cause: error },
                );
            }
        });
    }

    async delete(id: string | string[]): Promise<boolean> {
        return this.executeWithLogging('delete', async () => {
            try {
                if (Array.isArray(id)) {
                    const result = await this.model.deleteMany({ _id: { $in: id } });
                    return result.deletedCount > 0;
                } else {
                    const result = await this.model.findByIdAndDelete(id);
                    return !!result;
                }
            } catch (error: any) {
                throw new DatabaseError(
                    'Mongoose delete failed',
                    'delete',
                    { id, error: error.message },
                    { cause: error },
                );
            }
        });
    }

    async remove(
        target: string | string[] | Record<string, any>,
        options?: {
            single?: boolean;
            softFail?: boolean;
        },
    ): Promise<number> {
        return this.executeWithLogging('remove', async () => {
            let filter: Record<string, any>;

            if (typeof target === 'string') {
                if (!Types.ObjectId.isValid(target)) return 0;
                filter = { _id: new Types.ObjectId(target) };
            } else if (Array.isArray(target)) {
                const validIds = target.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
                if (validIds.length === 0) return 0;
                filter = { _id: { $in: validIds } };
            } else if (typeof target === 'object' && target !== null) {
                if (Object.keys(target).length === 0) return 0;
                filter = target;
            } else {
                return 0;
            }

            const operation = options?.single ? 'deleteOne' : 'deleteMany';
            const result = await this.model[operation](filter);
            return result.deletedCount ?? 0;
        });
    }

    async count(filter?: Partial<T> | Record<string, unknown>): Promise<number> {
        return this.executeWithLogging('count', async () => {
            const mongooseFilter = this.buildFilter(filter);
            return await this.model.countDocuments(mongooseFilter);
        });
    }

    private buildFilter(filter?: Partial<T> | Record<string, unknown>): FilterQuery<any> {
        if (!filter) return {};

        const sanitized = this.sanitizeFilter(filter);
        const query: Record<string, any> = {};

        for (const [key, value] of Object.entries(sanitized)) {
            if (key.startsWith('q.')) {
                query[key.slice(2)] = { $regex: value, $options: 'i' };
            } else {
                query[key] = value;
            }
        }
        return query;
    }
}
