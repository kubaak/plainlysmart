import { expect, test } from "@playwright/test";
import { createContactHarness } from "../support/contact-harness";
import { validateContactRequest as validateLegacyRequest } from "../fixtures/pre-compliance-validation";
import prod from "../../config/prod.json" with {type: "json"};
import en from "../../../messages/en.json" with {type: "json"};
import cs from "../../../messages/cs.json" with {type: "json"};

test.beforeEach(async ({page}) => {
  await page.route("https://challenges.cloudflare.com/**", route => route.fulfill({
    contentType: "application/javascript",
    body: `window.turnstile = {
      render: (element, options) => {
        window.contactTurnstileOptions = options;
        setTimeout(() => options.callback('browser-token'), 0);
        return 'widget';
      }, remove: () => {}
    };`,
  }));
});

for (const [locale, m] of Object.entries({en, cs})) {
  test(`${locale}: static form through real Lambda sends both transactional emails`, async ({page}) => {
    const harness = createContactHarness();
    let submitted: Record<string, unknown> = {};
    try {
      await page.route("**/contact", async route => {
        const request = route.request();
        expect(request.method()).toBe("POST");
        expect(new URL(request.url()).pathname).toBe("/contact");
        expect(request.headers()["content-type"]).toBe("application/json");
        submitted = request.postDataJSON();
        expect(validateLegacyRequest(submitted).marketingConsent).toBe(false);
        const result = await harness.submit(request.postData()!, request.method(), request.headers());
        await route.fulfill({status: result.statusCode!, headers: result.headers as Record<string, string>, body: result.body!});
      });
      await page.goto(`/${locale}`);
      await page.locator(".hero-buttons button").click();
      const dialog = page.getByRole("dialog");
      test.skip(await dialog.getByRole("alert").isVisible(), "Requires public API/site-key build configuration");
      await expect(dialog.locator('input[type="checkbox"]')).toHaveCount(0);
      await dialog.getByLabel(m.contact.name, {exact: true}).fill("  Jane Visitor  ");
      await dialog.getByLabel(m.contact.emailLabel).fill("JANE@example.com");
      await dialog.getByLabel(m.contact.phone).fill("+420123456789");
      await dialog.getByLabel(m.contact.message).fill("Please discuss our project.\nThank you.");
      await dialog.getByRole("button", {name: m.contact.submit}).click();
      await expect(dialog.getByRole("status")).toHaveText(m.contact.sent);
      expect(submitted).toEqual({name: "Jane Visitor", email: "JANE@example.com", phone: "+420123456789",
        message: "Please discuss our project.\nThank you.", locale, turnstileToken: "browser-token"});
      expect(await page.evaluate(() =>
        (window as unknown as {contactTurnstileOptions: {action: string; language: string}}).contactTurnstileOptions
      )).toMatchObject({action: "contact", language: locale});
      expect(harness.calls.map(call => call.url)).toEqual([
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        "https://api.brevo.com/v3/contacts",
        "https://api.brevo.com/v3/smtp/email",
        "https://api.brevo.com/v3/smtp/email",
      ]);
      expect(harness.calls[0].body).toEqual({secret: "mock-turnstile-secret", response: "browser-token"});
      expect(harness.calls[1].body).toEqual({email: "jane@example.com", updateEnabled: true,
        listIds: [prod.brevoLeadsListId], attributes: {
          NAME: "Jane Visitor", COMPANY: "", PHONE: "+420123456789", MESSAGE: submitted.message,
          UTM_SOURCE: "", UTM_MEDIUM: "", UTM_CAMPAIGN: "", UTM_CONTENT: "", UTM_TERM: "", LOCALE: locale,
        }});
      const sender = {name: prod.brevoSenderName, email: prod.brevoSenderEmail};
      expect(harness.calls[2].body).toEqual({sender, replyTo: {email: prod.contactReplyToEmail},
        to: [{email: "info@plainlysmart.com"}], subject: "New PlainlySmart inquiry",
        textContent: `Name: Jane Visitor\nEmail: jane@example.com\nCompany: \nPhone: +420123456789\nLocale: ${locale}\n\n${submitted.message}`});
      expect(harness.calls[3].body).toEqual({sender, replyTo: {email: prod.contactReplyToEmail},
        to: [{email: "jane@example.com"}],
        subject: locale === "cs" ? "Děkujeme za zprávu — PlainlySmart" : "Thanks for reaching out — PlainlySmart",
        textContent: (locale === "cs"
          ? "Dobrý den, Jane Visitor,\n\nděkujeme za zprávu. Brzy se vám ozveme a probereme váš projekt."
          : "Hi Jane Visitor,\n\nThanks for your message. We’ll be in touch soon to discuss your project.") + "\n\nPlainlySmart",
      });
      for (const call of harness.calls) {
        expect(call.options.method).toBe("POST");
        expect(call.options.signal).toBeInstanceOf(AbortSignal);
        if (call.url.includes("api.brevo.com")) {
          expect(call.options.headers).toMatchObject({"api-key": "mock-brevo-key", "content-type": "application/json"});
        }
      }
    } finally { harness.restore(); }
  });
}

for (const [scenario, count] of [["turnstile-rejected", 1], ["notification-failed", 3], ["confirmation-failed", 4]] as const) {
  test(`${scenario}: actual handler error preserves the form and does not report success`, async ({page}) => {
    const harness = createContactHarness(scenario);
    try {
      await page.route("**/contact", async route => {
        const request = route.request();
        const result = await harness.submit(request.postData()!, request.method(), request.headers());
        await route.fulfill({status: result.statusCode!, headers: result.headers as Record<string, string>, body: result.body!});
      });
      await page.goto("/en");
      await page.locator(".hero-buttons button").click();
      const dialog = page.getByRole("dialog");
      test.skip(await dialog.getByRole("alert").isVisible(), "Requires public API/site-key build configuration");
      await dialog.getByLabel(en.contact.name, {exact: true}).fill("Jane");
      await dialog.getByLabel(en.contact.emailLabel).fill("jane@example.com");
      await dialog.getByLabel(en.contact.message).fill("Keep this inquiry after failure");
      await dialog.getByRole("button", {name: en.contact.submit}).click();
      await expect(dialog.getByRole("alert")).toHaveText(en.contact.error);
      await expect(dialog.getByLabel(en.contact.message)).toHaveValue("Keep this inquiry after failure");
      await expect(dialog.getByRole("status")).toHaveCount(0);
      expect(harness.calls).toHaveLength(count);
    } finally { harness.restore(); }
  });
}
