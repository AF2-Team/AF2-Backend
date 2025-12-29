import {
    Model,
    Sequelize,
    ModelStatic,
    ModelAttributes,
    InitOptions,
    HasOne,
    HasMany,
    BelongsTo,
    BelongsToMany,
} from 'sequelize';
import { BaseModel } from '@bases/model.base.js';

type ModelWithAssociate = ModelStatic<Model> & {
    associate?: (models: Record<string, ModelStatic<Model>>) => void;
};

type ModelWithAssociations = ModelStatic<Model> & {
    hasOne: (target: ModelStatic<Model>, options?: any) => HasOne;
    hasMany: (target: ModelStatic<Model>, options?: any) => HasMany;
    belongsTo: (target: ModelStatic<Model>, options?: any) => BelongsTo;
    belongsToMany: (target: ModelStatic<Model>, options?: any) => BelongsToMany;
};

export abstract class SequelizeModelBase extends BaseModel {
    static config(): Partial<InitOptions> {
        return {};
    }

    static relations(): Array<{
        type: 'hasOne' | 'hasMany' | 'belongsTo' | 'belongsToMany';
        target: string;
        options?: any;
    }> {
        return [];
    }

    static override init(dbInstance: Sequelize): ModelStatic<Model> {
        const model = dbInstance.define(
            this.modelName,
            this.definition() as ModelAttributes,
            this.config(),
        ) as ModelWithAssociate;

        if (this.relations().length > 0) {
            model.associate = (models: Record<string, ModelStatic<Model>>) => {
                this.associate(models);
            };
        }

        return model;
    }

    static associate(models: Record<string, ModelStatic<Model>>): void {
        const source = models[this.modelName] as ModelWithAssociations;

        if (!source) throw new Error(`Model ${this.modelName} not found in models registry`);

        this.relations().forEach((relation) => {
            const target = models[relation.target];

            if (!target) {
                throw new Error(`Target model ${relation.target} not found for relation from ${this.modelName}`);
            }

            switch (relation.type) {
                case 'hasOne':
                    source.hasOne(target, relation.options);
                    break;
                case 'hasMany':
                    source.hasMany(target, relation.options);
                    break;
                case 'belongsTo':
                    source.belongsTo(target, relation.options);
                    break;
                case 'belongsToMany':
                    source.belongsToMany(target, relation.options);
                    break;
                default:
                    throw new Error(`Unknown relation type: ${relation.type}`);
            }
        });
    }
}
