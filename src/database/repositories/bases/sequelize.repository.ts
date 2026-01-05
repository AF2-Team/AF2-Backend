import { ModelStatic, Model as SequelizeModel, WhereOptions, Identifier, Transaction } from 'sequelize';
import { DatabaseError } from '@errors/database.error.js';

export abstract class SequelizeRepositoryBase<T, ID extends Identifier = number> {
    protected model: ModelStatic<SequelizeModel<T & any>>;

    constructor(model: ModelStatic<SequelizeModel<T & any>>) {
        this.model = model;
    }

    protected async execute<R>(operation: string, fn: () => Promise<R>): Promise<R> {
        try {
            return await fn();
        } catch (error: any) {
            throw new DatabaseError(`${this.model.name}.${operation}`, error);
        }
    }

    async getAll(filters: Record<string, any> = {}): Promise<T[]> {
        return this.execute('getAll', async () => {
            const where = this.buildWhereClause({
                ...filters,
                status: 1,
            });

            const results = await this.model.findAll({
                where,
                raw: true,
            });

            return results as unknown as T[];
        });
    }

    async getById(id: ID): Promise<T | null> {
        return this.execute('getById', async () => {
            this.validateId(id);

            const result = await this.model.findOne({
                where: { id, status: 1 } as any,
                raw: true,
            });

            return result as unknown as T | null;
        });
    }

    async create(data: Partial<T>): Promise<T> {
        return this.execute('create', async () => {
            const result = await this.model.create(data as any);
            return result.get({ plain: true }) as T;
        });
    }

    async update(id: ID, data: Partial<T>): Promise<T | null> {
        return this.execute('update', async () => {
            this.validateId(id);

            const [affectedCount] = await this.model.update(data as any, {
                where: { id } as any,
            });

            if (affectedCount === 0) return null;

            return this.getById(id);
        });
    }

    async upsert(filter: Record<string, any>, data: Partial<T>): Promise<T | null> {
        return this.execute('upsert', async () => {
            const existing = await this.model.findOne({
                where: filter as any,
            });

            if (existing) {
                await existing.update(data as any);
                return existing.get({ plain: true }) as T;
            }

            const created = await this.model.create({
                ...filter,
                ...data,
            } as any);

            return created.get({ plain: true }) as T;
        });
    }

    async removeById(id: ID): Promise<void> {
        return this.execute('removeById', async () => {
            this.validateId(id);
            await this.model.destroy({
                where: { id } as any,
            });
        });
    }

    async transaction<R>(callback: (t: Transaction) => Promise<R>): Promise<R> {
        const sequelize = this.model.sequelize;

        if (!sequelize) {
            throw new Error('Sequelize instance not available');
        }

        return sequelize.transaction(callback);
    }

    protected buildWhereClause(filters: Record<string, any>): WhereOptions {
        const where: any = {};

        for (const [key, value] of Object.entries(filters)) {
            if (value === undefined || value === null) continue;
            where[key] = value;
        }

        return where;
    }

    protected validateId(id: ID): void {
        if (id === null || id === undefined) {
            throw new Error(`[${this.model.name}] Invalid ID provided`);
        }
    }
}
