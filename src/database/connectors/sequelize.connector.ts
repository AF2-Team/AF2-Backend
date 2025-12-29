import { Sequelize } from 'sequelize';
import { BaseDatabaseConnector } from '@bases/db-connector.base.js';
import { IDatabaseConfig } from '@rules/database.type.js';

export class SequelizeConnector extends BaseDatabaseConnector {
    protected declare connector: Sequelize;

    constructor(config: IDatabaseConfig) {
        super(config);
    }

    async connect(): Promise<boolean> {
        try {
            this.connector = new Sequelize(this.config.database!, this.config.username!, this.config.password!, {
                host: this.config.host,
                port: this.config.port,
                dialect: this.config.dialect as any,
                timezone: this.config.timezone,
                logging: this.config.logging,
                pool: this.config.pool,
            });

            // Ejecutar instrucciones pre-conexión
            await this.beforeConnect();

            // Probar conexión
            await this.ping();
            this.setStatus(true);

            // Ejecutar instrucciones post-conexión
            await this.afterConnect();

            return true;
        } catch (error: any) {}

        return false;
    }

    async afterConnect(): Promise<void> {
        /*for (const [name, modelFactory] of Object.entries(modelsToSetup)) {
            const model = modelFactory(this.sequelize);
            this.registerModel(name, model);
        }

        await this.sync(this.config.syncOptions);*/
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
        } catch {
            return false;
        }
    }
}
