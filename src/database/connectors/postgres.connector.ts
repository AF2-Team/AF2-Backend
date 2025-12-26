import { Sequelize } from 'sequelize';
import { BaseDatabaseConnector } from '@bases/db-connector.base.js';
import { DatabaseConfig } from '@rules/database.type.js';
import * as Models from '../models/index.js';

export class PostgresConnector extends BaseDatabaseConnector {
    private sequelize!: Sequelize;

    constructor(config: DatabaseConfig) {
        super(config);
    }

    async connect(): Promise<void> {
        this.sequelize = new Sequelize(this.config.database!, this.config.username!, this.config.password!, {
            host: this.config.host,
            port: this.config.port,
            dialect: this.config.dialect as any,
            timezone: this.config.timezone,
            logging: this.config.logging,
            pool: this.config.pool,
        });

        await this.sequelize.authenticate();
        this.setConnectedStatus(true);

        await this.afterConnect();
    }

    protected async afterConnect(): Promise<void> {
        for (const [name, modelFactory] of Object.entries(Models)) {
            const model = modelFactory(this.sequelize);
            this.registerModel(name, model);
        }

        await this.sync(this.config.syncOptions);
    }

    async disconnect(): Promise<void> {
        await this.beforeDisconnect();
        await this.sequelize.close();
        this.setConnectedStatus(false);
        this.clearModels();
    }

    async ping(): Promise<boolean> {
        try {
            await this.sequelize.authenticate();
            return true;
        } catch {
            return false;
        }
    }

    async sync(options?: any): Promise<void> {
        await this.sequelize.sync(options);
    }

    getModel<T = any>(modelName: string): T {
        if (!this.models.has(modelName)) {
            throw new Error(`Model '${modelName}' not found`);
        }
        return this.models.get(modelName);
    }

    getRepository(): never {
        throw new Error('Repositories are resolved via RepositoryManager');
    }
}
