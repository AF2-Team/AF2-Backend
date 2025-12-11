const timelineService = require('../services/TimelineService');

const getHomeFeedUser = async (req, res) => {
    try {
        
        const userId = req.user.id;
        
        // Extraer y validar los parámetros de paginación 
        const currentPage = parseInt(req.query.page, 10) || 1;
        const pageSize = parseInt(req.query.pageSize, 10) || 10;

        // Delegar la lógica de negocio al servicio
        const timelineData = await timelineService.getHomeFeed(userId, pageSize, currentPage);

        // Enviar una respuesta exitosa con los datos del timeline
        res.status(200).json({
            status: 'success',
            ...timelineData // Expande el objeto devuelto por el servicio
        });

    } catch (error) {
        // Manejar cualquier error que ocurra
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            status: 'error',
            message: error.message || 'Error interno del servidor al obtener el feed.'
        });
    }
};

module.exports = {getHomeFeedUser};
