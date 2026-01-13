import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { extractHashtags, normalizeHashtag } from '@utils/hashtags.util.js';
import { ValidationError, NotFoundError } from '@errors';
import { ImageKitService } from '@providers/imagekit.provider.js';
import NotificationService from '@modules/social/notification/_.service.js';

class PostService extends BaseService {
    private getPostRepo() {
        return Database.repository('main', 'post');
    }

    private getTagRepo() {
        return Database.repository('main', 'tag');
    }

    private getInteractionRepo() {
        return Database.repository('main', 'interaction');
    }

    // --- HELPER PRIVADO PARA OBTENER OBJETO LIMPIO ---
    // Esto asegura que devolvemos un JSON puro (lean) y evitamos el error de Stack Size
    private async getCleanPost(postId: string) {
        const repo = this.getPostRepo() as any;
        if (repo.model) {
            return await repo.model
                .findById(postId)
                .populate('user', 'name username avatarUrl') // Poblamos autor
                .lean(); // <--- LA CLAVE: Objeto JSON puro sin lógica de Mongoose
        }
        // Fallback si no podemos acceder al modelo directo
        const doc = await repo.getById(postId);
        return doc && doc.toObject ? doc.toObject() : doc;
    }

    async createPost(data: any, files?: any[]) {
        this.validateRequired(data, ['user']);

        const postRepo = this.getPostRepo();
        const tagRepo = this.getTagRepo();

        const text = data.text ? String(data.text).trim() : '';
        const hasText = text.length > 0;
        const url = data.url ? String(data.url).trim() : '';
        const hasUrl = url.length > 0;

        const mediaList: Array<{ url: string; fileId: string }> = [];

        // 1. Validaciones y Subida
        if (files && Array.isArray(files) && files.length > 0) {
            if (files.length > 5) throw new ValidationError('Maximum 5 media files allowed');

            for (const file of files) {
                const res = (await ImageKitService.upload(file, 'posts')) as any;
                if (res?.url && res?.fileId) {
                    mediaList.push({ url: res.url, fileId: res.fileId });
                }
            }
        }

        const hasMedia = mediaList.length > 0;

        if (!hasText && !hasMedia && !hasUrl) {
            throw new ValidationError('Post must contain text, media, or a URL');
        }

        if (hasText && text.length > 4000) {
            throw new ValidationError('Post text cannot exceed 4000 characters');
        }

        // 2. Hashtags
        const normalizedTags: string[] = [];
        if (hasText) {
            const extracted = extractHashtags(text);
            for (const rawTag of extracted) {
                const normalized = normalizeHashtag(rawTag);
                let tag = await tagRepo.getOne({ normalized });
                if (!tag) {
                    tag = await tagRepo.create({ name: rawTag, normalized, postsCount: 1, status: 1 });
                } else {
                    await tagRepo.update(tag.id, { postsCount: (tag.postsCount || 0) + 1 });
                }
                normalizedTags.push(normalized);
            }
        }

        const postData: any = {
            user: data.user,
            text: hasText ? text : null,
            url: hasUrl ? url : null,
            fontStyle: data.fontStyle || 'regular',
            media: mediaList,
            tags: normalizedTags,
            type: 'post',
            status: 1,
            publishStatus: 'published',
        };

        if (hasMedia) {
            postData.mediaUrl = mediaList[0].url;
            postData.mediaId = mediaList[0].fileId;
        }

        // 3. Crear Documento
        const newPost = await postRepo.create(postData);

        // 4. RETORNAR VERSIÓN LIMPIA (LEAN)
        // Consultamos de nuevo para asegurar que devolvemos un POJO (Plain Old JavaScript Object)
        return await this.getCleanPost(newPost._id.toString());
    }

    async getPostById(postId: string) {
        // Usamos también getCleanPost para coherencia, o el método estándar
        const post = await this.getCleanPost(postId);
        if (!post) throw new NotFoundError('Post', postId);
        return post;
    }

    async createRepost(userId: string, originalPostId: string) {
        this.validateRequired({ userId, originalPostId }, ['userId', 'originalPostId']);

        const postRepo = this.getPostRepo();
        const originalPost = await postRepo.getById(originalPostId);

        if (!originalPost || originalPost.status !== 1) {
            throw new NotFoundError('Post', originalPostId);
        }

        const repostData: any = {
            user: userId,
            type: 'repost',
            originalPost: originalPostId,
            text: originalPost.text,
            url: originalPost.url,
            fontStyle: originalPost.fontStyle || 'regular',
            media: originalPost.media || [],
            tags: originalPost.tags || [],
            status: 1,
            publishStatus: 'published',
        };

        if (originalPost.mediaUrl) {
            repostData.mediaUrl = originalPost.mediaUrl;
            repostData.mediaId = originalPost.mediaId;
        }

        const repost = await postRepo.create(repostData);

        if (originalPost.user.toString() !== userId) {
            try {
                await NotificationService.notify({
                    user: originalPost.user.toString(),
                    actor: userId,
                    type: 'repost',
                    entityId: originalPostId,
                });
            } catch { }
        }

        // 4. RETORNAR VERSIÓN LIMPIA (LEAN)
        return await this.getCleanPost(repost._id.toString());
    }

