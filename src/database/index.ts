import { DatabaseConfig, DatabaseHealth, DatabaseStats, DatabaseType } from '@rules/database.type.js';
import { BaseDatabaseConnector } from '@bases/db-connector.base.js';
import { databaseConfigs } from '@config/database.config.js';
import { PostgresConnector } from '@database/connectors/postgres.connector.js';
import { MongoConnector } from '@db-connectors/mongoose.connector.js';

export class DatabaseManager {
    private static instance: DatabaseManager;
    private connectors: Map<string, BaseDatabaseConnector> = new Map();

    private constructor() {}

    static getInstance(): DatabaseManager {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    }

    async initialize(): Promise<void> {
        for (const config of databaseConfigs) {
            if (!config.enabled) continue;

            const connector = this.createConnector(config);
            await connector.connect();
            await connector.authenticate();

            this.connectors.set(config.name, connector);
        }
    }

    private createConnector(config: DatabaseConfig): BaseDatabaseConnector {
        switch (config.type) {
            case 'postgresql':
            case 'mysql':
                return new PostgresConnector(config);
            case 'mongodb':
                return new MongoConnector(config);
            default:
                throw new Error(`Unsupported database type: ${config.type}`);
        }
    }

    getConnector(name: string): BaseDatabaseConnector {
        const connector = this.connectors.get(name);
        if (!connector) {
            throw new Error(`Database connector '${name}' not found`);
        }
        return connector;
    }

    getDefaultConnector(): BaseDatabaseConnector {
        const defaultConfig = databaseConfigs.find((c) => c.isDefault);
        if (!defaultConfig) {
            throw new Error('No default database configured');
        }
        return this.getConnector(defaultConfig.name);
    }

    async shutdown(): Promise<void> {
        for (const connector of this.connectors.values()) {
            await connector.disconnect();
        }
        this.connectors.clear();
    }

    getHealth(): DatabaseHealth {
        const health: DatabaseHealth = {};

        for (const [name, connector] of this.connectors) {
            health[name] = {
                connected: connector.isDatabaseConnected(),
                type: connector.getDatabaseType(),
                lastPing: new Date(),
                models: connector.getModelCount(),
            };
        }

        return health;
    }

    getStats(): DatabaseStats {
        const stats: DatabaseStats = {
            total: this.connectors.size,
            connected: 0,
            byType: {
                postgresql: 0,
                mysql: 0,
                mongodb: 0,
            },
            databases: {},
        };

        for (const [name, connector] of this.connectors) {
            const connected = connector.isDatabaseConnected();
            if (connected) stats.connected++;

            stats.byType[connector.getDatabaseType()]++;
            stats.databases[name] = {
                type: connector.getDatabaseType(),
                connected,
                models: connector.getModelCount(),
            };
        }

        return stats;
    }
}
