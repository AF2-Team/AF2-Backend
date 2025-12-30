import { DataTypes } from 'sequelize';
import { SequelizeModelBase } from '@models/bases/sequelize.model.js';

export default class AuthRecursosModel extends SequelizeModelBase {
    static override definition() {
        return {
            id: {
                primaryKey: true,
                allowNull: true,
                type: DataTypes.INTEGER,
                autoIncrement: true,
            },
            codigo: {
                allowNull: false,
                type: DataTypes.STRING(100),
            },
            descripcion: {
                allowNull: true,
                type: DataTypes.STRING(200),
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER,
                defaultValue: '1',
            },
        };
    }

    static override config() {
        return {
            schema: 'auth',
            tableName: 'recursos',
        };
    }

    static override relations(): Array<{
        type: 'hasOne' | 'hasMany' | 'belongsTo' | 'belongsToMany';
        target: string;
        options?: any;
        inversed?: boolean;
    }> {
        return [
            {
                type: 'belongsTo',
                target: 'GenStatus',
                options: {
                    foreignKey: 'status',
                    targetKey: 'id',
                    as: '_Status',
                },
            },
            {
                inversed: true,
                type: 'hasMany',
                target: 'GenStatus',
                options: {
                    foreignKey: 'status',
                    targetKey: 'id',
                    as: '_Recursos',
                },
            },
        ];
    }
}
