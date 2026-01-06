import { Schema } from 'mongoose';
import { MongooseModelBase } from '@database/models/bases/mongoose.model.js';

export type User = {
    _id?: any;
    id?: string;

    name: string;
    username: string;
    email: string;
    password: string;

    avatarUrl?: string | null;
    bio?: string | null;

    resetPasswordToken?: string | null;
    resetPasswordExpires?: Date | null;

    status: number;
};

export default class UserModel extends MongooseModelBase {
    static override get modelName(): string {
        return 'User';
    }

    static override definition() {
        return {
            name: {
                type: String,
                required: true,
                trim: true,
                maxlength: 120,
            },

            username: {
                type: String,
                required: true,
                trim: true,
                lowercase: true,
                minlength: 3,
                maxlength: 30,
            },

            email: {
                type: String,
                required: true,
                lowercase: true,
                trim: true,
            },

            password: {
                type: String,
                required: true,
                select: false,
            },

            avatarUrl: {
                type: String,
                trim: true,
                default: null,
            },

            resetPasswordToken: {
                type: String,
                default: null,
            },

            resetPasswordExpires: {
                type: Date,
                default: null,
            },

            bio: {
                type: String,
                trim: true,
                maxlength: 300,
                default: null,
            },

            status: {
                type: Number,
                default: 1,
            },
        };
    }

    static override applyIndices(schema: Schema): void {
        schema.index({ email: 1 }, { unique: true });
        schema.index({ username: 1 }, { unique: true });
        schema.index({ name: 1 });
        schema.index({ status: 1 });
    }
}
