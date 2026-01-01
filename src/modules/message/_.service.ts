import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';

class MessageService extends BaseService {
    async sendMessage(data: any) {
        this.validateRequired(data, ['senderId', 'receiverId', 'text']);

        const conversationRepo = Database.repository('main', 'conversation');
        const messageRepo = Database.repository('main', 'message');

        let conversation = await conversationRepo.findByParticipants(data.senderId, data.receiverId);

        if (!conversation) {
            conversation = await conversationRepo.create({
                participants: [data.senderId, data.receiverId],
                lastMessage: data.text,
                lastMessageAt: new Date(),
                status: 1,
            });
        }

        const message = await messageRepo.create({
            conversation: conversation.id,
            sender: data.senderId,
            text: data.text,
            status: 1,
        });

        await conversationRepo.update(conversation.id, {
            lastMessage: data.text,
            lastMessageAt: new Date(),
        });

        return message;
    }

    async getMessages(conversationId: string, options: any) {
        const messageRepo = Database.repository('main', 'message');
        return messageRepo.getByConversation(conversationId, options);
    }
}

export default new MessageService();
