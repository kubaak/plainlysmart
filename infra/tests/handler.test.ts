import { beforeEach, afterEach, test, mock } from "node:test";
import assert from "node:assert/strict";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { handler } from "../lambda/handler";
import { validateContactRequest } from "../lambda/validation";
import { validateContactRequest as validateLegacyRequest } from "./fixtures/pre-compliance-validation";

const valid = { name: " Jane ", email: "JANE@example.com", message: "Help with our project", turnstileToken: "token", locale: "en" };
let calls: { url: string; body: Record<string, unknown> }[];
let statuses: number[];
let verification: Record<string, unknown>;
beforeEach(() => {
  Object.assign(process.env, {
    CONTACT_SECRET_NAME: "test", BREVO_LEADS_LIST_ID: "1", BREVO_NEWSLETTER_LIST_ID: "2",
    CONTACT_NOTIFICATION_EMAIL: "info@plainlysmart.com", CONTACT_REPLY_TO_EMAIL: "info@plainlysmart.com",
    BREVO_SENDER_EMAIL: "info@mail.plainlysmart.com", BREVO_SENDER_NAME: "PlainlySmart",
    TURNSTILE_HOSTNAMES: "plainlysmart.com", BOOKING_URL: "https://example.com/book",
  });
  mock.method(SecretsManagerClient.prototype, "send", async () => ({ SecretString: JSON.stringify({ BREVO_API_KEY: "fake-key", TURNSTILE_SECRET_KEY: "fake-secret" }) }));
  calls = []; statuses = [201, 201, 201];
  verification = { success: true, hostname: "plainlysmart.com", action: "contact" };
  mock.method(globalThis, "fetch", async (url: string, options: RequestInit) => {
    calls.push({ url: String(url), body: JSON.parse(options.body as string) });
    if (String(url).includes("siteverify")) return Response.json(verification);
    const status = statuses.shift() ?? 201;
    return new Response(status === 204 ? null : "{}", { status });
  });
});
afterEach(() => mock.restoreAll());
function event(data: unknown = valid): APIGatewayProxyEventV2 {
  return {
    version: "2.0", routeKey: "POST /contact", rawPath: "/contact", rawQueryString: "", isBase64Encoded: false,
    body: JSON.stringify(data), headers: { "content-type": "application/json" },
    requestContext: { routeKey: "POST /contact", requestId: "test", accountId: "test", apiId: "test", domainName: "test", domainPrefix: "test", stage: "$default", time: "", timeEpoch: 0,
      http: { method: "POST", path: "/contact", protocol: "HTTP/1.1", sourceIp: "127.0.0.1", userAgent: "test" } },
  };
}
test("valid submission saves normalized lead then sends both emails", async () => {
  const result = await handler(event());
  assert.equal(result.statusCode, 200);
  assert.deepEqual(JSON.parse(result.body!), { success: true });
  assert.equal(calls.length, 4);
  assert.equal(calls[1].body.email, "jane@example.com");
  assert.equal((calls[1].body.attributes as Record<string, unknown>).NAME, "Jane");
  assert.deepEqual(calls[2].body.to, [{ email: "info@plainlysmart.com" }]);
  assert.deepEqual(calls[3].body.replyTo, { email: "info@plainlysmart.com" });
});
for (const data of [{ ...valid, email: "bad" }, {}, { ...valid, name: " " }, { ...valid, message: "" }, { ...valid, turnstileToken: "" }, { ...valid, locale: "de" }, { ...valid, marketingConsent: "true" }, { ...valid, marketingConsent: null }, { ...valid, message: "a".repeat(4001) }, { ...valid, company: 12 }]) {
  test(`invalid submission: ${JSON.stringify(data).slice(0, 100)}`, async () => {
    const result = await handler(event(data));
    assert.equal(result.statusCode, 400);
    assert.deepEqual(JSON.parse(result.body!), { success: false, error: "INVALID_REQUEST" });
    assert.equal(calls.length, 0);
  });
}
for (const result of [{ success: false }, { success: true, hostname: "evil.example", action: "contact" }, { success: true, hostname: "plainlysmart.com", action: "login" }]) {
  test(`Turnstile rejects ${JSON.stringify(result)} before Brevo`, async () => {
    verification = result;
    assert.equal((await handler(event())).statusCode, 403);
    assert.equal(calls.length, 1);
  });
}
test("existing Brevo contact succeeds with updateEnabled and 204", async () => {
  statuses[0] = 204;
  assert.equal((await handler(event())).statusCode, 200);
  assert.equal(calls[1].body.updateEnabled, true);
});
for (const consent of [undefined, false, true]) {
  test(`legacy marketing field ${consent} cannot subscribe or block transactional mail`, async () => {
    const request = { ...valid, marketingConsent: consent };
    assert.equal((await handler(event(request))).statusCode, 200);
    assert.equal(calls.length, 4);
    assert.deepEqual(calls[1].body.listIds, [1]);
    assert.equal((calls[1].body.attributes as Record<string, unknown>).MARKETING_CONSENT, undefined);
    assert.equal("marketingConsent" in validateContactRequest(request), false);
    assert.deepEqual(calls[2].body.to, [{ email: "info@plainlysmart.com" }]);
    assert.deepEqual(calls[3].body.to, [{ email: "jane@example.com" }]);
  });
}

