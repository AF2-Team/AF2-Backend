
const Post = require('../models/Post');
const User = require('../models/User');

class PostService {


    async createPost(userId, content, mediaUrl = null, tags = []) {

        const user = await User.findById(userId).select('user_name photo_profile');
        if (!user) {
            const error = new Error('Usuario autenticado no encontrado.');
            error.statusCode = 404;
            throw error;
        }

        //Crear el documento Post 
        const newPost = await Post.create({
            description: content, // Corregido: 'content' a 'description' para coincidir con el Schema
            media_url: mediaUrl,
            tags,
            author: {
                _id: user._id,
                user_name: user.user_name,
                photo_profile: user.photo_profile
            }
        });

        return newPost;
    }


    async getPostById(postId) {
        const post = await Post.findById(postId).lean();
        if (!post || post.deleted_at) {
            const error = new Error('Publicación no encontrada o eliminada.');
            error.statusCode = 404;
            throw error;
        }
        return post;
    }

    //Actualiza un post solo si el usuario es el autor
    async updatePost(postId, userId, updates) {
        //Encontrar el post para verificar el autor
        const post = await Post.findById(postId).select('author._id created_at');
        if (!post) {
            const error = new Error('Publicación no encontrada.');
            error.statusCode = 404;
            throw error;
        }

        //Solo el autor puede editar
        if (post.author._id.toString() !== userId) {
            const error = new Error('No tienes permiso para editar esta publicación.');
            error.statusCode = 403;
            throw error;
        }

        const now = new Date();
        const postCreationTime = post.created_at;
        const timeDifference = now.getTime() - postCreationTime.getTime();
        const hoursDifference = timeDifference / (1000 * 60 * 60);

        if (hoursDifference > 24) {
            const error = new Error('No se puede editar la publicación después de 24 horas.');
            error.statusCode = 403; // Forbidden
            throw error;
        }

        // Ejecutar la actualización (previene que el autor o contadores sean modificados directamente)
        const allowedUpdates = { description: updates.content, tags: updates.tags }; // Corregido: 'content' a 'description'

        const updatedPost = await Post.findByIdAndUpdate(
            postId,
            { $set: allowedUpdates },
            { new: true, runValidators: true }
        ).lean();

        return updatedPost;
    }

    //Realiza una eliminación lógica
    async deletePost(postId, userId) {
        // Buscar y verificar autor
        const post = await Post.findById(postId).select('author._id');
        if (!post) {
            const error = new Error('Publicación no encontrada.');
            error.statusCode = 404;
            throw error;
        }
        if (post.author._id.toString() !== userId) {
            const error = new Error('No tienes permiso para eliminar esta publicación.');
            error.statusCode = 403;
            throw error;
        }

        //Marcar el campo deleted_at
        const deletedPost = await Post.findByIdAndUpdate(
            postId,
            { deleted_at: new Date() },
            { new: true }
        );

        return deletedPost;
    }
}

module.exports = new PostService();