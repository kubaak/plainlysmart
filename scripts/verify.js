import { chromium } from "@playwright/test";
import assert from "node:assert/strict";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
try {
  await page.goto("http://localhost:3000/");
  await page.waitForURL("**/en");
  assert.equal(await page.locator("h1").count(), 1);
  assert.match(await page.title(), /Plainero/);
  await page.screenshot({ path: "artifacts/desktop.png", fullPage: true });
  await page
    .getByRole("button", { name: "Book a free consultation" })
    .first()
    .click();
  const dialog = page.locator("dialog[open]");
  assert.equal(await dialog.count(), 1);
  await dialog.getByRole("button", { name: "Continue to email" }).click();
  assert.equal(await dialog.locator("input:invalid").count(), 2);
  await dialog.getByLabel("Your name", { exact: true }).fill("Test Visitor");
  await dialog.getByLabel("Your work email").fill("visitor@example.com");
  await dialog
    .getByLabel("What would you like to build or improve?")
    .fill("We want to automate order processing.");
  assert.equal(
    await dialog.locator("form").evaluate((form) => form.checkValidity()),
    true,
  );
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("dialog[open]").count(), 0);
  await page.locator("summary").first().click();
  assert.equal(await page.locator("details[open]").count(), 1);
  for (const width of [320, 375, 600, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      true,
      `Overflow at ${width}px`,
    );
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "How it works" })
    .click();
  assert.equal(
    await page
      .getByRole("button", { name: "Open navigation" })
      .getAttribute("aria-expanded"),
    "false",
  );
  await page.goto("http://localhost:3000/en");
  await page.screenshot({ path: "artifacts/mobile.png", fullPage: true });
  await page.goto("http://localhost:3000/cs");
  assert.match(
    await page.locator(".locale-notice").textContent(),
    /coming soon/,
  );
  assert.match(
    await page.locator('meta[name="robots"]').getAttribute("content"),
    /noindex/,
  );
  const missing = await page.goto("http://localhost:3000/de");
  assert.equal(missing.status(), 404);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: locale routing, metadata, dialog validation and dismissal, accordion, mobile navigation, six viewport overflow checks, and browser runtime errors.",
  );
} finally {
  await browser.close();
}
