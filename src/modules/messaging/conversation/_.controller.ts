import { ControllerBase } from '@bases/controller.base.js';
import { Request, Response } from 'express';
import ConversationService from './_.service.js';

class ConversationController extends ControllerBase {
    async list(req: Request, res: Response) {
        const user = this.getUser<{ userId: string }>();
        const options = this.getQueryFilters();
        const result = await ConversationService.getUserConversations(user?.userId as string, options);

        this.success(result);
    }

    async get(req: Request, res: Response) {
        const { conversationId } = this.getParams();
        const result = await ConversationService.getConversation(conversationId);

        this.success(result);
    }

    async markRead(req: Request, res: Response) {
        const { conversationId } = this.getParams();
        const user = this.getUser<{ userId: string }>();
        const result = await ConversationService.markAsRead(conversationId, user?.userId as string);

        this.success(result);
    }

    async create(req: Request, res: Response) {
        const user = this.getUser<{ userId: string }>();
        const participantId = this.requireBodyField('participantId');
        const result = await ConversationService.createConversation(user.userId, participantId);

        this.created(result, 'Conversation created');
    }
}

export default new ConversationController();
