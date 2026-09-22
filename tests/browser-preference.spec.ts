import { test, expect } from "@playwright/test";
import cs from "../messages/cs.json" with { type: "json" };

for (const [browserLocale, expected] of [
  ["cs-CZ", "cs"],
  ["de-DE", "en"],
  ["en-US", "en"],
]) {
  test.describe(`native browser language ${browserLocale}`, () => {
    test.use({ locale: browserLocale });
    test("first visit uses browser preference with clean storage", async ({ page }) => {
      await page.goto("/");
      await expect(page).toHaveURL(`/${expected}`);
      expect(await page.evaluate(() => localStorage.getItem("preferredLocale"))).toBeNull();
    });
  });
}

test.describe("Czech browser with explicit English choice", () => {
  test.use({ locale: "cs-CZ" });
  test("choice persists across a fresh visit to root", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/cs");
    const languageTrigger = page.locator(".languages").getByRole("button");
    await expect(languageTrigger).toHaveText("CS");
    await languageTrigger.click();
    await page.locator(".language-dropdown").getByRole("link", { name: cs.nav.en, exact: true }).click();
    await expect(page).toHaveURL("/en");
    // A translated control confirms client navigation has finished before revisiting root.
    await expect(languageTrigger).toHaveText("EN");
    expect(await page.evaluate(() => localStorage.getItem("preferredLocale"))).toBe("en");
    await page.goto("/");
    await expect(page).toHaveURL("/en");
    expect(await page.evaluate(() => navigator.language)).toBe("cs-CZ");
  });
});
