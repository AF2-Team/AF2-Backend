import { ControllerBase } from '@bases/controller.base.js';
import GreetingsService from './_.service.js';
import { ProcessedQueryFilters } from '@rules/api-query.type.js';

class GreetingsController extends ControllerBase {
    async getRandomGreeting(req: Express.Request, res: Express.Response) {
        return GreetingsService.test(req.filters as ProcessedQueryFilters);
    }
}

export default new GreetingsController();
