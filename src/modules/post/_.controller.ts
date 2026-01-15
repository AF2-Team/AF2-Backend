import { ControllerBase } from '@bases/controller.base.js';
import PostService from './_.service.js';
import FeedService from '@modules/feed/_.service.js';
import InteractionService from '@modules/social/interaction/_.service.js';
class PostController extends ControllerBase {
    async createPost() {
        const user = this.getUser<{ _id: string }>();

        const body = this.getBody();
        const req = this.getRequest();
        const files = (req as any).files || [];

        const result = await PostService.createPost(
            {
                ...body,
                user: user!._id,
            },
            files,
        );

        this.created(result, 'Post created');
    }

    async getPost() {
        const postId = this.requireParam('id');
        const result = await PostService.getPostById(postId);

        this.success(result);
    }
    getFeed = async () => {
        const user = this.getUser<{ _id: string } | null>();
        // Simulamos las opciones para reutilizar el servicio existente
        const options = { pagination: { limit: 20 }, raw: this.getQuery() };
        
        // Llamamos al servicio de Feed existente
        const result = await FeedService.getFeed(user?._id, options as any);
        
        this.success(result);
    };
    updatePost = async () => {
        const user = this.getUser<{ _id: string }>();
        const postId = this.requireParam('id');
        const body = this.getBody();

        // Llamamos a tu servicio
        const result = await PostService.updatePost(postId, user._id, body);
        this.success(result, 'Post updated');
    };

    /**
     * DELETE /api/v1/post/:id
     */
    deletePost = async () => {
        const user = this.getUser<{ _id: string }>();
        const postId = this.requireParam('id');
        
        // Llamamos a tu servicio
        await PostService.deletePost(postId, user._id);
        
        this.success({ id: postId }, 'Post deleted');
    };

    async uploadPostMedia() {
        const user = this.getUser<{ _id: string }>();

        const postId = this.requireParam('id');
        const req = this.getRequest();
        const file = (req as any).file;

        if (!file) throw new Error('Media file required');

        const result = await PostService.addMedia(postId, user!._id, file);
        this.success(result, 'Media uploaded');
    }

    async createRepost() {
        const user = this.getUser<{ _id: string }>();

        const postId = this.requireParam('id');
        const result = await PostService.createRepost(user!._id, postId);

        this.created(result, 'Repost created');
    }

    async getPostReposts() {
        const postId = this.requireParam('id');
        const options = this.getQueryFilters();

        const result = await PostService.getReposts(postId, options);
        this.success(result);
    }

    async getPostInteractions() {
        const postId = this.requireParam('id');

        const result = await PostService.getInteractions(postId);
        this.success(result);
    }

    async getPostsByUser() {
        const userId = this.requireParam('userId');
        const options = this.getQueryFilters();

        const result = await PostService.getPostsByUser(userId, options);
        this.success(result);
    }

    async getPostsByTag() {
        const tag = this.requireParam('tag');
        const options = this.getQueryFilters();

        const result = await PostService.getPostsByTag(tag, options);
        this.success(result);
    }

    async getTagInfo() {
        const name = this.requireParam('name');
        const result = await PostService.getTagInfo(name);

        this.success(result);
    }

    async getTrendingTags() {
        const options = this.getQueryFilters();
        const result = await PostService.getTrendingTags(options);
        this.success(result);
    }
    addComment = async () => {
        const user = this.getUser<{ _id: string }>();
        const postId = this.requireParam('id'); // Usamos 'id' de la URL /post/:id/comment
        const { text } = this.getBody(); 

        const result = await InteractionService.createComment(user._id, postId, text);
        this.success(result);
    };

    // Leer Comentarios
    getComments = async () => {
        const postId = this.requireParam('id'); // Usamos 'id' de la URL /post/:id/comments
        const { page, limit } = this.getQuery();

        const result = await InteractionService.getComments(postId, { 
            pagination: { page: Number(page) || 1, limit: Number(limit) || 20 },
            sort: { createdAt: -1 } // Más recientes primero
        });
        
        this.success(result);
    };
}


export default new PostController();
