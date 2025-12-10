import mongoose, { Schema, HydratedDocument, Model } from 'mongoose';
import { BcryptUtil } from '@utils/bcrypt';

// Interfaces

export interface IUserCounters {
    followers: number;
    following: number;
}
export interface IUser {
    user_name: string;
    email: string;
    password_hash: string;
    bio: string;
    photo_profile: string;
    created_at: Date;
    updated_at: Date;
    counters: IUserCounters;

    // Métodos
    matchPassword(enteredPassword: string): Promise<boolean>;
}
export type UserDocument = HydratedDocument<IUser>;

// Schema de la entidad

const UserSchema = new Schema<IUser>(
    {
        user_name: {
            type: String,
            required: true,
            trim: true,
            minlength: [3, 'Username must be at least 3 characters'],
            maxlength: [30, 'Username cannot exceed 30 characters'],
        },
        email: {
            type: String,
            required: true,
            unique: true, // ya crea el índice único
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
        },
        password_hash: {
            type: String,
            required: true,
            minlength: [6, 'Password must be at least 6 characters'],
            select: false,
        },
        bio: {
            type: String,
            default: '',
            maxlength: [500, 'Bio cannot exceed 500 characters'],
        },
        photo_profile: {
            type: String,
            default: '',
        },
        counters: {
            followers: {
                type: Number,
                default: 0,
                min: 0,
            },
            following: {
                type: Number,
                default: 0,
                min: 0,
            },
        },
    },
    {
        collection: 'user',
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
    },
);

// Hooks

// Hash al crear/guardar
UserSchema.pre<UserDocument>('save', async function (next) {
    if (!this.isModified('password_hash')) return next();

    try {
        this.password_hash = await BcryptUtil.hash(this.password_hash);
        next();
    } catch (error) {
        next(error as mongoose.CallbackError);
    }
});
// Hash al actualizar usando update/findOneAndUpdate
UserSchema.pre('findOneAndUpdate', async function (next) {
    const update: any = this.getUpdate();

    if (update?.password_hash) {
        update.password_hash = await BcryptUtil.hash(update.password_hash);
        this.setUpdate(update);
    }

    next();
});

// Métodos

UserSchema.methods.matchPassword = async function (this: UserDocument, enteredPassword: string): Promise<boolean> {
    return BcryptUtil.compare(enteredPassword, this.password_hash);
};

// Índices

UserSchema.index({ user_name: 1 });
UserSchema.index({ 'counters.followers': -1 });
UserSchema.index({ created_at: -1 });

// Modelo

export const UserModel: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
export type UserModelType = typeof UserModel;
