import type { Config } from "./config";
import type { ContactRequest } from "./validation";

export async function verifyTurnstile(token: string, secret: string, hostnames: string[]) {
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ secret, response: token }), signal: AbortSignal.timeout(4000),
  });
  if (!response.ok) throw new Error("TURNSTILE_UNAVAILABLE");
  const result = await response.json() as { success?: boolean; hostname?: string; action?: string };
  return result.success === true && hostnames.includes(result.hostname ?? "") && result.action === "contact";
}

async function brevo(path: string, apiKey: string, body: unknown) {
  const response = await fetch(`https://api.brevo.com/v3/${path}`, {
    method: "POST", headers: { "api-key": apiKey, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body), signal: AbortSignal.timeout(4000),
  });
  if (!response.ok) throw new Error("BREVO_UNAVAILABLE");
}

export async function upsertBrevoContact(data: ContactRequest, apiKey: string, config: Config) {
  await brevo("contacts", apiKey, {
    email: data.email, updateEnabled: true,
    listIds: [config.leadsListId],
    attributes: {
      NAME: data.name, COMPANY: data.company, PHONE: data.phone, MESSAGE: data.message,
      UTM_SOURCE: data.utmSource, UTM_MEDIUM: data.utmMedium, UTM_CAMPAIGN: data.utmCampaign,
      UTM_CONTENT: data.utmContent, UTM_TERM: data.utmTerm, LOCALE: data.locale,
    },
  });
}

export async function sendBrevoEmail(apiKey: string, config: Config, to: string, subject: string, textContent: string) {
  await brevo("smtp/email", apiKey, {
    sender: { name: config.senderName, email: config.senderEmail },
    replyTo: { email: config.replyToEmail }, to: [{ email: to }], subject, textContent,
  });
}

export function confirmation(data: ContactRequest, bookingUrl?: string) {
  const cs = data.locale === "cs";
  return {
    subject: cs ? "Děkujeme za zprávu — PlainlySmart" : "Thanks for reaching out — PlainlySmart",
    text: (cs
      ? `Dobrý den, ${data.name},\n\nděkujeme za zprávu. Brzy se vám ozveme a probereme váš projekt.`
      : `Hi ${data.name},\n\nThanks for your message. We’ll be in touch soon to discuss your project.`) +
      (bookingUrl ? `\n\n${cs ? "Rezervovat bezplatnou konzultaci" : "Book a free consultation"}: ${bookingUrl}` : "") +
      "\n\nPlainlySmart",
  };
}
