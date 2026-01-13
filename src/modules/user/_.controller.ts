import { ControllerBase } from '@bases/controller.base.js';
import { Request, Response } from 'express';
import UserService from './_.service.js';
import { ValidationError } from '@errors';

class UserController extends ControllerBase {
    async getById() {
        const id = this.requireParam('id');
        const viewerId = (this.getRequest() as any).user?._id?.toString();

        const result = await UserService.getProfileById(id, viewerId);
        this.success(result);
    };

    async getByUsername() {
        const username = this.requireParam('username');
        const viewerId = (this.getRequest() as any).user?._id?.toString();

        const result = await UserService.getProfileByUsername(username, viewerId);

        this.success(result);
    };

    getMe = async (req: Request, _res: Response) => {
       
        const userId = (req as any).user._id.toString();
        
        if (!userId) throw new ValidationError('Invalidad session data');
        
        const result = await UserService.getProfileById(userId, userId);
        this.success(result);
    };

    updateMe = async (req: Request, _res: Response) => {
        const userId = (req as any).user._id.toString();

        const result = await UserService.updateProfile(userId, req.body);
        this.success(result, 'Profile updated');
    };

    deleteMe = async (req: Request, _res: Response) => {
        const userId = (req as any).user._id.toString();

        await UserService.deactivate(userId);
        this.success({ success: true }, 'Account deactivated');
    };

    following = async (req: Request, _res: Response) => {
        const { userId } = req.params;
        const options = this.getQueryFilters();

        const result = await UserService.getFollowing(userId, options);
        this.success(result);
    };

    followers = async (req: Request, _res: Response) => {
        const { userId } = req.params;
        const options = this.getQueryFilters();

        const result = await UserService.getFollowers(userId, options);
        this.success(result);
    };

    uploadAvatar = async (req: Request, _res: Response) => {
        const userId = (req as any).user._id.toString();

        if (!req.file) {
            throw new Error('Avatar file is required');
        }

        const result = await UserService.updateAvatar(userId, req.file);
        this.success(result, 'Avatar updated');
    };

    posts = async (req: Request, _res: Response) => {
        const { id } = req.params;
        const options = this.getQueryFilters();

        const result = await UserService.getUserPosts(id, options);
        this.success(result);
    };

    reposts = async (req: Request, _res: Response) => {
        const { id } = req.params;
        const options = this.getQueryFilters();

        const result = await UserService.getUserReposts(id, options);
        this.success(result);
    };

    favorites = async (req: Request, _res: Response) => {
        const { id } = req.params;
        const options = this.getQueryFilters();

        const result = await UserService.getUserFavorites(id, options);
        this.success(result);
    };
}

export default new UserController();
