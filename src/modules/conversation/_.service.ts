// src/modules/conversation/conversation.service.ts
import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ProcessedQueryFilters } from '@rules/api-query.type.js';

class ConversationService extends BaseService {
    async getUserConversations(userId: string, options: ProcessedQueryFilters) {
        this.validateRequired({ userId }, ['userId']);

        const conversationRepo = Database.repository('main', 'conversation');

        return conversationRepo.getAll(
            {
                ...options,
                order: [['lastMessageAt', 'desc']],
            },
            {
                participants: userId,
                status: 1,
            },
        );
    }

    async getConversation(conversationId: string) {
        this.validateRequired({ conversationId }, ['conversationId']);

        const conversationRepo = Database.repository('main', 'conversation');
        return conversationRepo.getById(conversationId);
    }

    async markAsRead(conversationId: string, userId: string) {
        this.validateRequired({ conversationId, userId }, ['conversationId', 'userId']);

        const conversationRepo = Database.repository('main', 'conversation');

        return conversationRepo.update(conversationId, {
            lastReadBy: userId,
        });
    }
}

export default new ConversationService();
