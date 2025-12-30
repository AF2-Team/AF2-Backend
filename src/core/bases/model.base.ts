export abstract class BaseModel {
    protected instance: unknown;

    static get modelName(): string {
        return this.name;
    }

    static get supportedDatabases(): string[] {
        return [];
    }

    static definition(): Record<string, any> {
        throw new Error('definition() must be implemented');
    }

    static init(_dbInstance: unknown, _dbInstanceName: string): unknown {
        throw new Error('Must implement init');
    }
}
