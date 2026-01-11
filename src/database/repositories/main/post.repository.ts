import mongoose from 'mongoose';
import PostModel from '@database/models/main/post.model.js';
import { MongooseRepositoryBase } from '@database/repositories/bases/mongoose.repository.js';

class PostRepository extends MongooseRepositoryBase<typeof PostModel> {
    constructor() {
        super(PostModel);
    }

async getByIdPopulated(id: string) {
        const post = await this.model
            .findOne({ _id: id, status: 1 })
            .populate('user', 'username name avatar') // Trae los datos del usuario
            .lean()
            .exec() as any; 

        if (!post) return null;

        // Mapeo crucial para tu frontend
        return {
            ...post,
            author: post.user, 
            id: post._id
        };
    }

    async getCombinedFeed(viewerId: string, options: any = {}) {
        return this.execute('getCombinedFeed', async () => {
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
                options.order.forEach(([field, dir]: any) => {
                    sort[field] = dir === 'asc' ? 1 : -1;
                });
                pipeline.push({ $sort: sort });
            } else {
                pipeline.push({ $sort: { createdAt: -1 } });
            }

            if (options.pagination) {
                pipeline.push({ $skip: options.pagination.offset ?? 0 });
                if (options.pagination.limit > 0) {
                    pipeline.push({ $limit: options.pagination.limit });
                }
            }

            return this.model.aggregate(pipeline).exec();
        });
    }
    async getAllActive(options: any = {}, filter: any = {}) {
        // 1. Extraer paginación (con valores por defecto)
        const page = Number(options.page) || 1;
        const limit = Number(options.limit) || 10;
        const skip = (page - 1) * limit;

        // 2. Construir la Query
        // Combinamos "isActive: true" (o tu lógica de borrado) con el filtro que envía el servicio
        const query = {
            status: 1, // Asegura que no estén borrados
            ...filter       // Agrega { publishStatus: 'published' }
        };

        // 3. Ejecutar consulta en Mongoose
        const posts = await this.model
            .find(query)
            .sort({ createdAt: -1 }) // Ordenar: Más nuevos primero
            .skip(skip)
            .limit(limit)
            .populate('user', 'username name avatar') // <--- IMPORTANTE: Traer datos del usuario para la App
            .lean() // Convierte a JSON simple (más rápido)
            .exec();

        return posts.map((post: any) => ({
            ...post,
            user: post.user, // Duplicamos user dentro de author
            id: post._id       // Opcional: facilitamos el id si hiciera falta
        }));
    }
}

export default new PostRepository();
