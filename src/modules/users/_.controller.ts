import { ControllerBase } from '@bases/controller.base.js';
import UserService from './_.service.js';
import { Request, Response } from 'express';

class UserController extends ControllerBase {
    
    async create(req: Request, res: Response) {
        const data = req.body;
        const result = await UserService.createUser(data);
        
        // Usamos los métodos helper de tu ControllerBase
        this.created(result, 'User created successfully');
    }

    async list(req: Request, res: Response) {
        const result = await UserService.getAllUsers();
        this.success(result);
    }
}

export default new UserController();