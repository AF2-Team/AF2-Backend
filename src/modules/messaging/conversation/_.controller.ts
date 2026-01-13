import { ControllerBase } from '@bases/controller.base.js';
import ConversationService from './_.service.js';
import { AuthError, NotFoundError } from '@errors';

class ConversationController extends ControllerBase {
    async getMyConversations() {
        const user = this.getUser<{ _id: string }>();
        if (!user) throw new AuthError('Unauthorized');

        const options = this.getQueryFilters();
        const result = await ConversationService.getUserConversations(user._id, options);

        this.success(result);
    }

    async getConversation() {
        const { conversationId } = this.getParams();
        const result = await ConversationService.getConversation(conversationId);

        if (!result) throw new NotFoundError('Conversation', conversationId);
        this.success(result);
    }

    async markConversationAsRead() {
        const user = this.getUser<{ _id: string }>();
        if (!user) throw new AuthError('Unauthorized');

        const { conversationId } = this.getParams();
        const result = await ConversationService.markAsRead(conversationId, user._id);

        this.success(result);
    }

    async createConversation() {
        const user = this.getUser<{ _id: string }>();
        if (!user) throw new AuthError('Unauthorized');

        const participantId = this.requireBodyField('participantId');
        const result = await ConversationService.createConversation(user._id, participantId);

        this.created(result, 'Conversation created');
    }
}

export default new ConversationController();
