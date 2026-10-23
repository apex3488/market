import { env } from "../env";
import { createDb } from "./client";

const handle = await createDb(env.DATABASE_URL);
console.log("Running migrations…");
await handle.migrate();
console.log("Migrations applied.");
await handle.close();
