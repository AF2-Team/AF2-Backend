import { BaseService } from '@bases/service.base.js';
import MessageRepository from '@database/repositories/main/message.repository.js';
import ConversationRepository from '@database/repositories/main/conversation.repository.js';
import NotificationService from '@modules/social/notification/_.service.js';

class MessageService extends BaseService {
    async sendMessage(conversationId: string, senderId: string, text: string) {
        this.validateRequired({ conversationId, senderId, text }, ['conversationId', 'senderId', 'text']);

        const conversation = await ConversationRepository.getById(conversationId);
        if (!conversation || conversation.status !== 1) {
            throw new Error('Conversation not found');
        }

        if (!conversation.participants.includes(senderId)) {
            throw new Error('Unauthorized');
        }

        const message = await MessageRepository.create({
            conversation: conversationId,
            sender: senderId,
            text,
            readBy: [senderId],
            status: 1,
        } as any);

        await ConversationRepository.update(conversationId, {
            lastMessage: text,
            lastMessageAt: new Date(),
        } as any);

        for (const participantId of conversation.participants) {
            if (participantId === senderId) continue;

            await NotificationService.notify({
                user: participantId,
                actor: senderId,
                type: 'message',
                entityId: conversationId,
            });
        }

        return message;
    }

    async getMessages(conversationId: string, options: any) {
        this.validateRequired({ conversationId }, ['conversationId']);
        return MessageRepository.getByConversation(conversationId, options);
    }

    async markAsRead(conversationId: string, userId: string) {
        this.validateRequired({ conversationId, userId }, ['conversationId', 'userId']);

        await (MessageRepository as any).model.updateMany(
            {
                conversation: conversationId,
                readBy: { $ne: userId },
            },
            {
                $push: { readBy: userId },
            },
        );

        return true;
    }
}

export default new MessageService();
