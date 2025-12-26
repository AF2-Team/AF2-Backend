export interface IBaseModelDefinition {
    name: string;
}

export abstract class BaseModel {
    /**
     * Nombre lógico del modelo (User, Order, etc.)
     */
    static get modelName(): string {
        return this.name;
    }

    /**
     * Tipo de base de datos soportado por el modelo
     * Ej: ['postgresql'], ['mongodb'], ['postgresql','mongodb']
     */
    static get supportedDatabases(): string[] {
        return [];
    }

    /**
     * Inicializa el modelo según el tipo de conector
     */
    static init(_dbInstance: unknown): unknown {
        throw new Error('init() must be implemented');
    }

    /**
     * Relaciones (solo aplica a SQL)
     */
    static associate?(_models: Record<string, unknown>): void;
}
