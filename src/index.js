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
 * /auth/rooms:
 *   get:
 *     tags:
 *       - Salas
 *     summary: Obtiene todas las salas
 *     description: Devuelve una lista de todas las salas disponibles.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Una lista de salas.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: El ID de la sala.
 *                   nombre:
 *                     type: string
 *                     description: El nombre de la sala.
 *       401:
 *         description: Acceso no autorizado, token no proporcionado o inválido.
 *       500:
 *         description: Error al recuperar datos de la base de datos.
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

/**
 * @openapi
 * /auth/rooms/{Codigo}:
 *   get:
 *     tags:
 *       - Salas
 *     summary: Obtiene los detalles de una sala específica
 *     description: Devuelve los detalles de la sala basándose en su código.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: Codigo
 *         required: true
 *         schema:
 *           type: integer
 *         description: El código numérico de la sala
 *     responses:
 *       200:
 *         description: Detalles de la sala solicitada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 nombre:
 *                   type: string
 *       404:
 *         description: Sala no encontrada
 *       401:
 *         description: Acceso no autorizado, token no proporcionado o inválido
 *       500:
 *         description: Error al realizar la consulta a la base de datos
 */

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

/**
 * @openapi
 * auth/reserve/request:
 *   post:
 *     tags:
 *       - Reservas
 *     summary: Crear una nueva reserva
 *     description: Crea una nueva reserva para una sala en un rango de fechas dado.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               codigoSala:
 *                 type: integer
 *                 description: Código de la sala que se desea reservar.
 *               fechaInicio:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha y hora de inicio de la reserva.
 *               fechaTermino:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha y hora de finalización de la reserva.
 *             example:
 *               codigoSala: 123
 *               fechaInicio: "2023-11-30T10:00:00Z"
 *               fechaTermino: "2023-11-30T12:00:00Z"
 *     responses:
 *       201:
 *         description: Reserva creada con éxito
 *       400:
 *         description: La sala ya está reservada en el rango de fechas solicitado
 *       500:
 *         description: Error al procesar la solicitud de reserva
 *       401:
 *         description: Acceso no autorizado, token no proporcionado o inválido
 */

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

/**
 * @openapi
 * /auth/reserve/search:
 *   post:
 *     tags:
 *       - Reservas
 *     summary: Buscar reservas basadas en criterios
 *     description: Realiza una búsqueda de reservas basada en varios criterios.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               usuario:
 *                 type: string
 *                 description: Identificador del usuario
 *               codigoSala:
 *                 type: integer
 *                 description: Código de la sala
 *               fechaInicio:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha y hora de inicio para la búsqueda
 *               fechaTermino:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha y hora de término para la búsqueda
 *     responses:
 *       200:
 *         description: Lista de reservas que coinciden con los criterios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   usuario:
 *                     type: string
 *       401:
 *         description: Acceso no autorizado, token no proporcionado o inválido
 *       500:
 *         description: Error al buscar reservas
 */


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
/**
 * @openapi
 * /auth//reserve/{Codigo}/schedule/{Fecha}:
 *   get:
 *     tags:
 *       - Reservas
 *     summary: Obtener agenda de reservas para una sala en una fecha específica
 *     description: Obtiene la agenda de reservas para una sala en una fecha específica.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: Codigo
 *         schema:
 *           type: integer
 *         required: true
 *         description: Código de la sala para la cual se desea obtener la agenda.
 *       - in: path
 *         name: Fecha
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Fecha en la que se desea obtener la agenda en formato YYYY-MM-DD.
 *     responses:
 *       200:
 *         description: Lista de reservas para la sala en la fecha especificada
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   usuario:
 *                     type: string
 *       401:
 *         description: Acceso no autorizado, token no proporcionado o inválido
 *       500:
 *         description: Error al recuperar la agenda de reservas
 */

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

/**
 * @openapi
 * /auth/reserve/{token}/cancel:
 *   delete:
 *     tags:
 *       - Reservas
 *     summary: Cancelar una reserva
 *     description: Cancela una reserva existente utilizando el token de la reserva.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Token único de la reserva que se desea cancelar.
 *     responses:
 *       200:
 *         description: Reserva cancelada con éxito
 *       404:
 *         description: Reserva no encontrada
 *       500:
 *         description: Error al intentar cancelar la reserva
 *       401:
 *         description: Acceso no autorizado, token no proporcionado o inválido
 */

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





const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Escuchando en puerto ${port}...`));

