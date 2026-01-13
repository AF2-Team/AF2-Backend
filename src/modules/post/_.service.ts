import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { extractHashtags, normalizeHashtag } from '@utils/hashtags.util.js';
import { ValidationError } from '@errors';
import TagRepository from '@database/repositories/main/tag.repository.js';
import { ImageKitService } from '@providers/imagekit.provider.js';
import { ProcessedQueryFilters } from '@rules/api-query.type.js';

class PostService extends BaseService {
    
    async createPost(data: any, files?: Express.Multer.File[]) {
        this.validateRequired(data, ['user']);

        const postRepo = Database.repository('main', 'post') as any;
        const tagRepo = Database.repository('main', 'tag');
        
        const text = typeof data.text === 'string' ? data.text.trim() : '';
        const hasText = text.length > 0;

        // 1. Subida múltiple a ImageKit
        const mediaList: { url: string; fileId: string }[] = [];

        if (files && Array.isArray(files) && files.length > 0) {
            const uploadPromises = files.map((file) => ImageKitService.upload(file, 'posts'));
            const results = await Promise.all(uploadPromises);

            results.forEach((res) => {
                if (!res.url || !res.fileId) {
                    throw new ValidationError('Upload Image Error: Respuesta incompleta del proveedor');
                }
                mediaList.push({ url: res.url, fileId: res.fileId });
            });
        }

        const hasMedia = mediaList.length > 0;

        if (!hasText && !hasMedia) {
            throw new ValidationError('Post must contain text or media');
        }

        // 2. Procesamiento de Hashtags
        const normalizedTags: string[] = [];
        if (hasText) {
            const extracted = extractHashtags(text);
            for (const raw of extracted) {
                const normalized = normalizeHashtag(raw);
                let tag = await tagRepo.getOne({ normalized: normalized });

                if (!tag) {
                    tag = await tagRepo.create({
                        name: raw,
                        normalized: normalized,
                        postsCount: 1,
                        status: 1,
                    });
                } else {
                    await tagRepo.update(tag.id, {
                        postsCount: (tag.postsCount ?? 0) + 1,
                    });
                }
                normalizedTags.push(normalized);
            }
        }

        // 3. Crear el Post
        const newPost = await postRepo.create({
            user: data.user,
            text: hasText ? text : null,
            fontStyle: data.fontStyle || 'regular',
            media: mediaList,
            mediaUrl: hasMedia ? mediaList[0].url : null, // Compatibilidad legacy
            mediaId: hasMedia ? mediaList[0].fileId : null, // Compatibilidad legacy
            tags: normalizedTags,
            type: 'post',
            status: 1,
            publishStatus: 'published',
        });

        // 4. SOLUCIÓN AL RANGE ERROR:
        // Poblamos el usuario directamente en el objeto creado
        // 'avatarUrl' es como se llama en tu modelo de usuario backend
        await newPost.populate('user', 'username name avatarUrl');

        // IMPORTANTE: Convertimos a objeto plano de JavaScript.
        // Esto elimina las referencias circulares de Mongoose que causan el crash.
        return newPost.toObject();
    }

    // --- Resto de métodos (Optimizados) ---

    async getFeed(userId: string, page: number = 1) {
        const postRepo = Database.repository('main', 'post');
        return postRepo.getAllActive(
            { page, limit: 20, sort: { createdAt: -1 } }, 
            { publishStatus: 'published' }
        );
    }

    async getByUser(userId: string, options: any) {
        const postRepo = Database.repository('main', 'post');
        return postRepo.getAllActive(options, {
            user: userId,
            publishStatus: 'published',
        });
    }

    async getByTag(tag: string, options: any) {
        const postRepo = Database.repository('main', 'post');
        return postRepo.getAllActive(options, {
            tags: tag,
            publishStatus: 'published',
        });
    }

    async getCombinedFeed(userId: string, options: any) {
        const postRepo = Database.repository('main', 'post');
        return postRepo.getAllActive(options, {
            publishStatus: 'published',
        });
    }

    async repost(userId: string, originalPostId: string) {
        const postRepo = Database.repository('main', 'post');
        const repost = await postRepo.create({
            user: userId,
            type: 'repost',
            originalPost: originalPostId,
            status: 1,
            publishStatus: 'published',
        });
        return repost ? repost.toObject() : null;
    }

    async getById(postId: string) {
        const postRepo = Database.repository('main', 'post');
        return postRepo.getById(postId);
    }

    async updatePost(postId: string, userId: string, data: any) {
        const postRepo = Database.repository('main', 'post');
        const post = await postRepo.getById(postId);
        
        if (!post || post.user.toString() !== userId.toString()) {
            throw new ValidationError('Unauthorized');
        }

        const allowed = ['text', 'fontStyle'];
        const payload = this.sanitizeData(data, allowed);
        return postRepo.update(postId, payload);
    }

    async deletePost(postId: string, userId: string) {
        const postRepo = Database.repository('main', 'post');
        const post = await postRepo.getById(postId);

        if (!post) throw new ValidationError('Post not found');
        
        // Comparación segura de IDs (toString para evitar errores de objeto vs string)
        if (post.user._id.toString() !== userId.toString() && post.user.toString() !== userId.toString()) {
            throw new ValidationError('Unauthorized');
        }

        return postRepo.update(postId, { status: 0 });
    }

    async addMedia(postId: string, userId: string, file: Express.Multer.File) {
        const postRepo = Database.repository('main', 'post');
        const post = await postRepo.getById(postId);
        
        if (!post || post.user.toString() !== userId.toString()) {
            throw new ValidationError('Unauthorized');
        }

        // Subida a ImageKit (Recomendado usar el provider en lugar de path local)
        const upload = await ImageKitService.upload(file, 'posts');
        const mediaUrl = upload.url;

        return postRepo.update(postId, { mediaUrl });
    }

    async getReposts(postId: string, options: any) {
        const postRepo = Database.repository('main', 'post');
        return postRepo.getAllActive(options, {
            originalPost: postId,
            type: 'repost',
            status: 1,
        });
    }

    async getLikes(postId: string) {
        const likeRepo = Database.repository('main', 'like');
        return likeRepo.getAllActive({}, { post: postId, status: 1 });
    }

    async getInteractions(postId: string) {
        const likeRepo = Database.repository('main', 'like');
        const commentRepo = Database.repository('main', 'comment');
        const postRepo = Database.repository('main', 'post');

        const [likes, comments, reposts] = await Promise.all([
            likeRepo.count({ post: postId, status: 1 }),
            commentRepo.count({ post: postId, status: 1 }),
            postRepo.count({ originalPost: postId, type: 'repost', status: 1 }),
        ]);

        return { likes, comments, reposts };
    }

    async getTagInfo(name: string) {
        const tagRepo = Database.repository('main', 'tag');
        return tagRepo.getOne({
            $or: [{ name }, { normalized: name.toLowerCase() }],
            status: 1,
        });
    }

    async getPostsByTag(name: string, options: any) {
        const postRepo = Database.repository('main', 'post');
        return postRepo.getAllActive(options, {
            tags: name.toLowerCase(),
            publishStatus: 'published',
        });
    }

    async getTrendingTags(options: any) {
        return TagRepository.getTrending(options);
    }
}

export default new PostService();