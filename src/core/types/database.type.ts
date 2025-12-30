export type IDatabaseDialect = 'postgres' | 'mysql' | 'sqlite' | 'mariadb';
export type IDatabaseType = 'postgresql' | 'mysql' | 'mongodb';

export interface IDatabaseConfig {
    type: IDatabaseType;
    id: string; // Identificador único: 'main', 'analytics', 'cache'
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    uri?: string;
    dialect?: IDatabaseDialect;
    timezone?: string;
    logging?: boolean;
    pool?: {
        max: number;
        min: number;
        acquire: number;
        idle: number;
    };
    syncOptions?: {
        force?: boolean;
        alter?: boolean;
    };
    enabled: boolean;
    isDefault: boolean;
}

export interface IDatabaseHealth {
    [databaseName: string]: {
        connected: boolean;
        type: string;
        lastPing: Date;
    };
}
