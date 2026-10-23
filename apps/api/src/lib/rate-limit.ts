import type { MiddlewareHandler } from "hono";
import { AppError } from "./errors";

/**
 * Fixed-window in-memory limiter. Good enough for a single instance;
 * for horizontal scaling swap the Map for Redis/Upstash.
 */
export function rateLimit(opts: { windowMs: number; max: number; key?: string }): MiddlewareHandler {
  const hits = new Map<string, { count: number; reset: number }>();
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
  }, opts.windowMs).unref();

  return async (c, next) => {
    if (process.env.NODE_ENV === "test") return next();
    const ip =
      c.req.header("cf-connecting-ip") ??
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
      c.req.header("x-real-ip") ??
      "local";
    const key = `${opts.key ?? c.req.path}:${ip}`;
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.reset < now) hits.set(key, { count: 1, reset: now + opts.windowMs });
    else if (++entry.count > opts.max) {
      c.header("Retry-After", String(Math.ceil((entry.reset - now) / 1000)));
      throw new AppError(429, "rate_limited", "Too many requests");
    }
    await next();
  };
}
