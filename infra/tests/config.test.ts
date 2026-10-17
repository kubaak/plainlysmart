import { test } from "node:test";
import assert from "node:assert/strict";
import { loadStageConfig, validateStageConfig } from "../lib/stage-config";

test("stage files load independently and missing stages fail descriptively", () => {
  assert.equal(loadStageConfig("prod").config.contactSecretName, "ps-prod-contact");
  assert.equal(loadStageConfig("dev").config.contactSecretName, "ps-dev-contact");
  assert.throws(() => loadStageConfig("missing"), /Cannot load stage 'missing'.*missing.json/);
});

test("configuration rejects missing, invalid and unexpected fields before synthesis", () => {
  const valid = loadStageConfig("prod").config;
  for (const field of Object.keys(valid)) {
    const data = { ...valid } as Record<string, unknown>;
    delete data[field];
    assert.throws(() => validateStageConfig(data, "test.json"), new RegExp(`test.json: ${field}`));
  }
  for (const [field, value] of Object.entries({
    brevoLeadsListId: "3", brevoNewsletterListId: valid.brevoLeadsListId,
    contactSecretName: "arn:aws:secretsmanager:secret", contactNotificationEmail: "invalid",
    bookingUrl: "http://example.com", turnstileHostnames: ["https://example.com"],
    BREVO_API_KEY: "not-allowed",
  })) {
    assert.throws(() => validateStageConfig({ ...valid, [field]: value }, "test.json"), new RegExp(`test.json: ${field}`));
  }
});
