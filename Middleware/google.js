import passport from "passport";
import { OAuth2Strategy as GoogleStrategy } from "passport-google-oauth";
import { config } from "dotenv";
config();

import jwt from 'jsonwebtoken';

const emails = ["jose.c.escobar.v@gmail.com"];

passport.use(
  "auth-google",
  new GoogleStrategy(
    {
      clientID: process.env.clientID,
      clientSecret: process.env.clientSecret,
      callbackURL: "http://localhost:5000/auth/google",
    },
    function (accessToken, refreshToken, profile, done) {
      const response = emails.includes(profile.emails[0].value);
      // IF EXISTS IN DATABASE
      if (response) {
        // Generar un JWT
        const token = jwt.sign({ userId: profile.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        // Enviar el JWT como respuesta
        done(null, { token });
      } else {
        // SAVE IN DATABASE
        emails.push(profile.emails[0].value);
      }
    }
  )
);