import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ValidationError, NotFoundError } from '@errors';
import NotificationService from '@modules/social/notification/_.service.js';

class MessageService extends BaseService {
    private getMessageRepo() {
        return Database.repository('main', 'message');
    }

    private getConversationRepo() {
        return Database.repository('main', 'conversation');
    }

    async sendMessage(conversationId: string, senderId: string, text: string) {
        this.validateRequired({ conversationId, senderId, text }, ['conversationId', 'senderId', 'text']);

        const conversationRepo = this.getConversationRepo();
        const conversation = await conversationRepo.getById(conversationId);

        if (!conversation || conversation.status !== 1) {
            throw new NotFoundError('Conversation', conversationId);
        }

        if (!conversation.participants.includes(senderId)) {
            throw new ValidationError('Unauthorized to send message to this conversation');
        }

        const messageRepo = this.getMessageRepo();

        const message = await messageRepo.create({
            conversation: conversationId,
            sender: senderId,
            text: text.trim(),
            readBy: [senderId],
            status: 1,
        });

        await conversationRepo.update(conversationId, {
            lastMessage: text.trim(),
            lastMessageAt: new Date(),
        });

        for (const participantId of conversation.participants) {
            await NotificationService.notify({
                user: participantId,
                actor: senderId,
                type: 'message',
                entityId: conversationId,
            });
        }

        return message;
    }

    async getMessages(conversationId: string, userId: string, options: any) {
        this.validateRequired({ conversationId, userId }, ['conversationId', 'userId']);

        const conversationRepo = this.getConversationRepo();
        const conversation = await conversationRepo.getById(conversationId);

        if (!conversation || conversation.status !== 1) {
            throw new NotFoundError('Conversation', conversationId);
        }

        if (!conversation.participants.includes(userId)) {
            throw new ValidationError('Unauthorized to view messages in this conversation');
        }

        const messageRepo = this.getMessageRepo();
        return messageRepo.getAllActive(options, {
            conversation: conversationId,
            status: 1,
        });
    }

    async markAsRead(conversationId: string, userId: string) {
        this.validateRequired({ conversationId, userId }, ['conversationId', 'userId']);

        const conversationRepo = this.getConversationRepo();
        const conversation = await conversationRepo.getById(conversationId);

        if (!conversation || conversation.status !== 1) {
            throw new NotFoundError('Conversation', conversationId);
        }

        if (!conversation.participants.includes(userId)) {
            throw new ValidationError('Unauthorized to mark messages as read in this conversation');
        }

        const messageRepo = this.getMessageRepo();

        const unreadMessages = await messageRepo.getAllActive(
            {},
            {
                conversation: conversationId,
                sender: { $ne: userId },
                readBy: { $ne: userId },
                status: 1,
            },
        );

        for (const message of unreadMessages) {
            await messageRepo.update(message._id.toString(), {
                $push: { readBy: userId },
            });
        }

        await conversationRepo.update(conversationId, {
            lastReadBy: userId,
            lastReadAt: new Date(),
        });

        return true;
    }
}

export default new MessageService();
