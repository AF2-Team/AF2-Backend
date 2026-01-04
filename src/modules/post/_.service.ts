import { BaseService } from '@bases/service.base.js';
import { Database } from '@database/index.js';
import { extractHashtags, normalizeHashtag } from '@utils/hashtags.util.js';

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
}

export default new PostService();
