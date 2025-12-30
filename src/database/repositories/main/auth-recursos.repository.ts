import AuthRecursosModel from '@database/models/main/auth-recursos.model.js';
import { SequelizeRepositoryBase } from '@repositories/bases/sequelize.repository.js';

class AuthRecursosRepository extends SequelizeRepositoryBase {
    constructor() {
        super(AuthRecursosModel);
    }
}

export default new AuthRecursosRepository();
