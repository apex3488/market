// Serves the BAYHAN MARKET API from the Next.js server when no external API is configured.
// (With API_INTERNAL_URL set, next.config rewrites /api/v1/* to that server instead.)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(req: Request) {
  const { getApp } = await import("@bayhan/api/embedded");
  const app = await getApp();
  return app.fetch(req);
}

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE, handle as OPTIONS };
