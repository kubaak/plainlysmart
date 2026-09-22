import { expect, test } from "@playwright/test";
import en from "../messages/en.json" with { type: "json" };
import cs from "../messages/cs.json" with { type: "json" };

for (const route of ["/", "/en", "/cs"]) {
  test(`${route} loads without browser errors`, async ({ page }) => {
    const messages = route === "/cs" ? cs : en;
    const errors: string[] = [];
    // Register before navigation to capture startup and hydration failures.
    page.on("console", (message) => {
      if (message.type() === "error") {
        const { url, lineNumber } = message.location();
        errors.push(`console.error: ${message.text()} (${url}:${lineNumber})`);
      }
    });
    page.on("pageerror", (error) => errors.push(`Uncaught exception: ${error.stack ?? error.message}`));

    try {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expect(page).toHaveURL(route === "/cs" ? /\/cs$/ : /\/en$/);
      await expect(page.locator("h1")).toBeVisible();

      // Exercise hydrated React handlers, beyond merely receiving server HTML.
      await page.getByRole("button", { name: messages.hero.cta, exact: true }).first().click();
      const dialog = page.locator("dialog[open]");
      await expect(dialog).toBeVisible();
      await dialog.getByRole("button", { name: messages.contact.close, exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await page.locator("footer").scrollIntoViewIfNeeded();
      // Allow delayed animations and their callbacks to finish.
      await page.waitForTimeout(3_000);
    } finally {
      expect(errors, "Browser console errors and uncaught exceptions").toEqual([]);
    }
  });
}
