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
                } 
            },
            toObject: { virtuals: true }
        };
    }

    /**
     * Inicializa el modelo en la conexión de Mongoose
     */
    static override init(_dbInstance: any, _dbInstanceName: string): Model<any> {
        const schema = new Schema(this.definition(), this.schemaOptions());

        // Aquí podrías agregar hooks globales o índices si fuera necesario
        
        // Registrar el modelo en Mongoose. 
        // Nota: Mongoose maneja los modelos globalmente por conexión por defecto, 
        // pero esto asegura que usemos el nombre correcto.
        this.instance = mongoose.model(this.modelName, schema);

        return this.instance;
    }
}