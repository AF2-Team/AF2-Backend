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

    async createPost(data: any, files?: any[]) {
        this.validateRequired(data, ['user']);

        const postRepo = this.getPostRepo();
        const tagRepo = this.getTagRepo();

        const text = data.text ? String(data.text).trim() : '';
        const hasText = text.length > 0;
        const url = data.url ? String(data.url).trim() : '';
        const hasUrl = url.length > 0;

        const mediaList: Array<{ url: string; fileId: string }> = [];

        // 1. Subida de Archivos
        if (files && Array.isArray(files) && files.length > 0) {
            if (files.length > 5) {
                throw new ValidationError('Maximum 5 media files allowed per post');
            }

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

        // 2. Procesamiento de Hashtags
        const normalizedTags: string[] = [];
        if (hasText) {
            const extracted = extractHashtags(text);

            for (const rawTag of extracted) {
                const normalized = normalizeHashtag(rawTag);
                let tag = await tagRepo.getOne({ normalized });

                if (!tag) {
                    tag = await tagRepo.create({
                        name: rawTag,
                        normalized,
                        postsCount: 1,
                        status: 1,
                    });
                } else {
                    await tagRepo.update(tag.id, {
                        postsCount: (tag.postsCount || 0) + 1,
                    });
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

        // 3. Crear Post
        const newPost = await postRepo.create(postData);

        // 4. Poblar Datos del Usuario (Nombre, Avatar)
        // Esto es crucial para que la App muestre quién creó el post
        if (newPost && typeof newPost.populate === 'function') {
            await newPost.populate('user', 'name username avatarUrl');
        }

        // 5. SOLUCIÓN RANGE ERROR: Devolver Objeto Plano
        // Si no hacemos .toObject(), Express intenta serializar toda la conexión de Mongoose
        return newPost && typeof newPost.toObject === 'function' ? newPost.toObject() : newPost;
    }

    async getPostById(postId: string) {
        this.validateRequired({ postId }, ['postId']);
        const postRepo = this.getPostRepo();
        return postRepo.getById(postId);
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

        // Notificación
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

        // Devolver objeto plano
        return repost && typeof repost.toObject === 'function' ? repost.toObject() : repost;
    }

    // --- Getters y Utilidades ---

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
            
            // Validación corregida: Si borra el texto, debe haber media o url
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
        this.validateRequired({ postId, userId }, ['postId', 'userId']);
        const postRepo = this.getPostRepo();
        const post = await postRepo.getById(postId);

        if (!post) throw new NotFoundError('Post', postId);
        if (post.user.toString() !== userId) throw new ValidationError('Unauthorized');

        await postRepo.update(postId, { status: 0 });

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
        this.validateRequired({ postId, userId, file }, ['postId', 'userId', 'file']);
        const postRepo = this.getPostRepo();
        const post = await postRepo.getById(postId);

        if (!post || post.status !== 1) throw new NotFoundError('Post', postId);
        if (post.user.toString() !== userId) throw new ValidationError('Unauthorized');

        const res = (await ImageKitService.upload(file, 'posts')) as any;
        if (!res?.url || !res?.fileId) throw new ValidationError('Failed to upload media');

        const currentMedia = Array.isArray(post.media) ? post.media : [];
        const updatedMedia = [...currentMedia, { url: res.url, fileId: res.fileId }];

        return postRepo.update(postId, {
            media: updatedMedia,
            mediaUrl: updatedMedia[0]?.url || null,
            mediaId: updatedMedia[0]?.fileId || null,
        });
    }

    async getPostsByUser(userId: string, options: any) {
        this.validateRequired({ userId }, ['userId']);
        const postRepo = this.getPostRepo();
        return postRepo.getAllActive(options, { user: userId, type: 'post', publishStatus: 'published', status: 1 });
    }

    async getPostsByTag(tagName: string, options: any) {
        this.validateRequired({ tagName }, ['tagName']);
        const postRepo = this.getPostRepo();
        return postRepo.getAllActive(options, { tags: normalizeHashtag(tagName), publishStatus: 'published', status: 1 });
    }

    async getTagInfo(name: string) {
        this.validateRequired({ name }, ['name']);
        const tagRepo = this.getTagRepo();
        return tagRepo.getOne({ $or: [{ name }, { normalized: normalizeHashtag(name) }], status: 1 });
    }

    async getTrendingTags(options: any) {
        const tagRepo = this.getTagRepo();
        const repo = tagRepo as any;
        if (repo.getTrending) return repo.getTrending(options);

        return tagRepo.getAllActive(
            { ...options, order: [['postsCount', 'desc']] },
            { status: 1, postsCount: { $gt: 0 } },
        );
    }

    // Métodos para feeds
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