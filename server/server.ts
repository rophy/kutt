import env from "./env";

import asyncHandler from "express-async-handler";
import cookieParser from "cookie-parser";
import passport from "passport";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import nextApp from "next";

import * as helpers from "./handlers/helpers";
import * as links from "./handlers/links";
import * as auth from "./handlers/auth";
import routes from "./routes";
import { stream } from "./config/winston";

import "./cron";
import "./passport";

import session from "express-session";

const port = env.PORT;
const app = nextApp({ dir: "./client", dev: env.isDev });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  const server = express();

  server.set("trust proxy", true);

  if (env.isDev) {
    server.use(morgan("combined", { stream }));
  }

  server.use(helmet({ contentSecurityPolicy: false }));
  server.use(cookieParser());
  server.use(express.json());
  server.use(express.urlencoded({ extended: true }));
  const store = new session.MemoryStore();
  server.use(
    session({
      secret: "keyboard cat2",
      store,
      resave: false,
      saveUninitialized: false
    })
  );
  server.use(passport.initialize());
  server.use(passport.session());
  server.use(express.static("static"));
  server.use(helpers.ip);

  server.use(asyncHandler(links.redirectCustomDomain));

  server.use("/api/v2", routes);

  server.get(
    "/reset-password/:resetPasswordToken?",
    asyncHandler(auth.resetPassword),
    (req, res) => app.render(req, res, "/reset-password", { token: req.token })
  );

  server.get(
    "/verify-email/:changeEmailToken",
    asyncHandler(auth.changeEmail),
    (req, res) => app.render(req, res, "/verify-email", { token: req.token })
  );

  server.get(
    "/verify/:verificationToken?",
    asyncHandler(auth.verify),
    (req, res) => app.render(req, res, "/verify", { token: req.token })
  );

  server.get("/login/oidc", asyncHandler(auth.oidc));

  server.get(
      "/login/oidc/cb",
      asyncHandler(auth.oidcCallback),
      asyncHandler(auth.oidcFinalize(app))
  );  

  server.get("/:id", asyncHandler(links.redirect(app)));

  // Error handler
  server.use(helpers.error);

  // Handler everything else by Next.js
  server.get("*", (req, res) => handle(req, res));

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
