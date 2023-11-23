import express from "express";
import {loginRouter} from "../routes/login.js";
import passport from "passport";
import "../Middleware/google.js";
import sqlite from 'sqlite3';

const app = express();
const sqlite3 = sqlite.verbose();

const db = new sqlite3.Database('../db/Si.db', sqlite3.OPEN_READWRITE, (err) => { //
    if (err) {
        console.error(err.message);
    }
    console.log('Conectado a la base de datos.');
});

app.use(express.json());
app.use(passport.initialize());

app.use(
    "/auth", //ruta para la autenticacion
    passport.authenticate("auth-google", {  
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
      session: false,
    }),
    loginRouter
  );
  
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Escuchando en puerto ${port}...`));