import express from "express";
import {loginRouter} from "../routes/login.js";
import passport from "passport";
import "../Middleware/google.js";
import TokenAutenticacion from '../Middleware/AutenticacionJWT.js';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

import setupSwagger from './swager.js';
const app = express();

setupSwagger(app);


app.use(express.json());
app.use(passport.initialize());

const dbPromise = open({
  filename: './db/Si.db',
  driver: sqlite3.Database
});

app.use('/auth', loginRouter); 
/*
app.get('/salas',TokenAutenticacion ,(req, res) => {  // el TokenAutenticacion es para validar el token, si lo pones en todo los loginRouter.get deveria validarlos todos
    // Lógica para la ruta protegida
    res.send('Acceso a ruta protegida concedido');
  });
*/
// todas las rutas siguientes tienen que ser protegidas

//consulta de las salas
// para acceder a la ru

/**
 * @openapi
 * /rooms:
 *   get:
 *     tags:
 *       - Salas
 *     summary: Obtiene todas las salas
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de salas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   nombre: 
 *                     type: string
 *                   codigo: 
 *                     type: integer
 *       401:
 *         description: No autorizado
 */

loginRouter.get('/rooms',TokenAutenticacion, async (req, res) => {
  try {
      const db = await dbPromise;
      const rows = await db.all("SELECT * FROM Salas");
      res.json(rows);
  } catch (err) {
      console.error(err.message);
      res.status(500).send("Error al recuperar datos de la base de datos");
  }
});

// consulta de la sala por codigo de sala

loginRouter.get('/rooms/:Codigo',TokenAutenticacion, async (req, res) => {
  const codigo = parseInt(req.params.Codigo);
  try {
      const db = await dbPromise;
      const row = await db.get("SELECT * FROM Salas WHERE Codigo = ?", [codigo]);
      if (row) {
          res.json(row);
      } else {
          res.status(404).send('Sala no encontrada');
      }
  } catch (err) {
      console.error(err.message);
      res.status(500).send("Error al realizar la consulta a la base de datos");
  }
});



loginRouter.post('/reserve/search', TokenAutenticacion, async (req, res) => {
  const { usuario, codigoSala, fechaInicio, fechaTermino } = req.body;
  try {
      const db = await dbPromise;

      // Crear la consulta con parámetros dinámicos
      let query = "SELECT * FROM Reservas WHERE ";
      let params = [];
      let conditions = [];
      if (usuario) {
          conditions.push("Usuario = ?");
          params.push(usuario);
      }
      if (codigoSala) {
          conditions.push("Codigo_Sala = ?");
          params.push(codigoSala);
      }
      if (fechaInicio) {
          conditions.push("Fecha_Inicio >= ?");
          params.push(fechaInicio);
      }
      if (fechaTermino) {
          conditions.push("Fecha_Termino <= ?");
          params.push(fechaTermino);
      }
      query += conditions.join(" AND ");

      // Ejecutar la consulta
      const rows = await db.all(query, params);
      res.json(rows);
  } catch (err) {
      console.error(err.message);
      res.status(500).send("Error al buscar reservas");
  }
});

//agenda para un código de sala y fecha dada

loginRouter.get('/reserve/:Codigo/schedule/:Fecha',TokenAutenticacion,  async (req, res) => {
  const { Codigo, Fecha } = req.params;
  try {
      const db = await dbPromise;
      const rows = await db.all("SELECT * FROM Reservas WHERE Codigo_Sala = ? AND date(Fecha_Inicio) = ?", [Codigo, Fecha]);
      res.json(rows);
  } catch (err) {
      console.error(err.message);
      res.status(500).send("Error al recuperar la agenda");
  }
});

//eliminar reserva

loginRouter.delete('/reserve/:token/cancel',TokenAutenticacion, async (req, res) => {
  const token = req.params.token;
  try {
      const db = await dbPromise;
      const result = await db.run("DELETE FROM Reservas WHERE Token = ?", [token]);
      if (result.changes > 0) {
          res.status(200).send('Reserva anulada con éxito');
      } else {
          res.status(404).send('Reserva no encontrada');
      }
  } catch (err) {
      console.error(err.message);
      res.status(500).send("Error al anular la reserva");
  }
});


loginRouter.post('/reserve/request', TokenAutenticacion, async (req, res) => {
    const { codigoSala, fechaInicio, fechaTermino } = req.body;
    const usuarioEmail = req.user.email; // Asumiendo que el email está en el token JWT

    try {
        const db = await dbPromise;

        // Verificar si la sala está disponible en el rango de fechas solicitado
        const reservaExistente = await db.get("SELECT * FROM Reservas WHERE Codigo_Sala = ? AND NOT (Fecha_Termino <= ? OR Fecha_Inicio >= ?)", [codigoSala, fechaInicio, fechaTermino]);

        if (reservaExistente) {
            return res.status(400).send('La sala ya está reservada en el rango de fechas solicitado');
        }

        // Insertar la nueva reserva en la base de datos
        await db.run("INSERT INTO Reservas (Usuario, Codigo_Sala, Fecha_Inicio, Fecha_Termino) VALUES (?, ?, ?, ?)", [usuarioEmail, codigoSala, fechaInicio, fechaTermino]);

        res.status(201).send('Reserva creada con éxito');
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error al procesar la solicitud de reserva');
    }
});






const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Escuchando en puerto ${port}...`));

