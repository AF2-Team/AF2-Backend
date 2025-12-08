// Importar los paquetes necesarios
const express = require('express');
const cors = require('cors');

// Cargar las variables de entorno del archivo .env
require('dotenv').config();

// Inicializar la aplicación de Express
const app = express();
const connectDB = require('./config/db');

connectDB();

// Usar middlewares
app.use(cors()); // Permite peticiones desde otros orígenes
app.use(express.json()); // Permite al servidor entender JSON

// Definir el puerto
const PORT = process.env.PORT || 27017;

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('¡API funcionando correctamente! ✅');
});

// Integrar las rutas de autenticación
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Integrar las rutas de usuario
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

// Poner el servidor a escuchar en el puerto definido
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});