const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController'); 
const { protect } = require('../middleware/authMiddleware');


//Aqui iran todas las rutas relacionadas con el usuario
router.put('/configure/:id', protect, userController.configureUser);
router.get('/profile', protect, userController.getProfile);
module.exports = router;
