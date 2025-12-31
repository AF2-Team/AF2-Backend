import mongoose, { Schema, Model, SchemaDefinition, SchemaOptions } from 'mongoose';
import { BaseModel } from '@bases/model.base.js';

export abstract class MongooseModelBase extends BaseModel {
    static instance: Model<any>;

    /**
     * Define la estructura del Schema de Mongoose
     */
    static definition(): SchemaDefinition {
        throw new Error('definition() must be implemented');
    }
    /**
     * Define los índices del esquema
     */
    static applyIndices(schema: Schema): void {}

    /**
     * Define los hooks (middleware) del esquema
     */
    static applyHooks(schema: Schema): void {}

    /**
     * Opciones adicionales del Schema (timestamps, collection name, etc)
     */
    static schemaOptions(): SchemaOptions {
        return {
            timestamps: true,
            versionKey: false,
            toJSON: {
                virtuals: true,
                transform: (_: any, ret: any) => {
                    ret.id = ret._id;
                    delete ret._id;
                    delete ret.__v;
                    return ret;
                },
            },
            toObject: { virtuals: true },
        };
    }

    /**
     * Inicializa el modelo en la conexión de Mongoose
     */
    static override init(_dbInstance: any, _dbInstanceName: string): Model<any> {
        const schema = new Schema(this.definition(), this.schemaOptions());

        // Inyectamos la lógica personalizada antes de compilar el modelo
        this.applyIndices(schema);
        this.applyHooks(schema);

        this.instance = mongoose.model(this.modelName, schema);

        return this.instance;
    }
}
