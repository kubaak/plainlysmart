import { expect, test } from "@playwright/test";
import en from "../messages/en.json" with { type: "json" };
import cs from "../messages/cs.json" with { type: "json" };

test.beforeEach(async ({ page }) => {
  await page.route("https://challenges.cloudflare.com/**", route => route.fulfill({
    contentType: "application/javascript",
    body: `window.turnstile = { render: (element, options) => { setTimeout(() => options.callback('test-token'), 0); return 'widget'; }, remove: () => {} };`,
  }));
});

for (const [locale, m] of Object.entries({ en, cs })) {
  test(`${locale}: contact fields, validation and shared triggers`, async ({ page }) => {
    const requests: string[] = [];
    await page.route("**/contact", route => {
      requests.push(route.request().url());
      return route.fulfill({ json: { success: true } });
    });
    await page.goto(`/${locale}`);
    const trigger = page.locator(".hero-buttons button");
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: m.contact.dialogTitle })).toBeVisible();
    await expect(dialog.locator("input, textarea")).toHaveCount(5);
    const name = dialog.locator('input[autocomplete="name"]');
    const email = dialog.locator('input[type="email"]');
    const phone = dialog.getByLabel(m.contact.phone);
    const message = dialog.locator("textarea");
    await expect(email).toHaveAttribute("required");
    await expect(message).toHaveAttribute("required");
    await expect(phone).not.toHaveAttribute("required");
    await expect(phone).toHaveAttribute("type", "tel");
    const submit = dialog.getByRole("button", { name: m.contact.submit });
    // A default build remains usable via the email fallback without deployment config.
    if (await dialog.getByRole("alert").isVisible()) {
      await expect(submit).toBeDisabled();
      await expect(dialog.getByRole("alert")).toHaveText(m.contact.unavailable);
      return;
    }
    await submit.click();
    await expect(name).toBeFocused();
    await expect(name).toHaveAttribute("aria-invalid", "true");
    await expect(name).toHaveAccessibleDescription(m.contact.validation.required);
    await name.fill("   ");
    await submit.click();
    await expect(name).toHaveAccessibleDescription(m.contact.validation.required);
    await name.fill("Jane Visitor");
    await submit.click();
    await expect(email).toBeFocused();
    await email.fill("invalid-email");
    await submit.click();
    await expect(email).toHaveAccessibleDescription(m.contact.validation.email);
    await email.fill("visitor@example.com");
    await dialog.getByRole("button", { name: m.contact.submit }).click();
    await expect(message).toBeFocused();
    await message.fill("I want a simpler ordering system.");
    await expect(dialog.locator("form")).toHaveAttribute("novalidate", "");
    expect(requests).toHaveLength(0);
    await dialog.getByRole("button", { name: m.contact.submit }).click();
    await expect(dialog.getByRole("status")).toHaveText(m.contact.sent);
    await expect(dialog).toHaveText(m.contact.sent);
    await expect(dialog).toHaveAccessibleName(m.contact.sent);
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await page.locator(".other-idea a").click();
    await expect(dialog).toBeVisible();
    await expect(email).toHaveValue("");
    await expect(page.locator("dialog")).toHaveCount(1);
    expect(requests).toHaveLength(1);
  });
}

test("failed request retains draft, refreshes verification, blocks duplicate submits and preserves UTM", async ({ page }) => {
  let attempts = 0;
  let payload: Record<string, unknown> = {};
  await page.route("**/contact", async route => {
    attempts++;
    payload = route.request().postDataJSON();
    await new Promise(resolve => setTimeout(resolve, 250));
    await route.fulfill({ status: attempts === 1 ? 502 : 200, json: attempts === 1 ? { success: false, error: "SERVICE_UNAVAILABLE" } : { success: true } });
  });
  await page.goto("/?utm_source=campaign&utm_medium=email&utm_campaign=launch&utm_content=cta&utm_term=software");
  await page.waitForURL(/\/(en|cs)$/);
  await page.goto("/en");
  await page.locator(".hero-buttons button").click();
  const dialog = page.getByRole("dialog");
  test.skip(await dialog.getByRole("alert").isVisible(), "Build with NEXT_PUBLIC_API_BASE_URL and NEXT_PUBLIC_TURNSTILE_SITE_KEY to test submissions");
  await dialog.getByLabel(en.contact.name, { exact: true }).fill("  Jane  ");
  await dialog.getByLabel(en.contact.emailLabel).fill("jane@example.com");
  await dialog.getByLabel(en.contact.message).fill("Please help with a project");
  await dialog.getByLabel(en.contact.marketingConsent).check();
  const submit = dialog.getByRole("button", { name: en.contact.submit });
  await submit.click();
  await expect(dialog.getByRole("button", { name: en.contact.submitting })).toBeDisabled();
  await expect(dialog.getByRole("alert")).toHaveText(en.contact.error);
  await expect(dialog.getByLabel(en.contact.message)).toHaveValue("Please help with a project");
  expect(attempts).toBe(1);
  await submit.click();
  await expect(dialog.getByRole("status")).toHaveText(en.contact.sent);
  expect(attempts).toBe(2);
  expect(payload).toMatchObject({ name: "Jane", marketingConsent: true, locale: "en", turnstileToken: "test-token", utmSource: "campaign", utmMedium: "email", utmCampaign: "launch", utmContent: "cta", utmTerm: "software" });
});

for (const width of [360, 768, 1440]) {
  test(`contact form fits at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/cs");
    await page.locator(".hero-buttons button").click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByLabel(cs.contact.phone)).toBeVisible();
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
