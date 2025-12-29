import { IDatabaseConfig, IDatabaseHealth } from '@rules/database.type.js';
import { BaseDatabaseConnector } from '@bases/db-connector.base.js';
import { DatabaseConfig } from '@config/database.config.js';
import { SequelizeConnector } from '@database/connectors/sequelize.connector.js';

export class DatabaseManager {
    private static instance: DatabaseManager;
    private connectors: Map<string, BaseDatabaseConnector> = new Map();

    private constructor() {}

    static getInstance(): DatabaseManager {
        if (!DatabaseManager.instance) DatabaseManager.instance = new DatabaseManager();

        return DatabaseManager.instance;
    }

    async initialize(): Promise<void> {
        for (const config of DatabaseConfig.loadAll()) {
            if (!config.enabled) continue;

            const connector = this.createConnector(config);
            await connector.connect();
            await connector.authenticate();

            this.connectors.set(config.name, connector);
        }
    }

    private createConnector(config: IDatabaseConfig): BaseDatabaseConnector {
        switch (config.type) {
            case 'postgresql':
            case 'mysql':
                return new SequelizeConnector(config);
            default:
                throw new Error(`Unsupported database type: ${config.type}`);
        }
    }

    getConnector(name: string): BaseDatabaseConnector {
        const connector = this.connectors.get(name);
        if (!connector) throw new Error(`Database connector '${name}' not found`);
        return connector;
    }

    getDefaultConnector(): BaseDatabaseConnector {
        const defaultConfig = DatabaseConfig.loadDefault();
        if (!defaultConfig) throw new Error('No default database configured');
        return this.getConnector(defaultConfig.name);
    }

    async shutdown(name?: string): Promise<void> {
        if (name) {
            if (this.connectors.has(name)) return;

            this.connectors.get(name)?.disconnect();

            return;
        }

        for (const connector of this.connectors.values()) await connector.disconnect();
        this.connectors.clear();
    }

    getHealth(): IDatabaseHealth {
        const health: IDatabaseHealth = {};

        for (const [name, connector] of this.connectors) {
            health[name] = {
                connected: connector.isConnected(),
                type: connector.getDatabaseType(),
                lastPing: new Date(),
            };
        }

        return health;
    }
}
