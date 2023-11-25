import jwt from 'jsonwebtoken';

function TokenAutenticacion(req, res, next) {
    const authHeader = req.headers['authorization'];

    if (authHeader) {
        const token = authHeader.split(' ')[1]; // Bearer <token>

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                return res.sendStatus(403); // Token inválido o expirado
            }
            req.user = user; // Agrega los datos decodificados del token a la solicitud
            next(); // Continúa con la siguiente función en el middleware/ruta
        });
    } else {
        return res.sendStatus(401); // No hay token, acceso no autorizado
    }
}


export default TokenAutenticacion