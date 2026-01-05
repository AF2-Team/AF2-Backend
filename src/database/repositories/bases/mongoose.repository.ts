import type { Model } from 'mongoose';
import { DatabaseError } from '@errors/database.error.js';

type ModelWrapper<T> = Model<T> | { instance: Model<T> } | { model: Model<T> };

function resolveMongooseModel<T>(input: ModelWrapper<T>): Model<T> {
    if (typeof (input as any)?.findOne === 'function') {
        return input as Model<T>;
    }

    if ((input as any)?.instance && typeof (input as any).instance.findOne === 'function') {
        return (input as any).instance as Model<T>;
    }

    if ((input as any)?.model && typeof (input as any).model.findOne === 'function') {
        return (input as any).model as Model<T>;
    }

    throw new Error('Invalid model provided to MongooseRepositoryBase');
}

export abstract class MongooseRepositoryBase<T> {
    protected model: Model<T>;

    constructor(model: ModelWrapper<T>) {
        this.model = resolveMongooseModel(model);
    }

    protected async execute<R>(operation: string, fn: () => Promise<R>): Promise<R> {
        try {
            return await fn();
        } catch (error: any) {
            throw new DatabaseError(`${this.model.modelName}.${operation}`, error);
        }
    }

    async getAll(options: any = {}, filters: Record<string, any> = {}, projection: any = null): Promise<T[]> {
        return this.execute('getAll', async () => {
            const query = this.buildFilter({
                ...filters,
                status: 1,
            });

            const prepared = this.prepareOptions(options);
            return this.model.find(query, projection, prepared).exec();
        });
    }

    async getOne(filters: Record<string, any> = {}, projection: any = null): Promise<T | null> {
        return this.execute('getOne', async () => {
            const query = this.buildFilter({
                ...filters,
                status: 1,
            });

            return this.model.findOne(query, projection).exec();
        });
    }

    async getById(id: string): Promise<T | null> {
        return this.execute('getById', async () => {
            return this.model.findOne({ _id: id, status: 1 } as any).exec();
        });
    }

    async create(data: Partial<T>): Promise<T> {
        return this.execute('create', async () => {
            return this.model.create(data as any);
        });
    }

    async update(id: string, data: Partial<T>): Promise<T | null> {
        return this.execute('update', async () => {
            return this.model
                .findOneAndUpdate({ _id: id, status: 1 } as any, data as any, { new: true, runValidators: true })
                .exec();
        });
    }

    async upsert(filter: Record<string, any>, data: Partial<T>): Promise<T | null> {
        return this.execute('upsert', async () => {
            return this.model
                .findOneAndUpdate(filter as any, { $set: data } as any, {
                    upsert: true,
                    new: true,
                    runValidators: true,
                })
                .exec();
        });
    }

    async removeById(id: string): Promise<void> {
        return this.execute('removeById', async () => {
            await this.model.deleteOne({ _id: id } as any);
        });
    }

    protected buildFilter(filters: Record<string, any>): Record<string, any> {
        const query: Record<string, any> = {};

        for (const [key, value] of Object.entries(filters)) {
            if (value === undefined || value === null) continue;

            if (key.startsWith('q.')) {
                const field = key.replace('q.', '');
                query[field] = new RegExp(this.escapeRegex(String(value)), 'i');
                continue;
            }

            query[key] = value;
        }

        return query;
    }

    protected escapeRegex(value: string): string {
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    protected prepareOptions(options: any) {
        const queryOptions: any = {};

        if (options?.pagination) {
            queryOptions.skip = options.pagination.offset ?? 0;
            queryOptions.limit = options.pagination.limit ?? 20;
        }

        if (options?.order) {
            queryOptions.sort = options.order;
        }

        return queryOptions;
    }
}
