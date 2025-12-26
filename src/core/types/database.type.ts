/**
 * Tipos específicos para el sistema multi-database
 */

export type DatabaseType = 'postgresql' | 'mysql' | 'mongodb';
export type DatabaseDialect = 'postgres' | 'mysql' | 'sqlite' | 'mariadb';

export interface DatabaseConfig {
    type: DatabaseType;
    name: string; // Identificador único: 'main', 'analytics', 'cache'
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    uri?: string;
    dialect?: DatabaseDialect;
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
    nodeEnv: string;
}

export interface DatabaseInstance {
    name: string;
    type: DatabaseType;
    connector: any; // BaseDatabaseConnector
    config: DatabaseConfig;
    isConnected: boolean;
    models: Map<string, any>;
}

export interface DatabaseHealth {
    [databaseName: string]: {
        connected: boolean;
        type: string;
        lastPing: Date;
        models: number;
    };
}

export interface DatabaseStats {
    total: number;
    connected: number;
    byType: Record<DatabaseType, number>;
    databases: Record<
        string,
        {
            type: DatabaseType;
            connected: boolean;
            models: number;
        }
    >;
}

// Tipos para operaciones multi-database
export interface CrossDatabaseOperation<T = any> {
    database: string;
    success: boolean;
    data?: T;
    error?: string;
    duration?: number;
}
