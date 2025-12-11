
const Post = require('../models/Post');
const User = require('../models/User');

class TimelineService {

    async getHomeFeed(userId, pageSize, currentPage) {
        
        //Validar Paginación
        const skipAmount = (currentPage - 1) * pageSize;

        //Obtener usuarios seguidos y validar existencia
        const user = await User.findById(userId).select('following_ids');
        if (!user) {
            const error = new Error('Usuario autenticado no encontrado.');
            error.statusCode = 404;
            throw error;
        }

        const followingIds = user.following_ids; 
        const isColdStart = followingIds.length === 0;

        //Construcción Dinámica del Filtro
        let filterQuery = {};
        
        // Excluir posts eliminados
        filterQuery.deleted_at = null; 

        if (isColdStart) {
            // COLD START
           // Lógica de Popularidad (Filtrado Mínimo)
            // Solo mostrar posts que tengan un mínimo de interacciones (ej. al menos 5 likes O 2 comentarios).
            filterQuery.$or = [
                { 'counters.likes': { $gte: 5 } },
                { 'counters.comments': { $gte: 2 } }
            ];

            // Excluye los posts del propio usuario
            filterQuery['author._id'] = { $ne: userId }; 
            
            // Ordenación posts con más likes, y luego la fecha
            // Los posts más populares aparecen primero
            sortQuery = { 'counters.likes': -1, created_at: -1 };

        } else {
            // FEED NORMAL: Mostrar solo contenido de los usuarios seguidos
            // Mostrar posts cuyo 'author._id' esté dentro del array 'followingIds'
            filterQuery['author._id'] = { $in: followingIds };
            console.log(`[TimelineService] Estado: FEED NORMAL. Filtro: ${JSON.stringify(filterQuery)}`);
        }

        //Ejecuta las Consultas para Paginación

        // Conteo Total (Necesario para los headers)
        const totalDocuments = await Post.countDocuments(filterQuery);

        //Datos Paginados
        const posts = await Post.find(filterQuery)
            .sort({ created_at: -1 }) // Orden cronológico inverso
            .skip(skipAmount)        // Paginación por Offset
            .limit(pageSize)
            .lean(); 
            
        //Calculo de total de paginas
        const totalPages = Math.ceil(totalDocuments / pageSize);

        return {
            posts: posts,
            totalDocuments: totalDocuments,
            totalPages: totalPages,
            currentPage: currentPage,
            pageSize: pageSize,
            isColdStart: isColdStart,
            hasNextPage: currentPage < totalPages
        };
    }
}

module.exports = new TimelineService();