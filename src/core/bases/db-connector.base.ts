import { IDatabaseConfig, IDatabaseType } from '@rules/database.type.js';

export interface IDatabaseConnector {
    connect(): Promise<boolean>;
    disconnect(): Promise<void>;
    ping(): Promise<boolean>;
    authenticate(): Promise<boolean>;

    getModel<T = any>(modelName: string): T;
    hasModel(modelName: string): boolean;
    listModels(): string[];
    registerModel(name: string, instance: any): boolean;
    clearModels(): boolean;

    beforeConnect(): Promise<void> | void;
    afterConnect(): Promise<void> | void;
    beforeDisconnect(): Promise<void> | void;
    afterDisconnect(): Promise<void> | void;
}

export abstract class BaseDatabaseConnector implements IDatabaseConnector {
    protected readonly config: IDatabaseConfig;
    protected readonly models: Map<string, any> = new Map();
    protected connectionStatus: boolean = false;
    protected connector: any;

    constructor(config: IDatabaseConfig) {
        this.config = config;
    }

    abstract connect(): Promise<boolean>;
    abstract disconnect(): Promise<void>;
    abstract ping(): Promise<boolean>;

    isConnected(): boolean {
        return this.connectionStatus;
    }

    protected setStatus(status: boolean) {
        this.connectionStatus = status;
    }

    async authenticate(): Promise<boolean> {
        return this.ping();
    }

    getModel<T = any>(modelName: string): T {
        if (!this.models.has(modelName))
            throw new Error(`Model '${modelName}' not registered in DB '${this.config.name}'`);

        return this.models.get(modelName);
    }

    hasModel(modelName: string): boolean {
        return this.models.has(modelName);
    }

    listModels(): string[] {
        return Array.from(this.models.keys());
    }

    registerModel(name: string, instance: any): boolean {
        this.models.set(name, instance);

        return true;
    }

    getDatabaseType(): IDatabaseType {
        return this.config.type;
    }

    getDatabaseName(): string {
        return this.config.name;
    }

    clearModels(): boolean {
        this.models.clear();

        return true;
    }

    async beforeConnect(): Promise<void> {}

    async afterConnect(): Promise<void> {}

    async beforeDisconnect(): Promise<void> {}

    async afterDisconnect(): Promise<void> {}
}
