import { Schema } from 'mongoose';
import { MongooseModelBase } from '@database/models/bases/mongoose.model.js';

export default class PostModel extends MongooseModelBase {
    static override get modelName(): string {
        return 'Post';
    }

    static override definition() {
        return {
            user: {
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
        });

        schema.post('save', async function (doc: any) {
            if (doc.type === 'repost' && doc.originalPost && doc.isNew) {
                await doc.constructor.updateOne({ _id: doc.originalPost }, { $inc: { repostsCount: 1 } });
            }
        });
    }

    static override applyIndices(schema: Schema): void {
        schema.index({ user: 1, createdAt: -1 });
        schema.index({ publishStatus: 1, createdAt: -1 });
        schema.index({ tags: 1 });
        schema.index({ originalPost: 1 });
        schema.index({ status: 1 });
        schema.index({ text: 'text' });
    }
}
