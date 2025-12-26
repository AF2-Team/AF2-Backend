import { BaseRepository } from '@bases/repository.base.js';
import { DatabaseManager } from '@database';

type RepositoryConstructor<T extends BaseRepository<any>> = new (connector: any) => T;

export class RepositoryManager {
    private static instance: RepositoryManager;
    private repositories: Map<string, BaseRepository<any>> = new Map();

    private constructor() {}

    static getInstance(): RepositoryManager {
        if (!RepositoryManager.instance) {
            RepositoryManager.instance = new RepositoryManager();
        }
        return RepositoryManager.instance;
    }

    getRepository<T extends BaseRepository<any>>(
        databaseName: string,
        repositoryKey: string,
        RepositoryClass: RepositoryConstructor<T>,
    ): T {
        const key = `${databaseName}:${repositoryKey}`;

        if (this.repositories.has(key)) {
            return this.repositories.get(key) as T;
        }

        const connector = DatabaseManager.getInstance().getConnector(databaseName);
        const repository = new RepositoryClass(connector);

        this.repositories.set(key, repository);
        return repository;
    }
}
