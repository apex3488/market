import { z } from "zod";

const bool = z
  .string()
  .optional()
  .transform((v) => v === "1" || v === "true");

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  /** postgres://… (Neon) or "pglite:./.data/db" / "pglite:memory" for local dev & tests */
  DATABASE_URL: z.string().default("pglite:./.data/db"),
  API_URL: z.string().default("http://localhost:4000"),
  WEB_URL: z.string().default("http://localhost:3000"),
  CORS_ORIGINS: z.string().default(""),
  AUTH_SECRET: z.string().default("dev-only-insecure-secret-change-me-please"),
  STORE_CURRENCY: z.string().length(3).default("UZS"),
  DELIVERY_COURIER_FEE: z.coerce.number().int().min(0).default(3_000_000), // minor units
  SEED_DEMO: bool,

  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().default("BAYHAN MARKET <no-reply@example.com>"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment:", z.prettifyError(parsed.error));
  process.exit(1);
}
export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";

if (isProd && env.AUTH_SECRET.startsWith("dev-only")) {
  console.error("AUTH_SECRET must be set in production");
  process.exit(1);
}

export const corsOrigins = [
  env.WEB_URL,
  ...env.CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean),
];
