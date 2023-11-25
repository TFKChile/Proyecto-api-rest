import { Router } from "express";
import passport from 'passport';
import TokenAutenticacion from '../Middleware/AutenticacionJWT.js';


//se crea un nuevo enrutador
const loginRouter = Router();

// ruta 
loginRouter.get("/google", 
  passport.authenticate("auth-google", { scope: [
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
], session: false }),
(req, res) => {
  if (req.user && req.user.token) {
    
    // Enviar un mensaje con el tokeni
    res.send(`
    <p>Autenticación exitosa. Tu token es: ${req.user.token}</p>
    <button onclick="window.localStorage.setItem('jwtToken', '${req.user.token}'); window.location.href='/v1/salas';">Ir a Salas</button>
  `);
  } else {
    // Manejar el caso en que no se generó un token o la autenticación falló
    res.status(401).send('Autenticación fallida o token no disponible');
  }
}
);
  // a continuacion todas las rutas que nesesitan autenticacion




export {loginRouter}