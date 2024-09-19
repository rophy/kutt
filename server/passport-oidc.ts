import passport from "passport";

import query from "./queries";
import env from "./env";

import { Issuer, Strategy, UserinfoResponse } from "openid-client";


if (env.OIDC_CONNEXION_ENABLED) {
  (async function addOIDCStrategy() {
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
            scope: "openid",
            prompt: "login"
          },
          passReqToCallback: true
        },
        async (req, tokenset, userinfo: UserinfoResponse, done) => {
          try {
            const user = await query.user.find({ sub: userinfo.sub });
            if (!user) {
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

    
  })();
}
