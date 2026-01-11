import { Schema } from 'mongoose';
import { MongooseModelBase } from '@database/models/bases/mongoose.model.js';

export default class PostModel extends MongooseModelBase {
    static override get modelName(): string {
        return 'Post';
    }

    static override definition() {
        return {
            // CORRECCIÓN 1: Cambiado de 'user' a 'author' para coincidir con el populate
            author: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },

            type: {
                type: String,
                enum: ['post', 'repost'],
                default: 'post',
            },

            originalPost: {
                type: Schema.Types.ObjectId,
                ref: 'Post',
                default: null,
            },

            text: {
                type: String,
                trim: true,
                maxlength: 4000,
                default: '',
            },

            fontStyle: {
                type: String,
                enum: ['regular', 'bold', 'italic', 'mono'],
                default: 'regular',
            },
            
            media: [
                {
                    url: String,
                    fileId: String,
                }
            ], 

            tags: [
                {
                    type: String,
                    trim: true,
                    lowercase: true,
                },
            ],

            publishStatus: {
                type: String,
                enum: ['draft', 'published', 'archived'],
                default: 'published',
            },

            status: {
                type: Number,
                default: 1,
            },

            likesCount: { type: Number, default: 0 },
            commentsCount: { type: Number, default: 0 },
            repostsCount: { type: Number, default: 0 },
            favoritesCount: { type: Number, default: 0 },
        };
    }

    static override applyHooks(schema: Schema): void {
        schema.pre('validate', function (next) {
            const doc: any = this;

            if (doc.type === 'repost' && !doc.originalPost) {
                throw new Error('Repost requires originalPost');
            }

            if (doc.type !== 'repost') {
                doc.originalPost = null;
            }
            next(); // IMPORTANTE: Agregué next() para asegurar que el hook continúe
        });

        schema.post('save', async function (doc: any) {
            if (doc.type === 'repost' && doc.originalPost) { // Simplifiqué la condición isNew para mayor seguridad
                // Nota: Asegúrate de que updateOne funcione en tu contexto, a veces requiere el modelo explícito
                 await mongoose.model('Post').updateOne({ _id: doc.originalPost }, { $inc: { repostsCount: 1 } });
            }
        });
    }

    static override applyIndices(schema: Schema): void {
        // CORRECCIÓN 2: Actualizado el índice para usar 'author' en lugar de 'user'
        schema.index({ author: 1, createdAt: -1 });
        schema.index({ publishStatus: 1, createdAt: -1 });
        schema.index({ tags: 1 });
        schema.index({ originalPost: 1 });
        schema.index({ status: 1 });
        schema.index({ text: 'text' });
    }
}