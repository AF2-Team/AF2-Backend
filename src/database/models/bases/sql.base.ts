import { Model, Sequelize } from 'sequelize';
import { BaseModel } from '@bases/model.base.js';

export abstract class SqlModelBase extends BaseModel {
    static definition(): Record<string, any> {
        throw new Error('definition() must be implemented');
    }

    static config(): Record<string, any> {
        return {};
    }

    static relations(): Array<any> {
        return [];
    }

    static override init(dbInstance: Sequelize): Model {
        const model = dbInstance.define(this.modelName, this.definition(), this.config());

        if (this.relations().length) {
            (model as any).associate = this.associate!.bind(this);
        }

        return model;
    }

    static associate(models: Record<string, Model>): void {
        this.relations().forEach((relation) => {
            const source = models[this.modelName];
            const target = models[relation.target];

            source[relation.type](target, relation.options);
        });
    }
}
