import { IDatabaseConfig, IDatabaseType } from '@rules/database.type.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '..', '..', '.env') });

type EnvGroup = {
    type: IDatabaseType;
    name: string;
    values: Record<string, string>;
};

export class DatabaseConfig {
    private static _configCache: IDatabaseConfig[] | null = null;
    private static _defaultConfig: IDatabaseConfig | null = null;
    private static _enabledDatabases: string[] = [];
    private static _nodeEnv: string = process.env.NODE_ENV ?? 'development';

    /**
     * Carga todas las configuraciones de base de datos desde las variables de entorno
     */
    static loadAll(): IDatabaseConfig[] {
        if (this._configCache) return this._configCache;

        const enabledDatabases = this.getEnabledDatabases();
        const defaultDatabase = this.getDefaultDatabaseName();

        const configs = this.parseEnvGroups()
            .map((group) => this.buildConfig(group, enabledDatabases, defaultDatabase))
            .filter((c): c is IDatabaseConfig => Boolean(c));

        this._configCache = configs;
        return configs;
    }

    /**
     * Carga la configuración de la base de datos por defecto
     */
    static loadDefault(): IDatabaseConfig | null {
        if (this._defaultConfig) return this._defaultConfig;

        const allConfigs = this.loadAll();
        this._defaultConfig = allConfigs.find((config) => config.isDefault) || allConfigs[0] || null;

        return this._defaultConfig;
    }

    /**
     * Carga la configuración de una base de datos específica por nombre
     */
    static load(name: string): IDatabaseConfig | null {
        const allConfigs = this.loadAll();
        return allConfigs.find((config) => config.name === name) || null;
    }

    /**
     * Obtiene los tipos de bases de datos habilitadas
     */
    static getEnabledDatabases(): string[] {
        if (this._enabledDatabases.length > 0) return this._enabledDatabases;

        this._enabledDatabases = (process.env.ENABLED_DATABASES ?? '')
            .split(',')
            .map((v) => v.trim().toLowerCase())
            .filter(Boolean);

        return this._enabledDatabases;
    }

    /**
     * Obtiene el nombre de la base de datos por defecto
     */
    static getDefaultDatabaseName(): string {
        return process.env.DEFAULT_DATABASE?.toLowerCase() || '';
    }

    /**
     * Verifica si una base de datos está habilitada
     */
    static isDatabaseEnabled(dbType: string): boolean {
        return this.getEnabledDatabases().includes(dbType.toLowerCase());
    }

    /**
     * Limpia la caché de configuraciones (útil para testing)
     */
    static clearCache(): void {
        this._configCache = null;
        this._defaultConfig = null;
        this._enabledDatabases = [];
    }

    private static parseEnvGroups(): EnvGroup[] {
        const groups = new Map<string, EnvGroup>();

        for (const [key, value] of Object.entries(process.env)) {
            if (!value) continue;

            const match = key.match(/^DB_(?<type>[A-Z]+)(?:_(?<name>[A-Z]+))?_(?<prop>.+)$/);
            if (!match) continue;

            const { type, name, prop } = match.groups!;

            if (!type || !prop || !prop) continue;

            const _type = type.toLowerCase() as IDatabaseType;

            const _name = name ? name.toLowerCase() : _type;
            const groupKey = `${_type}:${_name}`;

            if (!groups.has(groupKey)) {
                groups.set(groupKey, {
                    type: _type,
                    name: _name,
                    values: {},
                });
            }

            groups.get(groupKey)!.values[prop.toLowerCase()] = value;
        }

        return Array.from(groups.values());
    }

    private static buildConfig(
        group: EnvGroup,
        enabledDatabases: string[],
        defaultDatabase: string,
    ): IDatabaseConfig | null {
        // Verificar si el tipo está habilitado
        if (!enabledDatabases.includes(group.type)) return null;

        const enabled = group.values.enabled !== 'false';
        if (!enabled) return null;

        return {
            type: group.type,
            name: group.name,
            enabled,
            isDefault: group.name === defaultDatabase || (defaultDatabase === '' && group.type === group.name),
            host: group.values.host,
            port: group.values.port ? Number(group.values.port) : undefined,
            database: group.values.name,
            username: group.values.username,
            password: group.values.password,
            uri: group.values.uri,

            dialect: group.values.dialect as any,
            timezone: group.values.timezone,
            logging: group.values.logging === 'true',

            pool: group.values.pool_max
                ? {
                      max: Number(group.values.pool_max),
                      min: Number(group.values.pool_min ?? 0),
                      acquire: Number(group.values.pool_acquire ?? 30000),
                      idle: Number(group.values.pool_idle ?? 10000),
                  }
                : undefined,

            syncOptions: {
                force: group.values.sync_force === 'true',
                alter: group.values.sync_alter === 'true',
            },
        };
    }
}
