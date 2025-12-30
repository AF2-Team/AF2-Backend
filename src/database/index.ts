import { IDatabaseConfig, IDatabaseHealth } from '@rules/database.type.js';
import { BaseDatabaseConnector } from '@bases/db-connector.base.js';
import { DatabaseConfig } from '@config/database.config.js';
import { SequelizeConnector } from '@database/connectors/sequelize.connector.js';
import { Logger } from '@utils/logger.js';

class DatabaseManager {
    private connectors: Map<string, BaseDatabaseConnector> = new Map();

    constructor() {}

    async initialize(): Promise<void> {
        Logger.natural('------ [ Connecting to Databases ] ------');
        const promises: Promise<null>[] = [];

        DatabaseConfig.loadAll().map((config) => {
            if (!config.enabled) return;

            const connector = this.createConnector(config);
            promises.push(
                new Promise(async (resolve) => {
                    await connector.connect();

                    this.connectors.set(config.id, connector);
                    resolve(null);
                }),
            );
        });

        await Promise.all(promises);
        Logger.natural(''.padEnd(41, '-'));
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
        return this.getConnector(defaultConfig.id);
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

export const Database = new DatabaseManager();
