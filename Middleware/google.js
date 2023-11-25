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
      callbackURL: "http://159.223.193.199:9804/auth/google",
    },
    function (accessToken, refreshToken, profile, done) {
      const response = emails.includes(profile.emails[0].value);
      // IF EXISTS IN DATABASE
      if (response) {
        // Generar un JWT
        const token = jwt.sign({ 
          userId: profile.id,       
          name: profile.displayName,
          email: profile.emails[0].value},
          process.env.JWT_SECRET, { expiresIn: '1h' });
        // Enviar el JWT como respuesta
        done(null, { token: token });
      } else {
        // SAVE IN DATABASE
        emails.push(profile.emails[0].value);
      }
    }
  )
);
