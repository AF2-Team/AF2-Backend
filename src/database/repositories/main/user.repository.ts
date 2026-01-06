import UserModel, { type User } from '@database/models/main/user.model.js';
import { MongooseRepositoryBase } from '@database/repositories/bases/mongoose.repository.js';

class UserRepository extends MongooseRepositoryBase<User> {
    constructor() {
        super({ instance: (UserModel as any).instance });
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.model.findOne({ email, status: 1 }).select('+password').exec();
    }
}

export default new UserRepository();
