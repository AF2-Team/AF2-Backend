import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { ProcessedQueryFilters } from '@rules/api-query.type.js';

class GreetingsService extends BaseService {
    async test(filters: ProcessedQueryFilters) {
        const repo = Database.repository('main', 'auth-recursos');

        return repo.getAllActive(filters);
    }
}

export default new GreetingsService();
