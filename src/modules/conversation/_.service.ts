import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ProcessedQueryFilters } from '@rules/api-query.type.js';

class ConversationService extends BaseService {
    async getUserConversations(userId: string, options: ProcessedQueryFilters) {
        const conversationRepo = Database.repository('main', 'conversation');
        return await conversationRepo.getByUser(userId, options);
    }

    async getConversation(conversationId: string) {
        const conversationRepo = Database.repository('main', 'conversation');
        return await conversationRepo.getById(conversationId);
    }

    async markAsRead(conversationId: string, userId: string) {
        const conversationRepo = Database.repository('main', 'conversation');
      
        return await conversationRepo.update(conversationId, {
            lastReadBy: userId,
        });
    }
}

export default new ConversationService();
