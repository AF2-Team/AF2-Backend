import { ControllerBase } from '@bases/controller.base.js';
import { GreetingsService } from './_.service.js';

class GreetingsController extends ControllerBase {
    constructor() {
        super(GreetingsService);
    }

    async getRandomGreeting(req: Express.Request, res: Express.Response) {
        console.log('aaaaaaaaaaaaa');
    }

    async triggerError() {
        throw new Error('This is a test error');
    }

    async triggerAppError() {
        this.throwValidationError('This is a validation error for testing', { a: 21 });
    }
}

const _ = new GreetingsController();

export { _ as GreetingsController };
