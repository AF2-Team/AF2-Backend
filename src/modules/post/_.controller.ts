import { ControllerBase } from '@bases/controller.base.js';
import PostService from './_.service.js';

class PostController extends ControllerBase {
    // 1. Crear Post
    create = async () => {
        const body = this.getBody();
        const user = this.getUser<any>();
        const req = this.getRequest();

        if (!user) this.throwValidationError('User session not found');
        const userId = user._id || user.id;

        // Llamamos a 'createPost' del servicio pasando los archivos
        const result = await PostService.createPost(
            { ...body, user: String(userId) },
            req.files as any[], // Multer files
        );

        this.created(result, 'Post created');
    };

    // 2. Obtener Post por ID
    getById = async () => {
        const postId = this.requireParam('id');
        const result = await PostService.getPostById(postId); // Llama a getPostById
        if (!result) this.throwValidationError('Post not found');
        this.success(result);
    };

    // 3. Actualizar
    update = async () => {
        const postId = this.requireParam('id');
        const body = this.getBody();
        const user = this.getUser<{ _id: string }>();
        const result = await PostService.updatePost(postId, user._id, body);
        this.success(result, 'Post updated');
    };

    // 4. Eliminar
    delete = async () => {
        const postId = this.requireParam('id');
        const user = this.getUser<{ _id: string }>();
        await PostService.deletePost(postId, user._id);
        this.success({ id: postId }, 'Post deleted');
    };

    // 5. Subir Media Extra
    uploadMedia = async () => {
        const postId = this.requireParam('id');
        const user = this.getUser<{ _id: string }>();
        const req = this.getRequest();
        if (!req.file) this.throwValidationError('Media file required');
        const result = await PostService.addMedia(postId, user._id, req.file);
        this.success(result, 'Media uploaded');
    };

    // 6. Repostear
    repost = async () => {
        const user = this.getUser<{ _id: string }>();
        const postId = this.requireParam('id');
        const result = await PostService.createRepost(user._id, postId);
        this.created(result, 'Repost created');
    };

    // 7. Getters varios
    reposts = async () => {
        const postId = this.requireParam('id');
        const options = this.getQueryFilters();
        const result = await PostService.getReposts(postId, options);
        this.success(result);
    };

    likes = async () => {
        const postId = this.requireParam('id');
        this.success(await PostService.getLikes(postId, {}));
    };

    interactions = async () => {
        const postId = this.requireParam('id');
        this.success(await PostService.getInteractions(postId));
    };

    feed = async () => {
        const filters = this.getQueryFilters();
        const page = Number(filters.raw.page) || 1;
        const userId = this.getParams().userId || '';
        this.success(await PostService.getFeed(userId, page));
    };

    combinedFeed = async () => {
        const user = this.getUser<{ _id: string }>();
        const options = this.getQueryFilters();
        this.success(await PostService.getCombinedFeed(user._id, options));
    };

    byUser = async () => {
        const userId = this.requireParam('userId');
        const options = this.getQueryFilters();
        this.success(await PostService.getPostsByUser(userId, options));
    };

    byTag = async () => {
        const tag = this.requireParam('tag');
        const options = this.getQueryFilters();
        this.success(await PostService.getPostsByTag(tag, options));
    };

    tagInfo = async () => {
        const name = this.requireParam('name');
        const result = await PostService.getTagInfo(name);
        if (!result) this.throwValidationError('Tag not found');
        this.success(result);
    };

    trendingTags = async () => {
        const options = this.getQueryFilters();
        this.success(await PostService.getTrendingTags(options));
    };
}

export default new PostController();
