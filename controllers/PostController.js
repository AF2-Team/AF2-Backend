const postService = require('../services/PostService');


const handleServiceError = (res, error) => {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
        status: 'error',
        message: error.message || 'Error interno del servidor.'
    });
};

const createPost = async (req, res) => {
    try {
        const userId = req.user.id;
        const { content, media_url, tags } = req.body;

        if (!content && !media_url) {
            return res.status(400).json({ status: 'fail', message: 'El post debe tener contenido de texto o multimedia.' });
        }

        const newPost = await postService.createPost(userId, content, media_url, tags);

        res.status(201).json({
            status: 'success',
            message: 'Publicación creada exitosamente.',
            data: newPost
        });
    } catch (error) {
        handleServiceError(res, error);
    }
};

const getPostById = async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await postService.getPostById(postId);

        res.status(200).json({ status: 'success', data: post });
    } catch (error) {
        handleServiceError(res, error);
    }
};

const updatePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id; // Usuario autenticado
        const updates = req.body;

        const updatedPost = await postService.updatePost(postId, userId, updates);

        res.status(200).json({
            status: 'success',
            message: 'Publicación actualizada exitosamente.',
            data: updatedPost
        });
    } catch (error) {
        handleServiceError(res, error);
    }
};

const deletePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id; 

        await postService.deletePost(postId, userId);

        res.status(204).json({ // 204 No Content para eliminación exitosa
            status: 'success',
            data: null,
            message: 'Publicación eliminada correctamente.'
        });
    } catch (error) {
        handleServiceError(res, error);
    }
};

module.exports = { createPost, getPostById, updatePost, deletePost };