import { MongooseModelBase } from '@database/models/bases/mongoose.model.js';

export default class UserModel extends MongooseModelBase {
    static override get modelName() {
        return 'User';
    }

    static definition() {
        return {
            name: { type: String, required: true },
            email: { type: String, required: true, unique: true },
            age: { type: Number, default: 18 }
        };
    }
}