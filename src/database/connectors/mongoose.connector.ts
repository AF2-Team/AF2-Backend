import mongoose from 'mongoose';
import { BaseDatabaseConnector } from '@bases/db-connector.base.js';
import { DatabaseConfig } from '@rules/database.type.js';
import * as Models from '@models/index.js';

export class MongoConnector extends BaseDatabaseConnector {
    constructor(config: DatabaseConfig) {
        super(config);
    }

    async connect(): Promise<void> {
        await mongoose.connect(this.config.uri!, {
            dbName: this.config.database,
        });

        this.setConnectedStatus(true);
        await this.afterConnect();
    }

    protected async afterConnect(): Promise<void> {
        for (const [name, schema] of Object.entries(Models)) {
            const model = mongoose.model(name, schema);
            this.registerModel(name, model);
        }
    }

    async disconnect(): Promise<void> {
        await this.beforeDisconnect();
        await mongoose.disconnect();
        this.setConnectedStatus(false);
        this.clearModels();
    }

    async ping(): Promise<boolean> {
        return mongoose.connection.readyState === 1;
    }

    async sync(): Promise<void> {
        return;
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
