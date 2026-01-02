import mongoose from 'mongoose';
import PostModel from '@database/models/main/post.model.js';
import { MongooseRepositoryBase } from '@database/repositories/bases/mongoose.repository.js';
import { DatabaseError } from '@errors/database.error.js';
import { ProcessedQueryFilters } from '@rules/api-query.type.js';

type PostCounterField = 'likesCount' | 'commentsCount' | 'repostsCount' | 'favoritesCount';

class PostRepository extends MongooseRepositoryBase<any> {
    constructor() {
        super(PostModel);
    }

    async incrementCounters(postId: string, field: PostCounterField, value: number): Promise<boolean> {
        return this.executeWithLogging('incrementCounters', async () => {
            try {
                const result = await this.model.updateOne({ _id: postId }, { $inc: { [field]: value } });
                return (result.modifiedCount ?? 0) > 0;
            } catch (error: any) {
                throw new DatabaseError(
                    'Mongoose incrementCounters failed',
                    'incrementCounters',
                    { postId, field, value, error: error.message },
                    { cause: error },
                );
            }
        });
    }

    async getByUser(userId: string, options: ProcessedQueryFilters) {
        return this.getAllActive(options, { user: userId });
    }

    async getByTag(tag: string, options: ProcessedQueryFilters) {
        return this.getAllActive(options, { 
            tags: tag,
            publishStatus: 'published'
        });
    }

    async getReposts(postId: string, options: ProcessedQueryFilters) {
        return this.getAllActive(options, {
            type: 'repost',
            originalPost: postId,
            publishStatus: 'published'
        });
    }

    async hasReposted(userId: string, postId: string): Promise<boolean> {
        return this.executeWithLogging('hasReposted', async () => {
            const exists = await this.model.exists({
                user: new mongoose.Types.ObjectId(userId),
                originalPost: new mongoose.Types.ObjectId(postId),
                type: 'repost',
                status: 1
            });
            return !!exists;
        });
    }

    async searchByText(query: string, options: ProcessedQueryFilters) {
        return this.executeWithLogging('searchByText', async () => {
            try {
                const filter = {
                    $text: { $search: query },
                    status: 1,
                    publishStatus: 'published'
                };
                
                const results = await this.model
                    .find(filter)
                    .skip(options.pagination?.offset || 0)
                    .limit(options.pagination?.limit || 10)
                    .sort({ score: { $meta: 'textScore' } })
                    .exec();
                    
                return results.map((r: any) => r.toJSON());
            } catch (error: any) {
                throw new DatabaseError(
                    'Mongoose searchByText failed',
                    'searchByText',
                    { query, options, error: error.message },
                    { cause: error },
                );
            }
        });
    }

    async getCombinedFeed(viewerId: string, options: ProcessedQueryFilters) {
        return this.executeWithLogging('getCombinedFeed', async () => {
            try {
                const viewerObjectId = new mongoose.Types.ObjectId(viewerId);

                const pipeline: any[] = [
                    {
                        $match: {
                            status: 1,
                            publishStatus: 'published',
                        },
                    },

                    {
                        $lookup: {
                            from: 'users',
                            localField: 'user',
                            foreignField: '_id',
                            as: 'author',
                        },
                    },
                    { $unwind: '$author' },
                    { $match: { 'author.status': 1 } },

                    {
                        $lookup: {
                            from: 'posts',
                            localField: 'originalPost',
                            foreignField: '_id',
                            as: 'original',
                        },
                    },
                    {
                        $unwind: {
                            path: '$original',
                            preserveNullAndEmptyArrays: true,
                        },
                    },

                    {
                        $lookup: {
                            from: 'users',
                            localField: 'original.user',
                            foreignField: '_id',
                            as: 'originalAuthor',
                        },
                    },
                    {
                        $unwind: {
                            path: '$originalAuthor',
                            preserveNullAndEmptyArrays: true,
                        },
                    },

                    {
                        $lookup: {
                            from: 'interactions',
                            let: { postId: '$_id' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ['$post', '$$postId'] },
                                                { $eq: ['$user', viewerObjectId] },
                                                { $eq: ['$type', 'like'] },
                                                { $eq: ['$status', 1] },
                                            ],
                                        },
                                    },
                                },
                            ],
                            as: 'viewerLike',
                        },
                    },

                    {
                        $lookup: {
                            from: 'favorites',
                            let: { postId: '$_id' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ['$post', '$$postId'] },
                                                { $eq: ['$user', viewerObjectId] },
                                                { $eq: ['$status', 1] },
                                            ],
                                        },
                                    },
                                },
                            ],
                            as: 'viewerFavorite',
                        },
                    },

                    {
                        $addFields: {
                            liked: { $gt: [{ $size: '$viewerLike' }, 0] },
                            favorited: { $gt: [{ $size: '$viewerFavorite' }, 0] },
                        },
                    },

                    {
                        $project: {
                            viewerLike: 0,
                            viewerFavorite: 0,
                        },
                    },
                ];

                if (options.order?.length) {
                    const sort: any = {};
                    options.order.forEach(([field, dir]) => {
                        sort[field] = dir === 'asc' ? 1 : -1;
                    });
                    pipeline.push({ $sort: sort });
                } else {
                    pipeline.push({ $sort: { createdAt: -1 } });
                }

                if (options.pagination) {
                    pipeline.push({ $skip: options.pagination.offset });
                    if (options.pagination.limit && options.pagination.limit > 0) {
                        pipeline.push({ $limit: options.pagination.limit });
                    }
                }

                return await this.model.aggregate(pipeline).exec();
            } catch (error: any) {
                throw new DatabaseError(
                    'Mongoose getCombinedFeed failed',
                    'getCombinedFeed',
                    { viewerId, options, error: error.message },
                    { cause: error },
                );
            }
        });
    }
}

export { PostRepository };
