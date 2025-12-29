export interface IBaseModel {
    modelName: string;
    supportedDatabases: string[];
    init(db: unknown): unknown;
    associate?(models: Record<string, unknown>): void;
}

export abstract class BaseModel {
    static get modelName(): string {
        return this.name;
    }

    static get supportedDatabases(): string[] {
        return [];
    }

    static definition(): Record<string, any> {
        throw new Error('definition() must be implemented');
    }

    static init(_dbInstance: unknown): unknown {
        throw new Error('Must implement init');
    }
}
