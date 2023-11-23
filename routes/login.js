import { Router } from "express";


//se crea un nuevo enrutador
const loginRouter = Router();


// ruta 
loginRouter.get("/google", (req, res) => {
    //se verifica si el usuario esta autenticado
    if (req.isAuthenticated() && req.user && req.user.token) { 
      // Enviar el JWT como respuesta
      res.json({ token: req.user.token });
    } else {
      res.status(401).json({ message: "No autenticado" });
    }
  });

export {loginRouter}