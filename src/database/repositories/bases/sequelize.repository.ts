import { Model, WhereOptions, FindOptions, CreationAttributes, ModelStatic, Identifier } from 'sequelize';
import { BaseRepository } from '@bases/repository.base.js';
import { DatabaseError } from '@errors/database.error.js';
import { ModelWithAssociate, SequelizeModelBase } from '@database/models/bases/sequelize.model.js';
import { ProcessedQueryFilters } from '@rules/api-query.type.js';

export type SequelizeModelClass = typeof SequelizeModelBase & {
    instance?: ModelWithAssociate;
};

export class SequelizeRepositoryBase<T = any, ID extends Identifier = string> extends BaseRepository<
    T,
    ID,
    ModelWithAssociate
> {
    protected override model: ModelWithAssociate;

    constructor(modelClass: SequelizeModelClass) {
        if (!modelClass.instance) throw new Error(`Model ${modelClass.name} has not been initialized`);

        super(modelClass.instance);
        this.model = modelClass.instance;
    }

    async create(data: Partial<T>): Promise<T> {
        return this.executeWithLogging('create', async () => {
            try {
                const creationData = data as CreationAttributes<Model>;
                const result = await this.model.create(creationData, { raw: true });
                return result.toJSON() as T;
            } catch (error: any) {
                throw new DatabaseError(
                    `Sequelize 'create' operation failed`,
                    'create',
                    {
                        data,
                        database: this.model.dbInstanceName,
                        model: this.model.name,
                        error: error.message,
                    },
                    { cause: error },
                );
            }
        });
    }

    async getAll(options: ProcessedQueryFilters, filter?: Partial<T> | Record<string, unknown>): Promise<T[]> {
        return this.executeWithLogging('find', async () => {
            try {
                const where = this.buildWhereClause(filter ?? {});
                const _options = this.prepareOptions(options);

                const findOpts: FindOptions = {
                    where,
                    ..._options,
                    raw: true,
                };

                const results = await this.model.findAndCountAll(findOpts);

                return results as unknown as T[];
            } catch (error: any) {
                throw new DatabaseError(
                    `Sequelize 'find' operation failed`,
                    'find',
                    {
                        filter,
                        options,
                        database: this.model.dbInstanceName,
                        model: this.model.name,
                        error: error.message,
                    },
                    { cause: error },
                );
            }
        });
    }

    async getAllActive(options: ProcessedQueryFilters, filter?: Partial<T> | Record<string, unknown>): Promise<T[]> {
        const activeFilter = {
            ...filter,
            status: 1,
        } as Record<string, unknown>;

        return this.getAll(options, activeFilter);
    }

    async getById(id: ID): Promise<T | null> {
        return this.executeWithLogging('findById', async () => {
            try {
                this.validateId(id);
                const result = await this.model.findByPk(id, { raw: true });
                return result as unknown as T | null;
            } catch (error: any) {
                throw new DatabaseError(
                    `Sequelize 'findById' operation failed`,
                    'findById',
                    {
                        id,
                        database: this.model.dbInstanceName,
                        model: this.model.name,
                        error: error.message,
                    },
                    { cause: error },
                );
            }
        });
    }

    async getOne(filter: Partial<T> | Record<string, unknown>): Promise<T | null> {
        return this.executeWithLogging('findOne', async () => {
            try {
                const where = this.buildWhereClause(filter);
                const result = await this.model.findOne({
                    where,
                    raw: true,
                });
                return result as unknown as T | null;
            } catch (error: any) {
                throw new DatabaseError(
                    `Sequelize 'findOne' operation failed`,
                    'findOne',
                    {
                        filter,
                        database: this.model.dbInstanceName,
                        model: this.model.name,
                        error: error.message,
                    },
                    { cause: error },
                );
            }
        });
    }

    async update(id: ID, data: Partial<T>): Promise<T | null> {
        return this.executeWithLogging('update', async () => {
            try {
                this.validateId(id);

                const [affectedRows] = await this.model.update(data, {
                    where: { id } as WhereOptions,
                    returning: true,
                });

                if (affectedRows === 0) return null;

                const updated = await this.getById(id);
                return updated;
            } catch (error: any) {
                throw new DatabaseError(
                    `Sequelize 'update' operation failed`,
                    'update',
                    {
                        id,
                        data,
                        database: this.model.dbInstanceName,
                        model: this.model.name,
                        error: error.message,
                    },
                    { cause: error },
                );
            }
        });
    }

    async delete(id: ID[]): Promise<boolean> {
        return this.executeWithLogging('delete', async () => {
            try {
                const ids = Array.isArray(id) ? id : [id];
                ids.forEach(this.validateId.bind(this));

                const where = { id: ids } as WhereOptions;
                const affectedRows = await this.model.destroy({ where });

                return affectedRows > 0;
            } catch (error: any) {
                throw new DatabaseError(
                    `Sequelize 'delete' operation failed`,
                    'delete',
                    {
                        id,
                        database: this.model.dbInstanceName,
                        model: this.model.name,
                        error: error.message,
                    },
                    { cause: error },
                );
            }
        });
    }

    async count(filter: Partial<T> | Record<string, unknown>): Promise<number> {
        return this.executeWithLogging('count', async () => {
            try {
                const where = this.buildWhereClause(filter ?? {});
                const count = await this.model.count({ where });
                return count;
            } catch (error: any) {
                throw new DatabaseError(
                    `Sequelize 'count' operation failed`,
                    'count',
                    {
                        filter,
                        database: this.model.dbInstanceName,
                        model: this.model.name,
                        error: error.message,
                    },
                    { cause: error },
                );
            }
        });
    }

    private buildWhereClause(filter?: Partial<T> | Record<string, unknown>): WhereOptions | undefined {
        if (!filter) return;

        const sanitized = this.sanitizeFilter(filter);
        const where: WhereOptions = {};

        for (const [key, value] of Object.entries(sanitized)) {
            if (key.startsWith('q.')) {
                where[key.slice(2)] = value;
                continue;
            }

            where[key] = value as any;
        }

        return Object.keys(where).length ? where : undefined;
    }

    private validateId(id: ID): void {
        if (id === null || id === undefined)
            throw new DatabaseError(`Invalid ID: ${id}`, 'validateId', {
                id,
                model: this.model.name,
            });

        if (typeof id !== 'string' && typeof id !== 'number')
            throw new DatabaseError(`ID must be string or number, got ${typeof id}: ${id}`, 'validateId', {
                id,
                model: this.model.name,
            });
    }

    getModel(): ModelStatic<Model> {
        return this.model;
    }

    async transaction<T>(callback: (t: any) => Promise<T>): Promise<T> {
        const sequelize = this.model.sequelize;
        if (!sequelize) throw new DatabaseError('Sequelize instance not available for transaction');

        return await sequelize.transaction(callback);
    }
}
