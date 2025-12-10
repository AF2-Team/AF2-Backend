import { UserModel, IUser, UserDocument } from '@models/user.model';
import { MongooseRepository } from '@repositories/mongoose.repository';

export class UserRepository extends MongooseRepository<IUser, UserDocument> {
    constructor() {
        super(UserModel, 'UserRepository');
    }

    async findByEmail(email: string): Promise<IUser | null> {
        return this.findOne({ email });
    }

    async findByEmailWithPassword(email: string): Promise<IUser | null> {
        return this.executeWithLogging('findByEmailWithPassword', async () => {
            const document = await UserModel.findOne({ email }).select('+password_hash').lean().exec();

            return document ?? null;
        });
    }
}
