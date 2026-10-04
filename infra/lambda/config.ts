import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({ maxAttempts: 2 });
let cached: { value: Secrets; expires: number } | undefined;
export interface Secrets { BREVO_API_KEY: string; TURNSTILE_SECRET_KEY: string }
export async function getSecrets(): Promise<Secrets> {
  if (cached && cached.expires > Date.now()) return cached.value;
  const result = await client.send(new GetSecretValueCommand({ SecretId: process.env.CONTACT_SECRET_ARN }), { abortSignal: AbortSignal.timeout(4000) });
  const value = JSON.parse(result.SecretString ?? "{}");
  if (typeof value.BREVO_API_KEY !== "string" || !value.BREVO_API_KEY ||
      typeof value.TURNSTILE_SECRET_KEY !== "string" || !value.TURNSTILE_SECRET_KEY) throw new Error("CONFIGURATION_ERROR");
  cached = { value, expires: Date.now() + 300_000 };
  return value;
}

export function getConfig() {
  function required(name: string) {
    const value = process.env[name]?.trim();
    if (!value) throw new Error("CONFIGURATION_ERROR");
    return value;
  }
  function list(name: string) {
    const value = Number(required(name));
    if (!Number.isSafeInteger(value) || value <= 0) throw new Error("CONFIGURATION_ERROR");
    return value;
  }
  const bookingUrl = process.env.BOOKING_URL?.trim();
  if (bookingUrl && new URL(bookingUrl).protocol !== "https:") throw new Error("CONFIGURATION_ERROR");
  const leadsListId = list("BREVO_LEADS_LIST_ID");
  const newsletterListId = list("BREVO_NEWSLETTER_LIST_ID");
  if (leadsListId === newsletterListId) throw new Error("CONFIGURATION_ERROR");
  return {
    leadsListId, newsletterListId, bookingUrl,
    notificationEmail: required("CONTACT_NOTIFICATION_EMAIL"),
    replyToEmail: required("CONTACT_REPLY_TO_EMAIL"),
    senderEmail: required("BREVO_SENDER_EMAIL"), senderName: required("BREVO_SENDER_NAME"),
    hostnames: required("TURNSTILE_HOSTNAMES").split(",").map(value => value.trim()),
  };
}
export type Config = ReturnType<typeof getConfig>;
