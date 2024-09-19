import passport from "passport";
import pino from "pino";

import query from "./queries";
import env from "./env";

import { Issuer, Strategy, UserinfoResponse } from "openid-client";


if (env.OIDC_CONNEXION_ENABLED) {
  (async function addOIDCStrategy() {
    const logger = pino();
    const unAuthIssuer = await Issuer.discover(env.OIDC_DISCOVERY_URL);

    const uncClient = new unAuthIssuer.Client({
      client_id: env.OIDC_CLIENT_ID,
      client_secret: env.OIDC_CLIENT_SECRET,
      redirect_uris: [`${env.APP_URL}/login/oidc/cb`],
      response_types: ["code"]
    });

    passport.use(
      "oidc",
      new Strategy(
        {
          client: uncClient,
          params: {
            scope: env.OIDC_SCOPE,
            prompt: "login"
          },
          passReqToCallback: true
        },
        async (req, tokenset, userinfo: UserinfoResponse, done) => {
          logger.info("oidc callback: %o", userinfo);
          try {
            const existingUser = await query.user.find({ sub: userinfo.sub });

            // Existing user.
            if (existingUser) return done(null, existingUser);

            // New user.

            if (!userinfo.sub) {
              logger.warn('oidc returned user info without sub');
              return done(null, false);
            }

            if (!userinfo.email_verified) {
              logger.warn("oidc user email_verified is not true");
              return done(null, false);
            }

            // We have needed informations to create user and return it
            logger.info("adding user: %o", userinfo);
            const newUser = await query.user.add({
              email: userinfo.email,
              password: undefined,
              sub: userinfo.sub
            });

            const updatedUsers = await query.user.update(newUser, {
              verified: true,
              verification_token: null,
              verification_expires: null,
            });
            logger.info("added user: %o", updatedUsers);
            return done(null, updatedUsers[0]);

          } catch (err) {
            return done(err);
          }
        }
      )
    );

    
  })();
}
