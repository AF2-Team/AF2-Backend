const User = require('../models/User');
const jwt = require('jsonwebtoken');

/*Autentica a un usuario y genera un token JWT.*/
const login = async (email, password) => {
  if (!email || !password) {
    const error = new Error('Todos los campos son obligatorios');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    const error = new Error('Credenciales incorrectas');
    error.statusCode = 401;
    throw error;
  }

  const payload = { id: user._id, email: user.email };
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const error = new Error('Error de configuración del servidor');
    error.statusCode = 500;
    throw error;
  }
  const token = jwt.sign(payload, secret, { expiresIn: '1h' });

  return { token, user: { id: user._id, user_name: user.user_name, email: user.email } };
};

const register = async (user_name, email, password) => {
  //Validar que los datos necesarios 
  if (!user_name || !email || !password) {
    const error = new Error('Todos los campos (user_name, email, password) son obligatorios.');
    error.statusCode = 400;
    throw error;
  }

  //Verificar si el usuario ya existe
  const userExists = await User.findOne({ email });
  if (userExists) {
    const error = new Error('El correo electrónico ya está en uso.');
    error.statusCode = 409;
    throw error;
  }

  const newUser = new User({
    user_name,
    email,
    password_hash: password, // El modelo se encargará de hashearlo
  });
  await newUser.save(); // Aquí se ejecuta el hook pre-save

  return { id: newUser._id, user_name: newUser.user_name, email: newUser.email };
};
module.exports = { login, register };
