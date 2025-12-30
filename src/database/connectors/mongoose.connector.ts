import mongoose, { ConnectOptions } from 'mongoose';
import { BaseDatabaseConnector } from '@bases/db-connector.base.js';
import { IDatabaseConfig } from '@rules/database.type.js';
import { Logger } from '@utils/logger.js';
import { ANSI } from '@utils/ansi.util.js';

export class MongooseConnector extends BaseDatabaseConnector {
    constructor(config: IDatabaseConfig) {
        super(config);
    }
 
    async connect(): Promise<boolean> {
        try {
            await this.beforeConnect();

            const connectionString = this.config.uri || this.buildConnectionString();
            
            // Opciones recomendadas para Mongoose moderno
            const options: ConnectOptions = {
                maxPoolSize: this.config.pool?.max || 10,
                minPoolSize: this.config.pool?.min || 1,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                family: 4 // Usar IPv4 por defecto
            };

            // Configurar debug si está habilitado
            if (this.config.logging) {
                mongoose.set('debug', (collectionName, method, query, doc) => {
                    Logger.logDefinition(`${collectionName}.${method}`, JSON.stringify(query));
                });
            }

            await mongoose.connect(connectionString, options);
            this.connector = mongoose.connection;

            // Manejo de eventos de conexión
            mongoose.connection.on('error', (err) => {
                Logger.error(`[MongoDB] Error en conexión '${this.name}':`, err);
            });

            mongoose.connection.on('disconnected', () => {
                if (this.connectionStatus) {
                    Logger.warn(`[MongoDB] Desconectado de '${this.name}'`);
                    this.setStatus(false);
                }
            });

            await this.afterConnect();
            this.setStatus(true);
            return true;

        } catch (error: any) {
            Logger.error(`[MongoDB] Fallo al conectar a '${this.name}'`, error);
            return false;
        }
    }
    async afterConnect(): Promise<void> {
        // 1. Llama al padre (al método original que acabamos de corregir en el paso 1)
        await super.afterConnect();

        // 2. Carga los modelos
        await this.processModels();
    }

    async disconnect(): Promise<void> {
        await this.beforeDisconnect();
        await mongoose.disconnect();
        this.setStatus(false);
        this.clearModels();
        await this.afterDisconnect();
    }

    async ping(): Promise<boolean> {
        try {
            if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
                await mongoose.connection.db.admin().ping();
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }

    private buildConnectionString(): string {
        // Fallback si no se provee URI completa (útil para desarrollo local, no tanto para Atlas)
        const { host, port, database, username, password } = this.config;
        let auth = '';
        if (username && password) {
            auth = `${username}:${password}@`;
        }
        return `mongodb://${auth}${host}:${port}/${database}`;
    }
}