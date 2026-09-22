import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import en from "../messages/en.json" with { type: "json" };
import cs from "../messages/cs.json" with { type: "json" };

const messages = { en, cs };
type Locale = keyof typeof messages;

function triggerFor(page: Page, locale: Locale) {
  return page.locator(".languages").getByRole("button", {
    name: locale.toUpperCase(),
    exact: true,
  });
}

async function switchTo(page: Page, from: Locale, to: Locale) {
  await triggerFor(page, from).click();
  await page.locator(".language-dropdown").getByRole("link", { name: messages[from].nav[to], exact: true }).click();
  await expect(triggerFor(page, to)).toBeVisible();
  await expect(triggerFor(page, to)).toHaveAttribute("aria-expanded", "false");
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  // Check diagnostics even when a navigation assertion fails.
  runtimeErrors.set(page, errors);
});

const runtimeErrors = new WeakMap<Page, string[]>();
test.afterEach(async ({ page }) => {
  expect(runtimeErrors.get(page), "Browser runtime and console errors").toEqual([]);
});

test("language dropdown dismisses accessibly and preserves the URL when switching", async ({ page }) => {
  await page.goto("/en?source=test#top");
  const trigger = triggerFor(page, "en");
  const czech = page.locator(".language-dropdown").getByRole("link", { name: "CS" });
  await expect(czech).toBeHidden();
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Tab");
  await expect(czech).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(czech).toBeHidden();
  await trigger.click();
  await page.locator("h1").click();
  await expect(czech).toBeHidden();
  await trigger.click();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(czech).toBeHidden();
  await trigger.click();
  await czech.click();
  await expect(page).toHaveURL("/cs?source=test#top");
  await triggerFor(page, "cs").click();
  await page.locator(".language-dropdown").getByRole("link", { name: "EN" }).click();
  await expect(page).toHaveURL("/en?source=test#top");
});

test("switching languages preserves scroll position after scrolling away from an anchor", async ({ page }) => {
  await page.goto("/en?source=test");
  await triggerFor(page, "en").click();
  await page.keyboard.press("Escape");
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.history.replaceState(window.history.state, "", "#contact");
  });
  await page.evaluate(() => window.scrollTo({ top: 400, behavior: "instant" }));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(400);

  for (const [from, to] of [
    ["en", "cs"],
    ["cs", "en"],
  ] as const) {
    // Dispatch without Playwright scrolling the offscreen header into view first.
    await triggerFor(page, from).dispatchEvent("click");
    await page
      .locator(".language-dropdown")
      .getByRole("link", { name: messages[from].nav[to], exact: true })
      .dispatchEvent("click", { button: 0 });
    await expect(triggerFor(page, to)).toBeVisible();
    await expect(page).toHaveURL(`/${to}?source=test#contact`);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(400);
  }
});

for (const suffix of ["", "?source=test&campaign=language", "#top", "?source=test#top"]) {
  test(`switching both ways preserves home URL ${suffix || "(plain)"}`, async ({ page }) => {
    await page.goto(`/en${suffix}`);
    for (const [from, to] of [
      ["en", "cs"],
      ["cs", "en"],
    ] as const) {
      await switchTo(page, from, to);
      await expect(page).toHaveURL(`/${to}${suffix}`);
      await expect(page.locator("h1")).toContainText(messages[to].hero.title);
      await expect(page).toHaveTitle(messages[to].meta.title);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", messages[to].meta.description);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://plainlysmart.com/${to}`);
      await expect(page.locator(".language-dropdown")).toBeHidden();
      await page.reload();
      await expect(page).toHaveURL(`/${to}${suffix}`);
      await expect(triggerFor(page, to)).toHaveAttribute("aria-expanded", "false");
    }
  });
}

