import { ControllerBase } from '@bases/controller.base.js';
import { Request, Response } from 'express';
import MessageService from './_.service.js';

class MessageController extends ControllerBase {
    send = async (_req: Request, _res: Response) => {
        const user = this.getUser<{ userId: string }>();
        if (!user) this.throwValidationError('Unauthorized');

        const conversationId = this.requireParam('conversationId');
        const text = this.requireBodyField('text');

        const result = await MessageService.sendMessage(conversationId, user.userId, text);

        return this.created(result, 'Message sent');
    };

    list = async (_req: Request, _res: Response) => {
        const conversationId = this.requireParam('conversationId');
        const options = this.getQueryFilters();

        const result = await MessageService.getMessages(conversationId, options);
        return this.success(result);
    };

    markRead = async (_req: Request, _res: Response) => {
        const user = this.getUser<{ userId: string }>();
        if (!user) this.throwValidationError('Unauthorized');

        const conversationId = this.requireParam('conversationId');

        await MessageService.markAsRead(conversationId, user.userId);
        return this.success({ read: true });
    };
}

export default new MessageController();
