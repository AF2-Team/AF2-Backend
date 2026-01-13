import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ProcessedQueryFilters } from '@rules/api-query.type.js';
import { ValidationError, NotFoundError } from '@errors';

class ConversationService extends BaseService {
    private getConversationRepo() {
        return Database.repository('main', 'conversation');
    }

    private getMessageRepo() {
        return Database.repository('main', 'message');
    }

    private getUserRepo() {
        return Database.repository('main', 'user');
    }

    async getUserConversations(userId: string, options: ProcessedQueryFilters) {
        this.validateRequired({ userId }, ['userId']);

        const conversationRepo = this.getConversationRepo();

        return conversationRepo.getAllActive(
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

        const conversationRepo = this.getConversationRepo();
        const conversation = await conversationRepo.getById(conversationId);

        if (!conversation || conversation.status !== 1) {
            throw new NotFoundError('Conversation', conversationId);
        }

        return conversation;
    }

    async markAsRead(conversationId: string, userId: string) {
        this.validateRequired({ conversationId, userId }, ['conversationId', 'userId']);

        const conversationRepo = this.getConversationRepo();

        const conversation = await conversationRepo.getById(conversationId);
        if (!conversation || conversation.status !== 1) {
            throw new NotFoundError('Conversation', conversationId);
        }

        return conversationRepo.update(conversationId, {
            lastReadBy: userId,
            lastReadAt: new Date(),
        });
    }

    async createConversation(creatorId: string, participantId: string) {
        this.validateRequired({ creatorId, participantId }, ['creatorId', 'participantId']);

        if (creatorId === participantId) {
            throw new ValidationError('Cannot create conversation with yourself');
        }

        const conversationRepo = this.getConversationRepo();

        const existing = await conversationRepo.getOne({
            participants: { $all: [creatorId, participantId] },
            status: 1,
        });

        if (existing) {
            return existing;
        }

        return conversationRepo.create({
            participants: [creatorId, participantId],
            lastMessageAt: null,
            lastReadBy: null,
            lastReadAt: null,
            status: 1,
        });
    }
}

export default new ConversationService();
