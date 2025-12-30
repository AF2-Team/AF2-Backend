import { Logger } from '@utils/logger.js';
import { DatabaseConfig } from '@config/database.config.js';
import { readdirSync, promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { BaseRepository } from '@bases/repository.base.js';
import { BaseModel } from '@bases/model.base.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class RepositoryManager {
    private repositories: Map<string, any> = new Map();

    constructor() {}

    async initialize() {
        Logger.natural('------ [ Setting up Repositories ] ------');

        try {
            const dbConfig = DatabaseConfig.loadAll().filter((conf) => conf.enabled);
            const modelsPath = path.join(__dirname);

            for (const config of dbConfig) {
                const dbInstanceRepoPath = path.join(modelsPath, config.id);

                await fs.access(dbInstanceRepoPath);

                const repoNames = readdirSync(dbInstanceRepoPath, { withFileTypes: true })
                    .filter((dirent) => dirent.isFile() && !/^(index)/.test(dirent.name))
                    .map((dirent) => dirent.name);

                for (const repoName of repoNames) {
                    const repoPath = path.join(dbInstanceRepoPath, repoName);

                    // Importar dinámicamente
                    const repoUrl = pathToFileURL(repoPath);
                    let repoDefinition = await import(repoUrl.toString());
                    console.log(repoDefinition);

                    // FALLANDO
                    /*if (!repoDefinition.default || typeof repoDefinition.default !== 'function')
                        throw new Error(`Model ${repoName} does not export a valid class`);

                    console.log(repoPath, repoDefinition);*/

                    /*repoDefinition = repoDefinition.default;
                    const modelInstance = await repoDefinition.init(this.connector, this.config.id);

                    this.registerModel(modelInstance);*/
                }
            }
        } catch (error) {
            console.log(error);
        }

        Logger.natural(''.padEnd(41, '-'));
    }

    /**
     * Obtener un repositorio
     */
    get(dbName: string, repoName: string): BaseRepository<any, any> | undefined {
        const key = `${dbName}.${repoName}`;

        if (!this.repositories.has(key)) return undefined;

        return this.repositories.get(key);
    }

    /**
     * Listar todos los repositorios registrados
     */
    list(): Array<{ dbName: string; repoName: string }> {
        return Array.from(this.repositories.keys()).map((key) => {
            const [dbName, repoName] = key.split('.');

            return { dbName, repoName };
        });
    }
}

const Repository = new RepositoryManager();

export default Repository;
