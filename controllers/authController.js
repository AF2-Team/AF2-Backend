const authService = require('../services/AuthService');

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const { token, user } = await authService.login(email, password);

        res.status(200).json({
            message: 'Autenticación exitosa',
            token,
            user,
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

const registerUser = async (req, res) => {
    try {
        const { user_name, email, password } = req.body;
        const newUser = await authService.register(user_name, email, password);

        res.status(201).json({
            message: 'Usuario registrado exitosamente.',
            user: newUser,
        });
    } catch (error) {
        // Usamos el statusCode del error si existe, sino, un 500 genérico
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

module.exports = {
    loginUser,
    registerUser,
};
