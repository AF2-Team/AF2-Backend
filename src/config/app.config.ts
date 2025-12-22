import { CorsOptions } from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '..', '..', '.env') });

export interface AppConfig {
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
    database: {
        type: 'mongodb' | 'postgres' | undefined;
        host?: string;
        port?: number;
        name?: string;
        username?: string;
        password?: string;
        uri?: string;
    };
}

export class Config {
    static load(): AppConfig {
        const nodeEnv = process.env.NODE_ENV || 'development';
        const protocol: string = Number(process.env.SECURE_PROTOCOL) || 0 ? 'https' : 'http';
        const host: string = process.env.DOMAIN || process.env.API_HOST || '127.0.0.1';
        const port: number = parseInt(process.env.PORT || '3000', 10);
        const apiBaseUrl: string = `${protocol ? `${protocol}://` : ''}${host}${port ? `:${port}` : ''}`;

        return {
            port,
            host,
            protocol,
            nodeEnv,
            apiBaseUrl,
            corsOptions: {
                methods: ['GET', 'PUT', 'POST', 'DELETE'],
                credentials: true,
                origin: process.env.CORS_ORIGIN || '*',
            },
            enableCors: process.env.ENABLE_CORS === 'true',
            enableHelmet: process.env.ENABLE_HELMET === 'true',
            enableMorgan: process.env.ENABLE_MORGAN === 'true',
            enableDatabase: process.env.ENABLE_DATABASE === 'true',
            database: {
                type: (process.env.DB_TYPE as 'mongodb' | 'postgres') || undefined,
                host: process.env.DB_HOST,
                port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
                name: process.env.DB_NAME,
                username: process.env.DB_USERNAME,
                password: process.env.DB_PASSWORD,
                uri: process.env.DB_URI,
            },
        };
    }

    static isProduction(): boolean {
        return this.load().nodeEnv === 'production';
    }

    static isDevelopment(): boolean {
        return this.load().nodeEnv === 'development';
    }
}
