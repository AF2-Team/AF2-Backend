import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';

class UserService extends BaseService {
    async createUser(data: any) {
        // 1. Validamos datos básicos (opcional pero recomendado)
        this.validateRequired(data, ['name', 'email']);

        // 2. Obtenemos el repositorio
        // 'main' es el ID de tu DB, 'user' es el nombre del repositorio (nombre de archivo sin .repository)
        const userRepo = Database.repository('main', 'user');

        // 3. Insertamos
        return await userRepo.create(data);
    }
    
    async getAllUsers() {
        const userRepo = Database.repository('main', 'user');
        // Usamos options vacíos por ahora
        return await userRepo.getAll({ pagination: { offset: 0, limit: 100 }, order: [], qc: {} });
    }
}

export default new UserService();