const userService = require('../services/UserService');

const configureUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user.id;
    const updates = req.body;

    if (currentUserId !== targetUserId) {
      return res.status(403).json({
        message: 'No tienes permiso para modificar este perfil'
      });
    }

    // Actualizar usuario
    const updatedUser = await userService.configureUser(targetUserId, updates);

    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    res.status(200).json({
      message: 'Usuario actualizado exitosamente.',
      user: updatedUser
    });
  }
  catch (error) {
    res.status(500).json({
      message: 'Error al actualizar usuario.',
      error: error.message
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Obtener el ID del usuario del token
    const user = await userService.getUserProfile(userId);


    if (!user) return res.status(404).json({
      message: 'Usuario no encontrado'
    });
    res.status(200).json({ user });
  }
  catch (errr) {
    res.status(500).json({
      message: 'Error al obtener el perfil del usuario',
      error: error.message
    });
  }

}
module.exports = { getProfile, configureUser };
