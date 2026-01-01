import UserModel from '@database/models/main/user.model.js';
import { MongooseRepositoryBase } from '@database/repositories/bases/mongoose.repository.js';

class UserRepository extends MongooseRepositoryBase {
    constructor() {
        super(UserModel);
    }
}

export default new UserRepository();