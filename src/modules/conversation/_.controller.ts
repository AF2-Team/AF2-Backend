import { ControllerBase } from '@bases/controller.base.js';
import { Request, Response } from 'express';
import ConversationService from './_.service.js';

class ConversationController extends ControllerBase {
    list = async (_req: Request, _res: Response) => {
        const user = this.getUser<{ userId: string }>();
        const options = this.getQueryFilters();

        const result = await ConversationService.getUserConversations(user?.userId as string, options);

        return this.success(result);
    };

    get = async (_req: Request, _res: Response) => {
        const { conversationId } = this.getParams();

        const result = await ConversationService.getConversation(conversationId);

        if (!result) {
            this.throwValidationError('Conversation not found');
        }

        return this.success(result);
    };

    markRead = async (_req: Request, _res: Response) => {
        const { conversationId } = this.getParams();
        const user = this.getUser<{ userId: string }>();

        const result = await ConversationService.markAsRead(conversationId, user?.userId as string);

        return this.success(result);
    };
}

export default new ConversationController();
