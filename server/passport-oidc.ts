import passport from "passport";

import query from "./queries";
import env from "./env";

import { Issuer, Strategy, UserinfoResponse } from "openid-client";
import { logger } from "./config/winston";


console.log('lalala', env.OIDC_CONNEXION_ENABLED);

if (env.OIDC_CONNEXION_ENABLED) {
  (async function addOIDCStrategy() {
    console.log('adding oidc passport strategy');
    const unAuthIssuer = await Issuer.discover(env.OIDC_DISCOVERY_URL);

    const uncClient = new unAuthIssuer.Client({
      client_id: env.OIDC_CLIENT_ID,
      client_secret: env.OIDC_CLIENT_SECRET,
      redirect_uris: [`${env.APP_URL}/api/v2/auth/login/oidc/cb`],
      response_types: ["code"]
    });

    passport.use(
      "oidc",
      new Strategy(
        {
          client: uncClient,
          params: {
            scope: "openid",
            prompt: "login"
          },
          passReqToCallback: true
        },
        async (req, tokenset, userinfo: UserinfoResponse, done) => {
          try {
            logger.info(`sub: ${userinfo.sub}`);
            const user = await query.user.find({ sub: userinfo.sub });
            logger.info(`user: ${JSON.stringify(user)}`);
            if (!user) {
              logger.info(`new user - sub: ${userinfo.sub} does not exist`);
              // It's a signup
              if (userinfo.sub) {
                // We have needed informations to create user and return it
                let user = await query.user.add({
                  email: userinfo.email,
                  password: undefined,
                  sub: userinfo.sub
                });

                // Verification not needed
                if (userinfo.email_verified) {
                  const updatedUser = await query.user.update(user, {
                    verified: true,
                    verification_token: null,
                    verification_expires: null
                  })[0];
                  user = updatedUser;
                } else {
                  // Something to do to verify email?
                }
                return done(null, user);
              }
              return done(null, false);
            }

            return done(null, user);
          } catch (err) {
            return done(err);
          }
        }
      )
    );

    
  })()
  .then(() => {
    console.log('added oidc passport strategy');
  })
  .catch((err) => {
    console.error(err);

  });
}
