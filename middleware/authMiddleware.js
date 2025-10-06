const jwt = require('jsonwebtoken');

module.exports = function (req, res, next){
    const authHeader = req.headers['authorization'] || req.headers['Authorization']; //Variable para obtener el token del header
    if(!authHeader) return res.status(401).json({message: 'No hay token proporcionado'});

    const parts = authHeader.split(' '); // variable para separar el Bearer del token
    if(parts.length !==2 || parts[0] !== 'Bearer'){ 
        return res.status(401).json({message: 'Formato de token invalido'});
    }
    const token = parts[1];
    try{
       const secret = process.env.JWT_SECRET || ''; 
       const payload = jwt.verify(token, secret);
       req.user= payload;// agregar la informacion del usuario al request
       next(); //Continua con la siguiente funcion del middleware
    }
    catch(err){
        return res.status(401).json({message:'Token invalido o exprirado'});
    }
};