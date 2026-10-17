import { mock } from "node:test";
import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { handler } from "../../lambda/handler";
import { loadStageConfig } from "../../lib/stage-config";

const prod = loadStageConfig("prod").config;

type Scenario = "success" | "turnstile-rejected" | "notification-failed" | "confirmation-failed";

/** Browser tests call the real Lambda; every outbound provider request is intercepted. */
export function createContactHarness(scenario: Scenario = "success") {
  const calls: { url: string; body: Record<string, unknown>; options: RequestInit }[] = [];
  const environment = {
    CONTACT_SECRET_NAME: "mock-contact-secret",
    BREVO_LEADS_LIST_ID: String(prod.brevoLeadsListId),
    BREVO_NEWSLETTER_LIST_ID: String(prod.brevoNewsletterListId),
    CONTACT_NOTIFICATION_EMAIL: prod.contactNotificationEmail,
    CONTACT_REPLY_TO_EMAIL: prod.contactReplyToEmail,
    BREVO_SENDER_EMAIL: prod.brevoSenderEmail,
    BREVO_SENDER_NAME: prod.brevoSenderName,
    TURNSTILE_HOSTNAMES: prod.turnstileHostnames.join(","),
    BOOKING_URL: prod.bookingUrl,
  };
  const previous = Object.fromEntries(Object.keys(environment).map(key => [key, process.env[key]]));
  Object.assign(process.env, environment);
  mock.method(SecretsManagerClient.prototype, "send", async () => ({
    SecretString: JSON.stringify({ BREVO_API_KEY: "mock-brevo-key", TURNSTILE_SECRET_KEY: "mock-turnstile-secret" }),
  }));
  let emailCount = 0;
  mock.method(globalThis, "fetch", async (input: string | URL | Request, options: RequestInit) => {
    const url = String(input);
    calls.push({url, body: JSON.parse(options.body as string), options});
    if (url === "https://challenges.cloudflare.com/turnstile/v0/siteverify") {
      return Response.json({success: scenario !== "turnstile-rejected", hostname: "plainlysmart.com", action: "contact"});
    }
    if (url === "https://api.brevo.com/v3/contacts") return new Response(null, {status: 204});
    if (url === "https://api.brevo.com/v3/smtp/email") {
      emailCount++;
      const failed = (scenario === "notification-failed" && emailCount === 1) ||
        (scenario === "confirmation-failed" && emailCount === 2);
      return Response.json({}, {status: failed ? 500 : 201});
    }
    throw new Error("Unexpected outbound request in contact test");
  });
  return {
    calls,
    async submit(body: string, method: string, headers: Record<string, string>) {
      return handler({
        version: "2.0", routeKey: "POST /contact", rawPath: "/contact", rawQueryString: "",
        isBase64Encoded: false, body, headers,
        requestContext: {
          requestId: "mock-browser-contact", http: {method, path: "/contact"},
        },
      } as APIGatewayProxyEventV2);
    },
    restore() {
      mock.restoreAll();
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    },
  };
}