    // --- Resto de métodos ---

    async getReposts(postId: string, options: any) {
        this.validateRequired({ postId }, ['postId']);
        const postRepo = this.getPostRepo();
        return postRepo.getAllActive(options, { originalPost: postId, type: 'repost', status: 1 });
    }

    async getLikes(postId: string, options: any) {
        this.validateRequired({ postId }, ['postId']);
        const interactionRepo = this.getInteractionRepo();
        return interactionRepo.getAllActive(options, { post: postId, type: 'like', status: 1 });
    }

    async getInteractions(postId: string) {
        this.validateRequired({ postId }, ['postId']);
        const postRepo = this.getPostRepo();
        const interactionRepo = this.getInteractionRepo();

        const post = await postRepo.getById(postId);
        if (!post) throw new NotFoundError('Post', postId);

        const [likes, comments, reposts] = await Promise.all([
            interactionRepo.count({ post: postId, type: 'like', status: 1 }),
            interactionRepo.count({ post: postId, type: 'comment', status: 1 }),
            postRepo.count({ originalPost: postId, type: 'repost', status: 1 }),
        ]);

        return { likes, comments, reposts, favorites: post.favoritesCount || 0 };
    }

    async updatePost(postId: string, userId: string, data: any) {
        this.validateRequired({ postId, userId }, ['postId', 'userId']);
        const postRepo = this.getPostRepo();
        const post = await postRepo.getById(postId);

        if (!post || post.status !== 1) throw new NotFoundError('Post', postId);
        if (post.user.toString() !== userId) throw new ValidationError('Unauthorized');

        const allowed = ['text', 'url', 'fontStyle'];
        const payload = this.sanitizeData(data, allowed);

        if (payload.text !== undefined) {
            const newText = String(payload.text).trim();
            if (newText.length > 4000) throw new ValidationError('Post text cannot exceed 4000 characters');
            
            if (!newText && !post.url && (!post.media || post.media.length === 0))
                throw new ValidationError('Post must contain text, URL, or media');

            payload.text = newText;
            if (newText !== (post.text || '')) {
                const extracted = extractHashtags(newText);
                payload.tags = extracted.map(normalizeHashtag);
            }
        }

        return postRepo.update(postId, payload);
    }

    async deletePost(postId: string, userId: string) {
        const postRepo = this.getPostRepo();
        const post = await postRepo.getById(postId);
        if (!post) throw new NotFoundError('Post', postId);
        if (post.user.toString() !== userId) throw new ValidationError('Unauthorized');
        
        await postRepo.update(postId, { status: 0 });
        
        // Decrementar contadores de tags
        if (post.tags?.length) {
            const tagRepo = this.getTagRepo();
            for (const tagName of post.tags) {
                const tag = await tagRepo.getOne({ normalized: tagName });
                if (tag && tag.postsCount > 0) {
                    await tagRepo.update(tag.id, { postsCount: tag.postsCount - 1 });
                }
            }
        }
        return { deleted: true };
    }

    async addMedia(postId: string, userId: string, file: any) {
        const postRepo = this.getPostRepo();
        const post = await postRepo.getById(postId);
        if (!post || post.status !== 1) throw new NotFoundError('Post', postId);
        if (post.user.toString() !== userId) throw new ValidationError('Unauthorized');

        const res = (await ImageKitService.upload(file, 'posts')) as any;
        const currentMedia = Array.isArray(post.media) ? post.media : [];
        const updatedMedia = [...currentMedia, { url: res.url, fileId: res.fileId }];

        return postRepo.update(postId, { media: updatedMedia });
    }

    async getPostsByUser(userId: string, options: any) {
        const postRepo = this.getPostRepo();
        return postRepo.getAllActive(options, { user: userId, type: 'post', publishStatus: 'published', status: 1 });
    }

    async getPostsByTag(tagName: string, options: any) {
        const postRepo = this.getPostRepo();
        return postRepo.getAllActive(options, { tags: normalizeHashtag(tagName), publishStatus: 'published', status: 1 });
    }

    async getTagInfo(name: string) {
        const tagRepo = this.getTagRepo();
        return tagRepo.getOne({ $or: [{ name }, { normalized: normalizeHashtag(name) }], status: 1 });
    }

    async getTrendingTags(options: any) {
        const tagRepo = this.getTagRepo();
        return tagRepo.getAllActive({ ...options, order: [['postsCount', 'desc']] }, { status: 1, postsCount: { $gt: 0 } });
    }
    
    async getFeed(userId: string, page: number = 1) {
        const postRepo = Database.repository('main', 'post');
        return postRepo.getAllActive({ page, limit: 20 }, { publishStatus: 'published' });
    }
    
    async getCombinedFeed(userId: string, options: any) {
        const postRepo = Database.repository('main', 'post');
        return postRepo.getAllActive(options, { publishStatus: 'published' });
    }
}

export default new PostService();