const User = require('../models/User'); // Importamos el Model para interactuar con la DB

class UserService {

    async getUserProfile(userId) {
        // Ejecución de la consulta a la DB
        const user = await User.findById(userId)
                               .select('-password_hash -followers_ids -following_ids') 
                               .lean(); // Usar .lean() para devolver un objeto JS simple y rápido
                               
        if (!user) {

            throw new Error('UserNotFound'); 
        }

        return user;
    }

    async configureUser(userId, updates) {
        
        
        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            updates, 
            { 
                new: true, // Devuelve el documento modificado
                runValidators: true // Asegura que se corran las validaciones del Schema
            }
        ).select('-password_hash -followers_ids -following_ids');
        
        if (!updatedUser) {
            throw new Error('UserNotFound');
        }

        return updatedUser;
    }
    
    // Aquí irían otros métodos como changePassword, followUser, etc.
}

module.exports = new UserService();