for (const locale of ["en", "cs"] as const) {
  test(`explicit ${locale} URL wins over conflicting browser and cookie preferences`, async ({ browser, baseURL }) => {
    const other = locale === "en" ? "cs" : "en";
    const context = await browser.newContext({
      baseURL,
      locale: other === "cs" ? "cs-CZ" : "en-US",
    });
    try {
      await context.addCookies([{ name: "NEXT_LOCALE", value: other, url: baseURL! }]);
      const page = await context.newPage();
      await page.goto(`/${locale}`);
      await expect(triggerFor(page, locale)).toBeVisible();
      await page.reload();
      await expect(page).toHaveURL(new RegExp(`/${locale}$`));
      await expect(triggerFor(page, locale)).toBeVisible();
    } finally {
      await context.close();
    }
  });
}

test("blocked browser storage does not break switching or URL preservation", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error("Storage blocked");
    };
    Storage.prototype.setItem = () => {
      throw new Error("Storage blocked");
    };
  });
  await page.goto("/en?source=test#top");
  await switchTo(page, "en", "cs");
  await expect(page).toHaveURL("/cs?source=test#top");
  await switchTo(page, "cs", "en");
  await expect(page).toHaveURL("/en?source=test#top");
});

for (const locale of ["en", "cs"] as const) {
  test(`direct ${locale} visit renders localized content and SEO without JavaScript`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
    try {
      const page = await context.newPage();
      const response = await page.goto(`/${locale}`);
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1")).toContainText(messages[locale].hero.title);
      await expect(page).toHaveTitle(messages[locale].meta.title);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        "content",
        messages[locale].meta.description,
      );
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://plainlysmart.com/${locale}`);
      for (const alternate of ["en", "cs", "x-default"]) {
        await expect(page.locator(`link[rel="alternate"][hreflang="${alternate}"]`)).toHaveAttribute(
          "href",
          `https://plainlysmart.com/${alternate === "x-default" ? "en" : alternate}`,
        );
      }
      await expect(page.locator("header .logo")).toHaveAttribute("href", `/${locale}`);
    } finally {
      await context.close();
    }
  });
}

for (const [locale, expected] of [["en-US", "en"], ["de-DE", "en"]] as const) {
  test.describe(`${locale} browser without a saved language preference`, () => {
    test.use({ locale });
    test("root ignores a conflicting locale cookie", async ({ page, context, baseURL }) => {
      await context.addCookies([{ name: "NEXT_LOCALE", value: expected === "en" ? "cs" : "en", url: baseURL! }]);
      await page.goto("/");
      await expect(page).toHaveURL(`/${expected}`);
      await expect(triggerFor(page, expected)).toBeVisible();
    });
  });
}

test("root redirect replaces its history entry", async ({ page }) => {
  await page.goto("/cs?visit=previous");
  await page.goto("/");
  await expect(page).toHaveURL("/en");
  await page.goBack();
  await expect(page).toHaveURL("/cs?visit=previous");
});

for (const width of [320, 375]) {
  test(`mobile language dropdown remains visible and usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 });
    await page.goto("/en");
    await expect(triggerFor(page, "en")).toBeInViewport();
    await triggerFor(page, "en").click();
    const option = page.locator(".language-dropdown").getByRole("link", { name: "CS", exact: true });
    await expect(option).toBeInViewport();
    await option.click();
    await expect(page).toHaveURL("/cs");
    await expect(triggerFor(page, "cs")).toBeInViewport();
    await switchTo(page, "cs", "en");
    await expect(page).toHaveURL("/en");
  });
}

test("switching replaces the current history entry", async ({ page }) => {
  await page.goto("/en?visit=previous");
  await page.goto("/en?visit=current");
  await switchTo(page, "en", "cs");
  await expect(page).toHaveURL("/cs?visit=current");
  await page.goBack();
  await expect(page).toHaveURL("/en?visit=previous");
});

test.describe("Czech browser with a saved language preference", () => {
  test.use({ locale: "cs-CZ" });
  test("root uses the browser language until an explicit English choice", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/cs");
    await switchTo(page, "cs", "en");
    await page.goto("/");
    await expect(page).toHaveURL("/en");
    await expect(triggerFor(page, "en")).toBeVisible();
  });
});
