import { Sequelize } from 'sequelize';
import { BaseDatabaseConnector } from '@bases/db-connector.base.js';
import { IDatabaseConfig } from '@rules/database.type.js';
import { Logger } from '@utils/logger.js';

export class SequelizeConnector extends BaseDatabaseConnector {
    protected declare connector: Sequelize;

    constructor(config: IDatabaseConfig) {
        super(config);
    }

    async connect(): Promise<boolean> {
        try {
            // Ejecutar instrucciones pre-conexión
            await this.beforeConnect();

            this.connector = new Sequelize(this.config.database!, this.config.username!, this.config.password!, {
                host: this.config.host,
                port: this.config.port,
                dialect: this.config.dialect as any,
                timezone: this.config.timezone,
                logging: this.config.logging ? (message: string) => Logger.logDefinition(message, 'SQL') : console.log,
                pool: this.config.pool,
                define: {
                    underscored: true, // Usar snake_case en la BD
                    freezeTableName: true,
                    timestamps: false,
                },
            });

            // Ejecutar instrucciones post-conexión
            await this.afterConnect();

            this.setStatus(true);

            return true;
        } catch (error) {
            //throw error;
        }

        return false;
    }

    async afterConnect(): Promise<void> {
        await super.afterConnect();

        await this.processModels();
    }

    async disconnect(): Promise<void> {
        await this.beforeDisconnect();

        await this.connector.close();

        this.setStatus(false);
        this.clearModels();

        await this.afterDisconnect();
    }

    async ping(): Promise<boolean> {
        try {
            await this.connector.authenticate();

            return true;
        } catch (error) {
            //throw error;
        }

        return false;
    }
}