test("new frontend payload is accepted by the pre-compliance Lambda validator", () => {
  // The actual old validator is frozen in a fixture, not reimplemented here.
  const payload = { ...valid, phone: "", utmSource: "campaign" };
  const oldRequest = validateLegacyRequest(payload);
  assert.equal(oldRequest.marketingConsent, false);
  assert.equal(oldRequest.email, "jane@example.com");
  assert.equal(oldRequest.utmSource, "campaign");
  const { marketingConsent: ignored, ...oldContact } = oldRequest;
  assert.equal(ignored, false);
  assert.deepEqual(validateContactRequest(payload), oldContact);
});
for (const index of [0, 1, 2]) {
  test(`Brevo failure at step ${index} is sanitized`, async () => {
    statuses[index] = 500;
    const result = await handler(event());
    assert.equal(result.statusCode, 502);
    assert.deepEqual(JSON.parse(result.body!), { success: false, error: "SERVICE_UNAVAILABLE" });
    assert.equal(calls.length, index + 2);
  });
}
for (const locale of ["en", "cs"]) {
  test(`${locale} confirmation with booking link`, async () => {
    await handler(event({ ...valid, locale }));
    assert.match(calls[3].body.textContent as string, locale === "cs" ? /Rezervovat bezplatnou konzultaci/ : /Book a free consultation/);
    assert.match(calls[3].body.textContent as string, /https:\/\/example.com\/book/);
  });
}
test("optional booking link omitted", async () => {
  process.env.BOOKING_URL = "";
  await handler(event());
  assert.doesNotMatch(calls[3].body.textContent as string, /https:\/\//);
});
test("malformed JSON and oversized body", async () => {
  assert.equal((await handler({ ...event(), body: "{" })).statusCode, 400);
  assert.equal((await handler({ ...event(), body: "a".repeat(24001) })).statusCode, 413);
});
test("network errors return sanitized failure", async () => {
  mock.method(globalThis, "fetch", async () => { throw new Error("secret provider details"); });
  assert.equal((await handler(event())).statusCode, 502);
});
test("base64 API Gateway body supported", async () => {
  assert.equal((await handler({ ...event(), body: Buffer.from(JSON.stringify(valid)).toString("base64"), isBase64Encoded: true })).statusCode, 200);
});


test("logs never contain contact content, tokens or provider errors", async () => {
  const entries: string[] = [];
  mock.method(console, "info", (entry: string) => { entries.push(entry); });
  await handler(event({...valid, phone: "+420123456789"}));
  await handler(event({...valid, email: "sensitive-invalid-address", message: "PRIVATE-INVALID-MESSAGE"}));
  mock.method(globalThis, "fetch", async () => { throw new Error("private-provider-details"); });
  await handler(event());
  for (const entry of entries) {
    assert.deepEqual(Object.keys(JSON.parse(entry)).sort(), ["outcome", "requestId"]);
    assert.doesNotMatch(entry, /JANE@example|Help with our project|420123456789|fake-key|fake-secret|private-provider-details|sensitive-invalid-address|PRIVATE-INVALID-MESSAGE|"token"/);
  }
});
