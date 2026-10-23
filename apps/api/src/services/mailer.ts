import { env, isProd } from "../env";

/** Sends email through Resend when configured; in development the message is printed to the console. */
export async function sendMail(to: string, subject: string, text: string) {
  if (!env.RESEND_API_KEY) {
    if (!isProd) console.info(`[mail:dev] to=${to} subject=${subject}\n${text}`);
    else console.warn("[mail] RESEND_API_KEY is not set — email not sent");
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.MAIL_FROM, to, subject, text }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) console.warn("[mail] send failed", res.status);
}
