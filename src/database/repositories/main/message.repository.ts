import MessageModel from '@database/models/main/message.model.js';
import { MongooseRepositoryBase } from '@database/repositories/bases/mongoose.repository.js';
import { ProcessedQueryFilters } from '@rules/api-query.type.js';

class MessageRepository extends MongooseRepositoryBase<any> {
    constructor() {
        super(MessageModel);
    }

    async getByConversation(conversationId: string, options: ProcessedQueryFilters) {
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
