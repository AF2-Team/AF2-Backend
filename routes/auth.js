const express = require('express');
const router= express.Router();
const User = require('../models/User');
const bcrypt= require('bcryptjs');
const jwt= require('jsonwebtoken');

// Ruta para el registro de usuario
router.post('/register', async (req, res) => {
    try {
        const { user_name, email, password } = req.body;
        if (!user_name || !email || !password) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'El correo electronico ya esta en uso' });
        }

        const newUser = new User({
            user_name,
            email,
            password_hash: password
        });

        await newUser.save();

        const payload = { id: newUser._id, email: newUser.email };
        const token = jwt.sign(payload, process.env.JWT_SECRET || '', { expiresIn: '1h' });

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            token,
            user: { id: newUser._id, user_name: newUser.user_name, email: newUser.email }
        });

    } catch (error) {
        res.status(500).json({ message: 'Error al registrar el usuario. Por favor intentelo mas tarde', error: error.message });
    }
});

//Ruta para el login del usuario 
router.post('/login',async(req,res) => {
    try{
    const {email, password }= req.body;
    if(!email || !password){
        return res.status(400).json({message:'Todos los campos son obligatorios'});
    }
    
    const user = await User.findOne({email});
    if(!user){
        return res.status(400).json({message:'Usuario no encontrado'});
    }
    
    const isMatch= await user.matchPassword(password);
    if(!isMatch){
       return res.status(400).json({message:'Contraseña incorrecta'});
    }
    const payload= {id: user._id, email: user.email};
    const token= jwt.sign(payload, process.env.JWT_SECRET || '', {expiresIn:'1h'});
    
    res.status(200).json({
        message:'Autenticación exitosa',
         token,
         user: {id: user._id, user_name: user.user_name, email: user.email}});

    } catch(error){
    
        res.status(500).json({message:'Error al Iniciar Sesion. Por favor intentelo mas tarde', error: error.message});
    
    }
});