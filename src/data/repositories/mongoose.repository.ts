import { Model, HydratedDocument, FilterQuery } from 'mongoose';
import { BaseRepository, QueryOptions } from '@bases/repository.base';

export class MongooseRepository<T, D extends HydratedDocument<T>, ID = string> extends BaseRepository<T, ID> {
    protected readonly model: Model<T>;

    constructor(model: Model<T>, repositoryName: string) {
        super(repositoryName);
        this.model = model;
    }

    async create(data: Partial<T>): Promise<T> {
        return this.executeWithLogging('create', async () => {
            const document = new this.model(data);
            await document.save();
            return document.toObject() as T;
        });
    }

    async findById(id: ID): Promise<T | null> {
        return this.executeWithLogging('findById', async () => {
            const doc = await this.model.findById(id as any).exec();
            return doc ? (doc.toObject() as T) : null;
        });
    }

    async findOne(filter: Partial<T>): Promise<T | null> {
        return this.executeWithLogging('findOne', async () => {
            const sanitized = this.sanitizeFilter(filter);
            const doc = await this.model.findOne(sanitized as FilterQuery<T>).exec();
            return doc ? (doc.toObject() as T) : null;
        });
    }

    async find(filter: Partial<T> = {}, options: QueryOptions<T> = {}): Promise<T[]> {
        return this.executeWithLogging('find', async () => {
            const sanitized = this.sanitizeFilter(filter);

            let query = this.model.find(sanitized as FilterQuery<T>);
            if (options.skip !== undefined) query = query.skip(options.skip);
            if (options.limit !== undefined) query = query.limit(options.limit);
            if (options.sort) query = query.sort(options.sort);
            if (options.select) query = query.select(options.select.join(' '));

            const docs = await query.exec();
            return docs.map((doc) => doc.toObject() as T);
        });
    }

    async update(id: ID, data: Partial<T>): Promise<T | null> {
        return this.executeWithLogging('update', async () => {
            const doc = await this.model
                .findByIdAndUpdate(id as any, { $set: data }, { new: true, runValidators: true })
                .exec();

            return doc ? (doc.toObject() as T) : null;
        });
    }

    async delete(id: ID): Promise<boolean> {
        return this.executeWithLogging('delete', async () => {
            const result = await this.model.findByIdAndDelete(id as any).exec();
            return !!result;
        });
    }

    async count(filter: Partial<T>): Promise<number> {
        return this.executeWithLogging('count', async () => {
            const sanitized = this.sanitizeFilter(filter);
            return this.model.countDocuments(sanitized as FilterQuery<T>).exec();
        });
    }
}
