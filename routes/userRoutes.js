const express = require('express');
const router = express.Router();
const User = require('../models/User');
const protect = require('../middleware/authMiddleware');


//Aqui iran todas las rutas relacionadas con el usuario
// Por ejemplo: configuracion, etc.

// Ruta para registrar un nuevo usuario
router.post('/register', async (req, res) => {
  try {
    const { user_name, email, password } = req.body;

    //Validar que los datos necesarios 
    if (!user_name || !email || !password) {
      return res.status(400).json({ message: 'Todos los campos (user_name, email, password) son obligatorios.' });
    }

    //Verificar si el usuario ya existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'El correo electrónico ya está en uso.' });
    }

    const newUser = new User({
      user_name,
      email,
      password_hash: password, // El modelo se encargará de hashearlo
    });

    await newUser.save(); // Aquí se ejecuta el hook pre-save

    res.status(201).json({ message: 'Usuario registrado exitosamente.', user: { id: newUser._id, user_name: newUser.user_name, email: newUser.email } });

  } catch (error) {
    res.status(500).json({ message: 'Error al registrar el usuario.', error: error.message });
  }
});

// Ruta para configurar datos del usuario
router.put('/configure/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Actualizar usuario
    const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    res.status(200).json({ message: 'Usuario actualizado exitosamente.', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar usuario.', error: error.message });
  }
});

router.get('/profile', protect, async (req, res) => {
  try {
    const userId = req.user.id; // Obtener el ID del usuario del token
    const user = await User.findById(userId).select('-password_hash');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ user });
  }
  catch (errr) {
    res.status(500).json({ message: 'Error al obtener el perfil del usuario', error: error.message });
  }

});
module.exports = router;
