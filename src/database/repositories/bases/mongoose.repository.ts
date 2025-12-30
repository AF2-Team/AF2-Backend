import { Model, QueryFilter} from 'mongoose';
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

                // Paginación
                if (options.pagination) {
                    query.skip(options.pagination.offset);
                    if (options.pagination.limit && options.pagination.limit > 0) {
                        query.limit(options.pagination.limit);
                    }
                }

                // Ordenamiento
                if (options.order && options.order.length > 0) {
                    const sortObject: any = {};
                    options.order.forEach(([field, direction]) => {
                        sortObject[field] = direction === 'asc' ? 1 : -1;
                    });
                    query.sort(sortObject);
                }

                const results = await query.exec();
                return results.map(r => r.toJSON()) as T[];
            } catch (error: any) {
                throw new DatabaseError('Mongoose find failed', 'find', { error: error.message }, { cause: error });
            }
        });
    }

    // Implementación requerida por la clase abstracta
    async getAllActive(options: ProcessedQueryFilters, filter?: Partial<T>): Promise<T[]> {
        return this.getAll(options, { ...filter, status: 1 } as any);
    }

    async getById(id: string): Promise<T | null> {
        return this.executeWithLogging('findById', async () => {
            try {
                const result = await this.model.findById(id);
                return result ? (result.toJSON() as T) : null;
            } catch (error: any) {
                 throw new DatabaseError('Mongoose findById failed', 'findById', { id, error: error.message }, { cause: error });
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
                throw new DatabaseError('Mongoose findOne failed', 'findOne', { error: error.message }, { cause: error });
            }
        });
    }

    async update(id: string, data: Partial<T>): Promise<T | null> {
        return this.executeWithLogging('update', async () => {
            try {
                const result = await this.model.findByIdAndUpdate(
                    id, 
                    { $set: data }, 
                    { new: true, runValidators: true }
                );
                return result ? (result.toJSON() as T) : null;
            } catch (error: any) {
                throw new DatabaseError('Mongoose update failed', 'update', { id, error: error.message }, { cause: error });
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
                throw new DatabaseError('Mongoose delete failed', 'delete', { id, error: error.message }, { cause: error });
            }
        });
    }

    async count(filter?: Partial<T> | Record<string, unknown>): Promise<number> {
        return this.executeWithLogging('count', async () => {
            const mongooseFilter = this.buildFilter(filter);
            return await this.model.countDocuments(mongooseFilter);
        });
    }

    private buildFilter(filter?: Partial<T> | Record<string, unknown>): QueryFilter<any> {
        if (!filter) return {};
        
        const sanitized = this.sanitizeFilter(filter);
        const query: Record<string, any> = {};

        for (const [key, value] of Object.entries(sanitized)) {
            // Manejo especial para filtros avanzados (ej. rangos, búsquedas parciales)
            // Aquí puedes adaptar tu lógica de 'qc.' (Query Conditions)
            if (key.startsWith('q.')) {
                // Implementación básica para búsqueda parcial con regex
                query[key.slice(2)] = { $regex: value, $options: 'i' };
            } else {
                query[key] = value;
            }
        }
        return query;
    }
}