import express from "express";
import {loginRouter} from "../routes/login.js";
import passport from "passport";
import "../Middleware/google.js";

const app = express();

app.use(express.json());
app.use(passport.initialize());

app.use(
    "/auth",
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