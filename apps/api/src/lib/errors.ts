import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { z } from "zod";

export class AppError extends Error {
  constructor(
    public status: ContentfulStatusCode,
    public code: string,
    message?: string,
    public fields?: Record<string, string>,
  ) {
    super(message ?? code);
  }
}

export const notFound = (what = "not_found") => new AppError(404, "not_found", what);
export const unauthorized = () => new AppError(401, "unauthorized", "Authentication required");
export const forbidden = () => new AppError(403, "forbidden", "Forbidden");
export const badRequest = (code: string, message?: string) => new AppError(400, code, message);

/** Parse with zod and convert issues to field map with short codes. */
export function parse<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const r = schema.safeParse(data);
  if (r.success) return r.data;
  const fields: Record<string, string> = {};
  for (const issue of r.error.issues) {
    const key = issue.path.join(".") || "_";
    if (!fields[key]) fields[key] = /^[a-z_]+$/.test(issue.message) ? issue.message : "invalid";
  }
  throw new AppError(422, "validation", "Validation failed", fields);
}

export async function jsonBody(c: Context): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    throw badRequest("invalid_json", "Body must be valid JSON");
  }
}

export function errorResponse(c: Context, err: unknown) {
  if (err instanceof AppError) {
    return c.json({ error: { code: err.code, message: err.message, fields: err.fields } }, err.status);
  }
  console.error("[unhandled]", err);
  return c.json({ error: { code: "internal", message: "Internal server error" } }, 500);
}
