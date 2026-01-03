import ConversationModel from '@database/models/main/conversation.model.js';
import MessageModel from '@database/models/main/message.model.js';
import { MongooseRepositoryBase } from '@database/repositories/bases/mongoose.repository.js';

class ConversationRepository extends MongooseRepositoryBase<any> {
    constructor() {
        super(ConversationModel);
    }

    async findByParticipants(userA: string, userB: string) {
        return this.getOne({
            participants: { $all: [userA, userB] },
        });
    }

    async countUnread(conversationId: string, userId: string): Promise<number> {
        return this.execute('countUnread', async () => {
            const msgModel: any = (MessageModel as any).instance ?? (MessageModel as any).model ?? MessageModel;

            return msgModel.countDocuments({
                conversation: conversationId,
                sender: { $ne: userId },
                readAt: null,
                status: 1,
            });
        });
    }
}

export default new ConversationRepository();
