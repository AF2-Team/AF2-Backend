import { ControllerBase } from '@bases/controller.base.js';
import { Request, Response } from 'express';
import UserService from './_.service.js';
import UserRepository from '@repositories/main/user.repository.js'; // Importante para getMe
import { ValidationError, NotFoundError } from '@errors';

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

    // --- CORREGIDO PARA EVITAR EL CRASH DE KOTLIN ---
    getMe = async (req: Request, _res: Response) => {
        const tokenUser = (req as any).user;
        if (!tokenUser) throw new ValidationError('Invalid session');

        const userId = tokenUser._id || tokenUser.userId || tokenUser.id;

        // 1. Llamamos al servicio para obtener contadores y datos
        const profile = await UserService.getProfileById(userId.toString(), userId.toString());

        if (!profile) throw new NotFoundError('User profile not found');

        const userPlain = profile.user.toObject ? profile.user.toObject() : profile.user;
        const flatResponse = {
            ...userPlain, // _id, name, username, email, avatarUrl, bio
            postsCount: profile.stats.posts,
            followersCount: profile.stats.followers,
            followingCount: profile.stats.following
        };

        this.success(flatResponse);
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