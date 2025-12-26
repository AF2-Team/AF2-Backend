import { DatabaseConfig, DatabaseType } from '@rules/database.type.js';

const nodeEnv = process.env.NODE_ENV ?? 'development';

const ENABLED_DATABASES = (process.env.ENABLED_DATABASES ?? '')
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);

const DEFAULT_DATABASE = process.env.DEFAULT_DATABASE?.toLowerCase();

type EnvGroup = {
    type: DatabaseType;
    name: string;
    values: Record<string, string>;
};

function parseEnvGroups(): EnvGroup[] {
    const groups = new Map<string, EnvGroup>();

    for (const [key, value] of Object.entries(process.env)) {
        if (!value) continue;

        const match = key.match(/^([A-Z]+)(?:_([A-Z]+))?_(.+)$/);
        if (!match) continue;

        const [, rawType, rawName, rawProp] = match;
        const type = rawType.toLowerCase() as DatabaseType;

        if (!ENABLED_DATABASES.includes(type)) continue;

        const name = rawName ? rawName.toLowerCase() : type;
        const groupKey = `${type}:${name}`;

        if (!groups.has(groupKey)) {
            groups.set(groupKey, {
                type,
                name,
                values: {},
            });
        }

        groups.get(groupKey)!.values[rawProp.toLowerCase()] = value;
    }

    return Array.from(groups.values());
}

function buildConfig(group: EnvGroup): DatabaseConfig | null {
    const enabled = group.values.enabled !== 'false';
    if (!enabled) return null;

    return {
        type: group.type,
        name: group.name,
        enabled,
        isDefault: group.name === DEFAULT_DATABASE,
        nodeEnv,

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

export const databaseConfigs: DatabaseConfig[] = parseEnvGroups()
    .map(buildConfig)
    .filter((c): c is DatabaseConfig => Boolean(c));
