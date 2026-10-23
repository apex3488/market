import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { bodyLimit } from "hono/body-limit";
import { corsOrigins } from "./env";
import { langMiddleware, sessionMiddleware, type AppEnv } from "./lib/auth";
import { AppError, errorResponse } from "./lib/errors";
import { adminRoutes } from "./routes/admin";
import { authRoutes } from "./routes/auth";
import { storeRoutes } from "./routes/store";

export function buildApp() {
  const app = new Hono<AppEnv>();
  app.use("*", secureHeaders());
  app.use(
    "/api/*",
    cors({
      origin: (origin) => (corsOrigins.includes(origin) ? origin : null),
      credentials: true,
      allowHeaders: ["Content-Type", "Authorization", "X-BM-Client", "X-Cart-Token", "X-Lang", "Idempotency-Key"],
      exposeHeaders: ["X-Cart-Token"],
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      maxAge: 600,
    }),
  );
  app.use("/api/*", bodyLimit({ maxSize: 512 * 1024, onError: () => { throw new AppError(413, "too_large", "Payload too large"); } }));
  app.use("/api/*", langMiddleware);
  app.use("/api/*", sessionMiddleware);

  const v1 = new Hono<AppEnv>();
  v1.get("/health", (c) => c.json({ ok: true }));
  v1.route("/auth", authRoutes);
  v1.route("/admin", adminRoutes);
  v1.route("/", storeRoutes);
  app.route("/api/v1", v1);

  app.notFound((c) => c.json({ error: { code: "not_found", message: "Not found" } }, 404));
  app.onError((err, c) => errorResponse(c, err));
  return app;
}
