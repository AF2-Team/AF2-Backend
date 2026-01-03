import UserModel, { User } from '@database/models/main/user.model.js';
import { MongooseRepositoryBase } from '@database/repositories/bases/mongoose.repository.js';

class UserRepository extends MongooseRepositoryBase<User> {
    constructor() {
        super(UserModel);
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.getOne({ email, status: 1 });
    }
}

export default new UserRepository();
