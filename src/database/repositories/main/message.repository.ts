import MessageModel from '@database/models/main/message.model.js';
import { MongooseRepositoryBase } from '@database/repositories/bases/mongoose.repository.js';

class MessageRepository extends MongooseRepositoryBase<typeof MessageModel> {
    constructor() {
        super(MessageModel);
    }

    async getByConversation(conversationId: string, options: any = {}) {
        return this.getAll(
            {
                ...options,
                order: [['createdAt', 'desc']],
            },
            {
                conversation: conversationId,
                status: 1,
            },
        );
    }
}

export default new MessageRepository();
