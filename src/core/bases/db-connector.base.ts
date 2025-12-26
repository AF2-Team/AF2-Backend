import { DatabaseConfig, DatabaseType } from '@rules/database.type.js';

/**
 * Interfaz que deben implementar todos los conectores
 */
export interface IDatabaseConnector {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    ping(): Promise<boolean>;
    sync(options?: any): Promise<void>;
    getModel<T = any>(modelName: string): T;
    getRepository<T = any>(modelName: string): any;
    authenticate(): Promise<boolean>;
    listModels(): string[];
    hasModel(modelName: string): boolean;
}

/**
 * Clase base abstracta para conectores de base de datos
 */
export abstract class BaseDatabaseConnector implements IDatabaseConnector {
    protected models: Map<string, any> = new Map();
    protected isConnected: boolean = false;
    protected config: DatabaseConfig;

    constructor(config: DatabaseConfig) {
        this.config = config;
    }

    // Métodos abstractos que deben implementar las clases hijas
    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract ping(): Promise<boolean>;
    abstract sync(options?: any): Promise<void>;
    abstract getModel<T = any>(modelName: string): T;
    abstract getRepository<T = any>(modelName: string): any;

    // Métodos comunes con implementación base
    async authenticate(): Promise<boolean> {
        try {
            const isAlive = await this.ping();
            if (isAlive) {
                console.log(`✅ ${this.config.type.toUpperCase()} '${this.config.name}' authenticated`);
                return true;
            }
            return false;
        } catch (error) {
            console.error(`❌ ${this.config.type.toUpperCase()} '${this.config.name}' authentication failed:`, error);
            return false;
        }
    }

    listModels(): string[] {
        return Array.from(this.models.keys());
    }

    hasModel(modelName: string): boolean {
        return this.models.has(modelName);
    }

    getModelCount(): number {
        return this.models.size;
    }

    isDatabaseConnected(): boolean {
        return this.isConnected;
    }

    getConfig(): DatabaseConfig {
        return { ...this.config };
    }

    getDatabaseType(): DatabaseType {
        return this.config.type;
    }

    getDatabaseName(): string {
        return this.config.name;
    }

    // Métodos protegidos para uso interno de las clases hijas
    protected registerModel(modelName: string, modelInstance: any): void {
        if (this.models.has(modelName)) {
            console.warn(`⚠️  Model '${modelName}' already registered, overwriting`);
        }
        this.models.set(modelName, modelInstance);
        console.log(`📦 Model '${modelName}' registered in ${this.config.type} '${this.config.name}'`);
    }

    protected clearModels(): void {
        this.models.clear();
    }

    protected setConnectedStatus(connected: boolean): void {
        this.isConnected = connected;
        const status = connected ? 'connected' : 'disconnected';
        console.log(`🔌 ${this.config.type.toUpperCase()} '${this.config.name}' ${status}`);
    }

    // Hook para limpieza antes de desconectar
    protected async beforeDisconnect(): Promise<void> {
        // Puede ser sobrescrito por clases hijas
    }

    // Hook para inicialización después de conectar
    protected async afterConnect(): Promise<void> {
        // Puede ser sobrescrito por clases hijas
    }
}
