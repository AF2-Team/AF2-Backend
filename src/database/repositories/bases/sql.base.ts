import { Model, WhereOptions, FindOptions, CreationAttributes, ModelStatic } from 'sequelize';
import { BaseRepository } from '@bases/repository.base.js';
import { DatabaseError } from '@errors/database.error.js';

export class SqlRepository<T = any> extends BaseRepository<T> {
    private model: ModelStatic<Model>;

    constructor(model: ModelStatic<Model>, databaseName: string = 'default') {
        super(databaseName);
        this.model = model;
    }

    async find(filter?: any, options?: FindOptions): Promise<T[]> {
        try {
            const where = this.buildWhereClause(filter);
            const findOptions: FindOptions = {
                where,
                ...options,
                raw: true,
            };

            const results = await this.model.findAll(findOptions);
            return results as unknown as T[];
        } catch (error: any) {
            throw new DatabaseError(
                `SQL find operation failed`,
                'find',
                { filter, database: this.databaseName, error: error.message },
                { cause: error },
            );
        }
    }

    async findById(id: string): Promise<T | null> {
        try {
            this.validateId(id);

            const result = await this.model.findByPk(id, { raw: true });
            return result as unknown as T | null;
        } catch (error: any) {
            throw new DatabaseError(
                `SQL findById operation failed`,
                'findById',
                { id, database: this.databaseName, error: error.message },
                { cause: error },
            );
        }
    }

    async findOne(filter: any): Promise<T | null> {
        try {
            const where = this.buildWhereClause(filter);

            const result = await this.model.findOne({
                where,
                raw: true,
            });

            return result as unknown as T | null;
        } catch (error: any) {
            throw new DatabaseError(
                `SQL findOne operation failed`,
                'findOne',
                { filter, database: this.databaseName, error: error.message },
                { cause: error },
            );
        }
    }

    async create(data: Partial<T>): Promise<T> {
        try {
            const creationData = data as CreationAttributes<Model>;
            const result = await this.model.create(creationData, { raw: true });

            return result.toJSON() as T;
        } catch (error: any) {
            throw new DatabaseError(
                `SQL create operation failed`,
                'create',
                { data, database: this.databaseName, error: error.message },
                { cause: error },
            );
        }
    }

    async update(id: string, data: Partial<T>): Promise<T | null> {
        try {
            this.validateId(id);

            const [affectedRows] = await this.model.update(data, {
                where: { id } as WhereOptions,
                returning: true,
            });

            if (affectedRows === 0) {
                return null;
            }

            const updated = await this.findById(id);
            return updated;
        } catch (error: any) {
            throw new DatabaseError(
                `SQL update operation failed`,
                'update',
                { id, data, database: this.databaseName, error: error.message },
                { cause: error },
            );
        }
    }

    async delete(id: string): Promise<boolean> {
        try {
            this.validateId(id);

            const affectedRows = await this.model.destroy({
                where: { id } as WhereOptions,
            });

            return affectedRows > 0;
        } catch (error: any) {
            throw new DatabaseError(
                `SQL delete operation failed`,
                'delete',
                { id, database: this.databaseName, error: error.message },
                { cause: error },
            );
        }
    }

    async count(filter?: any): Promise<number> {
        try {
            const where = this.buildWhereClause(filter);
            const count = await this.model.count({ where });
            return count;
        } catch (error: any) {
            throw new DatabaseError(
                `SQL count operation failed`,
                'count',
                { filter, database: this.databaseName, error: error.message },
                { cause: error },
            );
        }
    }

    private buildWhereClause(filter?: any): WhereOptions | undefined {
        if (!filter) return undefined;

        const where: WhereOptions = {};

        for (const [key, value] of Object.entries(filter)) {
            if (value === undefined || value === null) continue;

            // Soporte para operadores especiales
            if (typeof value === 'object' && !Array.isArray(value)) {
                where[key] = value;
            } else {
                where[key] = value;
            }
        }

        return Object.keys(where).length > 0 ? where : undefined;
    }

    getModel(): ModelStatic<Model> {
        return this.model;
    }

    async transaction<T>(callback: (t: any) => Promise<T>): Promise<T> {
        const sequelize = this.model.sequelize;
        if (!sequelize) {
            throw new DatabaseError('Sequelize instance not available for transaction');
        }

        return await sequelize.transaction(callback);
    }
}
