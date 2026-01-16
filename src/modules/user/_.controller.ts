import { ControllerBase } from '@bases/controller.base.js';
import UserService from './_.service.js';

class UserController extends ControllerBase {
    async getById() {
        const { id } = this.getParams();
        const viewerId = this.getUser<{ _id: string }>()?._id;
        const result = await UserService.getProfileById(id, viewerId);

        this.success(result);
    }

    async getByUsername() {
        const { username } = this.getParams();
        const viewerId = this.getUser<{ _id: string }>()?._id;
        const result = await UserService.getProfileByUsername(username, viewerId);

        this.success(result);
    }

    async updateUsername() {
        const user = this.getUser<{ _id: string }>();
        const { username } = this.getBody<{ username: string }>();

        const result = await UserService.updateUsername(user!._id, username);

        this.success(result, 'Username updated');
    }

    async getMe() {
        const user = this.getUser<{ _id: string }>();
        const result = await UserService.getProfileById(user!._id, user!._id);

        this.success(result);
    }

    async updateMe() {
        const user = this.getUser<{ _id: string }>();
        const body = this.getBody();
        const result = await UserService.updateProfile(user!._id, body);

        this.success(result, 'Profile updated');
    }

    async deleteMe() {
        const user = this.getUser<{ _id: string }>();
        await UserService.deactivate(user!._id);

        this.success({ success: true }, 'Account deactivated');
    }

    async following() {
        const user = this.getUser<{ _id: string }>();
        const options = this.getQueryFilters();
        const result = await UserService.getFollowing(user!._id, options);

        this.success(result);
    }

    async followers() {
        const user = this.getUser<{ _id: string }>();
        const options = this.getQueryFilters();
        const result = await UserService.getFollowers(user!._id, options);

        this.success(result);
    }

    async uploadAvatar() {
        const user = this.getUser<{ _id: string }>();
        const req = this.getRequest();
        const file = (req as any).file;

        const result = await UserService.updateAvatar(user!._id, file);

        this.success(result, 'Avatar updated');
    }

    async uploadCover() {
        const user = this.getUser<{ _id: string }>();
        const req = this.getRequest();
        const file = (req as any).file;

        const result = await UserService.updateCover(user!._id, file);

        this.success(result, 'Cover updated');
    }

    async posts() {
        const { id } = this.getParams();
        const options = this.getQueryFilters();
        const result = await UserService.getUserPosts(id, options);

        this.success(result);
    }

    async reposts() {
        const { id } = this.getParams();
        const options = this.getQueryFilters();
        const result = await UserService.getUserReposts(id, options);

        this.success(result);
    }

    async favorites() {
        const { id } = this.getParams();
        const options = this.getQueryFilters();
        const result = await UserService.getUserFavorites(id, options);

        this.success(result);
    }
}

export default new UserController();
