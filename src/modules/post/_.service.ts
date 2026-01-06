import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { extractHashtags, normalizeHashtag } from '@utils/hashtags.util.js';
import { ValidationError } from '@errors';
import TagRepository from '@database/repositories/main/tag.repository.js';

class PostService extends BaseService {
    async createPost(data: any) {
        this.validateRequired(data, ['user', 'text']);

        const postRepo = Database.repository('main', 'post');
        const tagRepo = Database.repository('main', 'tag');

        const extracted = extractHashtags(data.text);
        const normalizedTags: string[] = [];

        for (const raw of extracted) {
            const normalized = normalizeHashtag(raw);

            let tag = await tagRepo.getOne({ name: normalized });

            if (!tag) {
                tag = await tagRepo.create({
                    name: normalized,
                    original: raw,
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

        return postRepo.create({
            user: data.user,
            text: data.text,
            fontStyle: data.fontStyle,
            tags: normalizedTags,
            status: 1,
            publishStatus: 'published',
        });
    }

    async getFeed(options: any) {
        const postRepo = Database.repository('main', 'post');
        return postRepo.getAllActive(options, {
            publishStatus: 'published',
        });
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

        return postRepo.create({
            user: userId,
            type: 'repost',
            originalPost: originalPostId,
            status: 1,
            publishStatus: 'published',
        });
    }

    async getById(postId: string) {
        const postRepo = Database.repository('main', 'post');
        return postRepo.getById(postId);
    }

    async updatePost(postId: string, userId: string, data: any) {
        const postRepo = Database.repository('main', 'post');

        const post = await postRepo.getById(postId);
        if (!post || post.user !== userId) {
            throw new ValidationError('Unauthorized');
        }

        const allowed = ['text', 'fontStyle'];
        const payload = this.sanitizeData(data, allowed);

        return postRepo.update(postId, payload);
    }

    async deletePost(postId: string, userId: string) {
        const postRepo = Database.repository('main', 'post');

        const post = await postRepo.getById(postId);
        if (!post || post.user !== userId) {
            throw new ValidationError('Unauthorized');
        }

        return postRepo.update(postId, { status: 0 });
    }

    async addMedia(postId: string, userId: string, file: Express.Multer.File) {
        const postRepo = Database.repository('main', 'post');

        const post = await postRepo.getById(postId);
        if (!post || post.user !== userId) {
            throw new ValidationError('Unauthorized');
        }

        const mediaUrl = `/uploads/posts/${file.filename}`;

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
