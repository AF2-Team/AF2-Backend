import { CorsOptions } from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '..', '..', '.env') });

export interface IAppConfig {
    port: number;
    host: string;
    protocol: string;
    nodeEnv: string;
    apiBaseUrl: string;
    corsOptions: CorsOptions;
    enableCors: boolean;
    enableHelmet: boolean;
    enableMorgan: boolean;
    enableDatabase: boolean;
    databases: {
        enabled: string[]; // ['postgres', 'mongodb']
        default: string;
    };
    security: {
        jwtSecret: string;
        jwtExpiresIn: string;
        bcryptRounds: number;
    };
    limits: {
        requestSize: string;
        rateLimitWindow: number;
        rateLimitMax: number;
    };
}

export class AppConfig {
    private static _configCache: IAppConfig | null = null;

    static load(): IAppConfig {
        if (this._configCache) return this._configCache;

        const nodeEnv = process.env.NODE_ENV || 'development';
        const protocol = process.env.SECURE_PROTOCOL === 'true' ? 'https' : 'http';
        const host = process.env.DOMAIN || process.env.API_HOST || '127.0.0.1';
        const port = parseInt(process.env.PORT || '3000', 10);
        const apiBaseUrl = `${protocol}://${host}${port !== 80 && port !== 443 ? `:${port}` : ''}`;

        // Parsear bases de datos habilitadas
        const enabledDatabases = (process.env.ENABLED_DATABASES ?? '')
            .split(',')
            .map((db) => db.trim())
            .filter((db) => db);

        const config = {
            port,
            host,
            protocol,
            nodeEnv,
            apiBaseUrl,
            corsOptions: {
                methods: ['GET', 'PUT', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
                credentials: true,
                origin: process.env.CORS_ORIGIN?.split(',') || '*',
                allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
            },
            enableCors: process.env.ENABLE_CORS === 'true',
            enableHelmet: process.env.ENABLE_HELMET === 'true',
            enableMorgan: process.env.ENABLE_MORGAN === 'true',
            enableDatabase: process.env.ENABLE_DATABASE === 'true',
            databases: {
                enabled: enabledDatabases,
                default: process.env.DEFAULT_DATABASE || enabledDatabases[0],
            },
            security: {
                jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
                jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
                bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
            },
            limits: {
                requestSize: process.env.REQUEST_SIZE_LIMIT || '10mb',
                rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
                rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
            },
        };
        this._configCache = config;

        return config;
    }

    static isProduction(): boolean {
        return this.load().nodeEnv === 'production';
    }

    static isDevelopment(): boolean {
        return this.load().nodeEnv === 'development';
    }

    static getEnabledDatabases(): string[] {
        return this.load().databases.enabled;
    }

    static getDefaultDatabase(): string {
        return this.load().databases.default;
    }
}
