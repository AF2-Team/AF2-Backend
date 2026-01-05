import { BaseService } from '@bases/service.base.js';
import ConversationRepository from '@database/repositories/main/conversation.repository.js';
import MessageRepository from '@database/repositories/main/message.repository.js';

class MessageService extends BaseService {
    async sendMessage(data: any) {
        this.validateRequired(data, ['senderId', 'receiverId', 'text']);

        const senderId = String(data.senderId);
        const receiverId = String(data.receiverId);
        const text = String(data.text);

        let conversation = await ConversationRepository.findByParticipants(senderId, receiverId);

        if (!conversation) {
            conversation = await ConversationRepository.create({
                participants: [senderId, receiverId],
                lastMessage: text,
                lastMessageAt: new Date(),
                status: 1,
            } as any);
        }

        const conversationId = (conversation as any).id ?? (conversation as any)._id;

        const message = await MessageRepository.create({
            conversation: conversationId,
            sender: senderId,
            text,
            status: 1,
        } as any);

        await ConversationRepository.update(conversationId, {
            lastMessage: text,
            lastMessageAt: new Date(),
        } as any);

        return message;
    }

    async getMessages(conversationId: string, options: any) {
        return MessageRepository.getByConversation(conversationId, options);
    }
}

export default new MessageService();
