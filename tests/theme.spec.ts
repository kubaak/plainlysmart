import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import en from "../messages/en.json" with { type: "json" };
import cs from "../messages/cs.json" with { type: "json" };

const messages = { en, cs };
type Theme = "light" | "dark";

function languageTrigger(page: Page, locale: keyof typeof messages) {
  return page.locator(".languages").getByRole("button", { name: locale.toUpperCase(), exact: true });
}

async function expectTheme(page: Page, theme: Theme) {
  await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^(?!.*\bdark\b)/);
  await expect(page.locator("html")).toHaveCSS("color-scheme", theme);
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    theme === "dark" ? "rgb(25, 26, 23)" : "rgb(252, 250, 247)",
  );
}

for (const system of ["light", "dark"] as const) {
  for (const saved of [null, "invalid", "light", "dark"] as const) {
    test(`startup resolves ${saved ?? "missing"} preference with ${system} system before hydration`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: system });
      await page.addInitScript((value) => {
        if (value !== null) localStorage.setItem("theme", value);
      }, saved);
      await page.route("**/_next/**/*.js*", (route) => route.abort());
      await page.goto("/en");
      await expectTheme(page, saved === "light" || saved === "dark" ? saved : system);
      expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe(saved);
    });
  }

  for (const source of ["system", "explicit"] as const) {
    test(`${system} theme from ${source} survives switching languages both ways and reload`, async ({ page }) => {
      const opposite = system === "dark" ? "light" : "dark";
      await page.emulateMedia({ colorScheme: source === "system" ? system : opposite });
      await page.goto("/en");
      if (source === "explicit") {
        await page
          .getByRole("button", { name: en.nav[system === "dark" ? "darkTheme" : "lightTheme"], exact: true })
          .click();
      }
      await expectTheme(page, system);
      for (const [from, to] of [
        ["en", "cs"],
        ["cs", "en"],
      ] as const) {
        await languageTrigger(page, from).click();
        await page
          .locator(".language-dropdown")
          .getByRole("link", { name: messages[from].nav[to], exact: true })
          .click();
        await expect(page).toHaveURL(`/${to}`);
        await expect(languageTrigger(page, to)).toBeVisible();
        await expectTheme(page, system);
        expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe(source === "explicit" ? system : null);
      }
      await page.reload();
      await expect(
        page.getByRole("button", { name: en.nav[system === "dark" ? "lightTheme" : "darkTheme"], exact: true }),
      ).toBeVisible();
      await expectTheme(page, system);
      await page.emulateMedia({ colorScheme: opposite });
      await expectTheme(page, source === "system" ? opposite : system);
      expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe(source === "explicit" ? system : null);
    });
  }
}

test("system theme follows changes until a choice is saved, including locale navigation", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/en");
  await expect(page.getByRole("button", { name: "Switch to light mode" })).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(25, 26, 23)");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Switch to light mode" })).toBeVisible();
  await languageTrigger(page, "en").click();
  await page.locator(".language-dropdown").getByRole("link", { name: "CS" }).click();
  await expect(page).toHaveURL("/cs");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: cs.nav.lightTheme }).click();
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  expect(errors).toEqual([]);
});

test("blocked storage still allows toggling and locale navigation", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.addInitScript(() => {
    // Simulate unavailable local preference storage.
    Storage.prototype.getItem = () => {
      throw new Error("Storage blocked");
    };
    Storage.prototype.setItem = () => {
      throw new Error("Storage blocked");
    };
  });
  await page.goto("/en");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expectTheme(page, "dark");
  await languageTrigger(page, "en").click();
  await page.locator(".language-dropdown").getByRole("link", { name: "CS" }).click();
  await expect(page).toHaveURL("/cs");
  // The locale layout remounts, so an unsaved choice falls back to the system theme.
  await expectTheme(page, "light");
  await page.getByRole("button", { name: cs.nav.darkTheme, exact: true }).click();
  await expect(page.getByRole("button", { name: cs.nav.lightTheme })).toBeVisible();
  await expectTheme(page, "dark");
});

test("dark theme fits mobile navigation and styles the consultation form", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 812 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/en");
  await expect(page.getByRole("button", { name: "Switch to light mode" })).toBeInViewport();
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  await page.screenshot({ path: "test-results/dark-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: "test-results/dark-desktop.png", fullPage: true });
  await page.locator(".nav-cta").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  for (const label of [en.contact.emailLabel, en.contact.phone, en.contact.message]) {
    const field = dialog.getByLabel(label);
    await expect(field).toBeVisible();
    await expect(field).toHaveCSS("background-color", "rgb(36, 38, 32)");
    await expect(field).toHaveCSS("color", "rgb(242, 238, 229)");
  }
});
