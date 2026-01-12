import UserModel, { type User } from '@database/models/main/user.model.js';
import { MongooseRepositoryBase } from '@database/repositories/bases/mongoose.repository.js';

class UserRepository extends MongooseRepositoryBase<User> {
    constructor() {
        super({ instance: (UserModel as any).instance });
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.model.findOne({ email, status: 1 }).select('+password').exec();
    }


    async updateSocialCount(userId: string, type: 'followers' | 'following', amount: number) {
        const field = type === 'followers' ? 'followersCount' : 'followingCount';
        return this.model.updateOne({ _id: userId }, { $inc: { [field]: amount } }).exec();
    }

    async findAnything(id: string) {
    // Aquí sí tienes acceso a this.model
    return this.model.findById(id).select('+password').exec();
}
}

export default new UserRepository();
