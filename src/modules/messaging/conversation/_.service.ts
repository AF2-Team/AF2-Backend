import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { NotFoundError } from '@errors/not-found.error.js';
import { ProcessedQueryFilters } from '@rules/api-query.type.js';

class ConversationService extends BaseService {
    async getUserConversations(userId: string, options: ProcessedQueryFilters) {
        this.validateRequired({ userId }, ['userId']);

        const conversationRepo = Database.repository('main', 'conversation');
        const messageRepo = Database.repository('main', 'message') as any;

        const conversations = await conversationRepo.getAll(
            {
                ...options,
                order: [['lastMessageAt', 'desc']],
            },
            {
                participants: userId,
                status: 1,
            },
        );

        for (const convo of conversations) {
            const unread = await messageRepo.model.countDocuments({
                conversation: convo.id,
                sender: { $ne: userId },
                readBy: { $ne: userId },
                status: 1,
            });

            convo.unreadCount = unread;
        }

        return conversations;
    }

    async getConversation(conversationId: string) {
        this.validateRequired({ conversationId }, ['conversationId']);

        const conversationRepo = Database.repository('main', 'conversation');
        const conversation = await conversationRepo.getById(conversationId);

        if (!conversation) throw new NotFoundError('Conversation not found');

        return conversation;
    }

    async markAsRead(conversationId: string, userId: string) {
        this.validateRequired({ conversationId, userId }, ['conversationId', 'userId']);

        const conversationRepo = Database.repository('main', 'conversation');

        return conversationRepo.update(conversationId, {
            lastReadBy: userId,
        });
    }

    async createConversation(creatorId: string, participantId: string) {
        this.validateRequired({ creatorId, participantId }, ['creatorId', 'participantId']);

        if (creatorId === participantId) throw new Error('Cannot create conversation with yourself');

        const conversationRepo = Database.repository('main', 'conversation');

        // Buscar conversación existente entre ambos
        const existing = await conversationRepo.getOne({
            participants: { $all: [creatorId, participantId] },
            status: 1,
        });

        if (existing) return existing;

        return conversationRepo.create({
            participants: [creatorId, participantId],
            lastMessageAt: null,
            status: 1,
        });
    }
}

export default new ConversationService();
