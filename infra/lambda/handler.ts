import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { getConfig, getSecrets } from "./config";
import { confirmation, sendBrevoEmail, upsertBrevoContact, verifyTurnstile } from "./services";
import { validateContactRequest } from "./validation";

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const log = (outcome: string) => console.info(JSON.stringify({ requestId: event.requestContext.requestId, outcome }));
  const respond = (statusCode: number, error?: string) => ({
    statusCode, headers: { "content-type": "application/json", "cache-control": "no-store" },
    body: JSON.stringify(error ? { success: false, error } : { success: true }),
  });
  log("request_received");
  let data;
  try {
    if (event.requestContext.http.method !== "POST") return respond(405, "METHOD_NOT_ALLOWED");
    if ((event.headers["content-type"] ?? "").split(";")[0].trim().toLowerCase() !== "application/json") {
      log("validation_failure");
      return respond(400, "INVALID_REQUEST");
    }
    const body = event.isBase64Encoded ? Buffer.from(event.body ?? "", "base64").toString("utf8") : event.body ?? "";
    if (Buffer.byteLength(body) > 24_000) return respond(413, "REQUEST_TOO_LARGE");
    data = validateContactRequest(JSON.parse(body));
  } catch {
    log("validation_failure");
    return respond(400, "INVALID_REQUEST");
  }
  let stage = "configuration";
  try {
    const config = getConfig();
    const secrets = await getSecrets();
    stage = "turnstile";
    if (!await verifyTurnstile(data.turnstileToken, secrets.TURNSTILE_SECRET_KEY, config.hostnames)) {
      log("turnstile_failure");
      return respond(403, "TURNSTILE_FAILED");
    }
    stage = "brevo_contact";
    await upsertBrevoContact(data, secrets.BREVO_API_KEY, config);
    stage = "brevo_notification";
    await sendBrevoEmail(secrets.BREVO_API_KEY, config, config.notificationEmail, "New PlainlySmart inquiry",
      `Name: ${data.name}\nEmail: ${data.email}\nCompany: ${data.company}\nPhone: ${data.phone}\nLocale: ${data.locale}\n\n${data.message}`);
    stage = "brevo_confirmation";
    const email = confirmation(data, config.bookingUrl);
    await sendBrevoEmail(secrets.BREVO_API_KEY, config, data.email, email.subject, email.text);
    log("success");
    return respond(200);
  } catch {
    log(`${stage}_failure`);
    return respond(stage === "configuration" ? 500 : 502, "SERVICE_UNAVAILABLE");
  }
}
