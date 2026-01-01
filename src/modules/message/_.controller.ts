import { ControllerBase } from '@bases/controller.base.js';
import { Request, Response } from 'express';
import MessageService from './message.service.js';

class MessageController extends ControllerBase {
    send = async (req: Request, res: Response) => {
        const result = await MessageService.sendMessage(req.body);
        return this.created(res, result, 'Message sent');
    };

    list = async (req: Request, res: Response) => {
        const options = this.getQueryFilters(req);
        const result = await MessageService.getMessages(req.params.conversationId, options);
        return this.success(res, result);
    };
}

export default new MessageController();
