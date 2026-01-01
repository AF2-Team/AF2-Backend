import ConversationModel from '@database/models/main/conversation.model.js';
import { MongooseRepositoryBase } from '@database/repositories/bases/mongoose.repository.js';
import MessageModel from '@database/models/main/message.model.js';

class ConversationRepository extends MongooseRepositoryBase<any> {
    constructor() {
        super(ConversationModel);
    }

    async findByParticipants(userA: string, userB: string) {
        return this.getOne({
            participants: { $all: [userA, userB] },
            status: 1,
        });
    }

    async countUnread(conversationId: string, userId: string): Promise<number> {
        return MessageModel.countDocuments({
            conversation: conversationId,
            sender: { $ne: userId },
            readAt: null,
            status: 1,
        });
    }
}

export default new ConversationRepository();
