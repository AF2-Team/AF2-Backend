const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

//Ruta para el login del usuario 
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Usuario no encontrado' });
        }

        // Usamos el método del modelo, que ya usa bcryptjs correctamente.
        // Esto soluciona la inconsistencia y hace el código más limpio y seguro.
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Contraseña incorrecta' });
        }
        const payload = { id: user._id, email: user.email };
        const token = jwt.sign(payload, process.env.JWT_SECRET || '', { expiresIn: '1h' });

        res.status(200).json({
            message: 'Autenticación exitosa',
            token,
            user: { id: user._id, user_name: user.user_name, email: user.email }
        });

    } catch (error) {

        res.status(500).json({ message: 'Error al Iniciar Sesion. Por favor intentelo mas tarde', error: error.message });

    }
});
module.exports = router;