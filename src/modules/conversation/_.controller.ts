import { ControllerBase } from '@bases/controller.base.js';
import { Request, Response } from 'express';
import ConversationService from './conversation.service.js';

class ConversationController extends ControllerBase {
    list = async (req: Request, res: Response) => {
        const userId = req.user?.id; // cuando haya auth
        const options = this.getQueryFilters(req);

        const result = await ConversationService.getUserConversations(userId, options);
        return this.success(res, result);
    };

    get = async (req: Request, res: Response) => {
        const { conversationId } = req.params;

        const result = await ConversationService.getConversation(conversationId);
        if (!result) return this.notFound(res, 'Conversation not found');

        return this.success(res, result);
    };

    markRead = async (req: Request, res: Response) => {
        const { conversationId } = req.params;
        const userId = req.user?.id;

        const result = await ConversationService.markAsRead(conversationId, userId);
        return this.success(res, result);
    };
}

export default new ConversationController();
