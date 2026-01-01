import { IDatabaseConfig, IDatabaseHealth } from '@rules/database.type.js';
import { BaseDatabaseConnector } from '@bases/db-connector.base.js';
import { DatabaseConfig } from '@config/database.config.js';
import { SequelizeConnector } from '@database/connectors/sequelize.connector.js';
import { MongooseConnector } from '@database/connectors/mongoose.connector.js';
import { Logger } from '@utils/logger.js';
import { readdirSync, promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { BaseRepository } from '@bases/repository.base.js';
import { DatabaseRepositoryError } from '@errors/database.error.js';
import { ANSI } from '@utils/ansi.util.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class DatabaseManager {
    private connectors: Map<string, BaseDatabaseConnector> = new Map();
    private repositories: Map<string, any> = new Map();

    constructor() {}

    async initialize(): Promise<void> {
        await this.initializeModels();
        await this.initializeRepositories();
    }

    async initializeModels(): Promise<void> {
        // Mapeamos las configuraciones directamente a promesas
        const promises = DatabaseConfig.loadAll()
            .filter((config) => config.enabled) // Solo los habilitados
            .map(async (config) => {
                Logger.natural(`Trying to connect to '${config.id}' database as '${config.type}' type...`);
                const connector = this.createConnector(config);

                // Si esto falla, la promesa lanzará el error y Promise.all lo capturará
                await connector.connect();

                this.connectors.set(config.id, connector);
                return null;
            });

        if (promises.length > 0) await Promise.all(promises);
        else Logger.natural(ANSI.info(`Enabled databases connectors was not found`));
    }

    async initializeRepositories() {
        const dbConfig = DatabaseConfig.loadAll().filter((conf) => conf.enabled);
        const modelsPath = path.join(__dirname, 'repositories');

        for (const config of dbConfig) {
            const dbInstanceRepoPath = path.join(modelsPath, config.id);

            await fs.access(dbInstanceRepoPath);

            const repoNames = readdirSync(dbInstanceRepoPath, { withFileTypes: true })
                .filter((dirent) => dirent.isFile() && !/^(index)/.test(dirent.name) && /\.(js|ts)$/.test(dirent.name))
                .map((dirent) => dirent.name)
                .reduce((acu: string[], cur: string) => {
                    const index = acu.findIndex((name: string) => {
                        const onlyName = cur.replace(/\.(ts|js)$/, '.');

                        return name.includes(onlyName);
                    });

                    if (index === -1) acu.push(cur);
                    else if (index !== -1) if (!/\.js$/.test(acu[index]) && /\.js$/.test(cur)) acu[index] = cur;

                    return acu;
                }, []);

            for (const repoName of repoNames) {
                const repoPath = path.join(dbInstanceRepoPath, repoName);

                // Importar dinámicamente
                const repoUrl = pathToFileURL(repoPath);
                let repoDefinition = await import(repoUrl.toString());

                if (!repoDefinition.default || typeof repoDefinition.default !== 'object')
                    throw new Error(`Model ${repoName} does not export a valid class`);

                repoDefinition = repoDefinition.default;
                const repoRawName = repoDefinition.constructor.name
                    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
                    .toLowerCase()
                    .replace('-repository', '');

                this.repositories.set(`${config.id}.${repoRawName}`, repoDefinition);
            }

            if (repoNames.length > 0)
                Logger.natural(
                    ANSI.success(`[+] Repositories for '${config.id}' database as '${config.type}' type loaded`),
                );
        }

        if (dbConfig.length === 0) Logger.natural(ANSI.info(`Enabled databases connectors was not found`));
    }

    private createConnector(config: IDatabaseConfig): BaseDatabaseConnector {
        switch (config.type) {
            case 'postgresql':
            case 'mysql':
                return new SequelizeConnector(config);
            case 'mongodb':
                return new MongooseConnector(config);
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

    repository(connectorName: string, repoName: string): BaseRepository<any, any> {
        const key = `${connectorName}.${repoName}`;

        if (!this.repositories.has(key)) throw new DatabaseRepositoryError('Not found');

        return this.repositories.get(key);
    }

    list(): Array<{ connectorName: string; repoName: string }> {
        return Array.from(this.repositories.keys()).map((key) => {
            const [connectorName, repoName] = key.split('.');

            return { connectorName, repoName };
        });
    }

    async shutdown(): Promise<void> {
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

export const Database = new DatabaseManager();
