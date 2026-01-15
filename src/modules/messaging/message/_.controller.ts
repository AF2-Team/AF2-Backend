import { ControllerBase } from '@bases/controller.base.js';
import MessageService from './_.service.js';
import { AuthError } from '@errors/auth.error.js';

class MessageController extends ControllerBase {
    async sendMessage() {
        const user = this.getUser<{ _id: string }>();
        const conversationId = this.requireParam('conversationId');
        const text = this.requireBodyField('text');

        const result = await MessageService.sendMessage(conversationId, user!._id, text);
        this.created(result, 'Message sent');
    }

    async getMessages() {
        const user = this.getUser<{ _id: string }>();
        const conversationId = this.requireParam('conversationId');
        const options = this.getQueryFilters();

        const result = await MessageService.getMessages(conversationId, user!._id, options);
        this.success(result);
    }

    async markMessagesAsRead() {
        const user = this.getUser<{ _id: string }>();
        const conversationId = this.requireParam('conversationId');
        await MessageService.markAsRead(conversationId, user._id);

        await MessageService.markAsRead(conversationId, user!._id);
        this.success({ read: true });
    }
}

export default new MessageController();
