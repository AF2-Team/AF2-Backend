import { Model, WhereOptions, FindOptions, CreationAttributes, ModelStatic, Identifier } from 'sequelize';
import { BaseRepository } from '@bases/repository.base.js';
import { DatabaseError } from '@errors/database.error.js';

export class SequelizeRepositoryBase<T = any, ID extends Identifier = string> extends BaseRepository<T, ID> {
    private model: ModelStatic<Model>;

    constructor(model: ModelStatic<Model>, databaseName: string = 'default') {
        super(model.name, databaseName);
        this.model = model;
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
                        database: this.databaseName,
                        model: this.model.name,
                        error: error.message,
                    },
                    { cause: error },
                );
            }
        });
    }

    async find(filter: Partial<T> | Record<string, unknown>, options?: Partial<FindOptions>): Promise<T[]> {
        return this.executeWithLogging('find', async () => {
            try {
                const where = this.buildWhereClause(filter);

                const findOpts: FindOptions = {
                    where,
                    ...options,
                    raw: true,
                };

                const results = await this.model.findAll(findOpts);

                return results as unknown as T[];
            } catch (error: any) {
                throw new DatabaseError(
                    `Sequelize 'find' operation failed`,
                    'find',
                    {
                        filter,
                        options,
                        database: this.databaseName,
                        model: this.model.name,
                        error: error.message,
                    },
                    { cause: error },
                );
            }
        });
    }

    async findById(id: ID): Promise<T | null> {
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
                        database: this.databaseName,
                        model: this.model.name,
                        error: error.message,
                    },
                    { cause: error },
                );
            }
        });
    }

    async findOne(filter: Partial<T> | Record<string, unknown>): Promise<T | null> {
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
                        database: this.databaseName,
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

                const updated = await this.findById(id);
                return updated;
            } catch (error: any) {
                throw new DatabaseError(
                    `Sequelize 'update' operation failed`,
                    'update',
                    {
                        id,
                        data,
                        database: this.databaseName,
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
                        database: this.databaseName,
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
                const where = this.buildWhereClause(filter);
                const count = await this.model.count({ where });
                return count;
            } catch (error: any) {
                throw new DatabaseError(
                    `Sequelize 'count' operation failed`,
                    'count',
                    {
                        filter,
                        database: this.databaseName,
                        model: this.model.name,
                        error: error.message,
                    },
                    { cause: error },
                );
            }
        });
    }

    private buildWhereClause(filter?: Partial<T> | Record<string, unknown>): WhereOptions | undefined {
        if (!filter) return undefined;

        const sanitized = this.sanitizeFilter(filter);
        const where: WhereOptions = {};

        for (const [key, value] of Object.entries(sanitized)) {
            if (value === undefined || value === null) continue;

            /*if (!key.startsWith('q.')) {
                const field = key.substring(2);
                where[field] = { [this.getSequelizeOperator(value)]: value };

                continue;
            }*/

            where[key] = value as any;
        }

        return Object.keys(where).length > 0 ? where : undefined;
    }

    private getSequelizeOperator(value: any): string {
        if (typeof value === 'string' && value.includes('*')) return '$like';
        if (typeof value === 'string') return '$eq';
        if (typeof value === 'number') return '$eq';
        return '$eq';
    }

    private validateId(id: ID): void {
        // Aquí necesitarías una validación más específica basada en el tipo real de ID
        if (!id)
            throw new DatabaseError(`Invalid ID: ${id}`, 'validateId', {
                id,
                model: this.model.name,
            });

        // Validación adicional según el tipo
        if (typeof id !== 'string' && typeof id !== 'number') {
            throw new DatabaseError(`ID must be string or number, got ${typeof id}: ${id}`, 'validateId', {
                id,
                model: this.model.name,
            });
        }
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
