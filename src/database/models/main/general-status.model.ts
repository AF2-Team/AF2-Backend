import { DataTypes } from 'sequelize';
import { SequelizeModelBase } from '@models/bases/sequelize.model.js';

export default class GeneralStatusModel extends SequelizeModelBase {
    static override definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            descripcion: {
                allowNull: false,
                type: DataTypes.STRING(100),
            },
        };
    }

    static override config() {
        return {
            schema: 'general',
            tableName: 'status',
        };
    }
}
