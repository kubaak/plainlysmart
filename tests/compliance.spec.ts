import { expect, test } from "@playwright/test";
import en from "../messages/en.json" with { type: "json" };
import cs from "../messages/cs.json" with { type: "json" };
import { business } from "../src/lib/business";

test.beforeEach(async ({page}) => {
  await page.route("https://challenges.cloudflare.com/**", route => route.fulfill({
    contentType: "application/javascript",
    body: "window.turnstile = {render: () => 'widget', remove: () => {}};",
  }));
});

for (const [locale, m] of Object.entries({en, cs})) {
  test(locale + ": legal navigation, disclosure and policy metadata", async ({page}) => {
    await page.goto("/" + locale);
    await expect(page.locator("main")).not.toContainText(/Money-back guarantee|Záruka vrácení peněz|last 3|poslední 3/);
    const footer = page.locator("footer");
    await expect(footer.locator(".business-identity")).toHaveCount(0);
    for (const value of [business.legalName, business.ico, business.address, business.registry]) {
      await expect(footer).not.toContainText(value);
    }
    await expect(footer).toContainText(String(new Date().getFullYear()));
    await expect(footer.getByRole("link", {name: m.legal.title}).first()).toHaveAttribute("href", "/" + locale + "/privacy");
    await page.locator(".hero-buttons button").click();
    const disclosure = page.locator("dialog .privacy-disclosure");
    await expect(disclosure).toBeVisible();
    await expect(disclosure.locator("a")).toHaveAttribute("href", "/" + locale + "/privacy");
    await expect(page.locator('dialog input[type="checkbox"]')).toHaveCount(0);
    await page.keyboard.press("Escape");
    await footer.getByRole("link", {name: m.legal.title}).first().click();
    await expect(page.getByRole("heading", {level: 1})).toHaveText(m.legal.title);
    await expect(page).toHaveTitle(m.legal.title + " | PlainlySmart");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://plainlysmart.com/" + locale + "/privacy");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", m.legal.description);
    await expect(page.locator("main")).not.toContainText(/draft|to be supplied|must confirm|must decide|před zveřejněním|návrh zásad/i);
    await expect(page.locator("main dd")).toHaveText([business.legalName, business.ico, business.address, business.registry]);
    await expect(page.locator("main table")).toHaveCount(2);
    await expect(page.locator("main #rights").locator("..").locator("li")).toHaveCount(8);
    await expect(page.locator("#purposes + p + .legal-table-scroll tbody tr")).toHaveCount(5);
    await expect(page.locator("main section h2")).toHaveCount(m.legal.sections.length);
    await page.getByRole("button", {name: locale.toUpperCase(), exact: true}).click();
    const target = locale === "en" ? "cs" : "en";
    await page.getByRole("link", {name: target.toUpperCase(), exact: true}).click();
    await expect(page).toHaveURL(new RegExp("/" + target + "/privacy$"));
  });

  test(locale + ": business information and footer navigation", async ({page}) => {
    await page.goto("/" + locale);
    await page.locator("footer").getByRole("link", {name: m.legalInfo.title}).click();
    await expect(page).toHaveURL(new RegExp("/" + locale + "/legal$"));
    await expect(page.getByRole("heading", {level: 1})).toHaveText(m.legalInfo.title);
    await expect(page).toHaveTitle(m.legalInfo.title + " | PlainlySmart");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", m.legalInfo.description);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://plainlysmart.com/" + locale + "/legal");
    await expect(page.locator("main dt")).toHaveText([m.legal.legalName, m.legal.ico, m.legal.address, m.legal.registry]);
    await expect(page.locator("main dd")).toHaveText([business.legalName, business.ico, business.address, business.registry]);
    await expect(page.locator("main").getByRole("link", {name: business.email})).toHaveAttribute("href", "mailto:" + business.email);
    await page.getByRole("button", {name: locale.toUpperCase(), exact: true}).click();
    const target = locale === "en" ? "cs" : "en";
    await page.getByRole("link", {name: target.toUpperCase(), exact: true}).click();
    await expect(page).toHaveURL(new RegExp("/" + target + "/legal$"));
    const footer = page.locator("footer");
    await expect(footer.locator(".business-identity")).toHaveCount(0);
    await footer.getByRole("link", {name: target === "en" ? en.legal.title : cs.legal.title}).click();
    await expect(page).toHaveURL(new RegExp("/" + target + "/privacy$"));
    await expect(page.locator("footer").getByRole("link", {name: target === "en" ? en.legalInfo.title : cs.legalInfo.title})).toHaveAttribute("href", "/" + target + "/legal");
  });
}

test("attribution defaults off, accepts, withdraws and survives reload", async ({page}) => {
  await page.goto("/en?utm_source=campaign");
  await expect(page.getByRole("button", {name: en.consent.accept})).toHaveCount(0);
  const preferences = page.getByRole("button", {name: en.consent.preferences});
  await preferences.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", {name: en.consent.accept})).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(preferences).toHaveAttribute("aria-expanded", "false");
  expect(await page.evaluate(() => localStorage.getItem("plainlysmart.attribution-consent.v1"))).toBeNull();
  await preferences.click();
  expect(await page.evaluate(() => sessionStorage.getItem("plainlysmart.utm"))).toBeNull();
  await page.getByRole("button", {name: en.consent.accept}).click();
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem("plainlysmart.utm") || "{}").utmSource)).toBe("campaign");
  await page.getByRole("button", {name: en.consent.preferences}).click();
  await page.getByRole("button", {name: en.consent.reject}).click();
  expect(await page.evaluate(() => sessionStorage.getItem("plainlysmart.utm"))).toBeNull();
  await page.reload();
  await expect(page.getByRole("button", {name: en.consent.preferences})).toBeVisible();
  await expect(page.getByRole("button", {name: en.consent.accept})).toHaveCount(0);
  expect(await page.evaluate(() => sessionStorage.getItem("plainlysmart.utm"))).toBeNull();
});

for (const width of [360, 1440]) {
  test("legal layout at " + width, async ({page}) => {
    await page.setViewportSize({width, height: 900});
    await page.goto("/cs/privacy");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole("link", {name: cs.legal.home}).focus();
    await expect(page.getByRole("link", {name: cs.legal.home})).toBeFocused();
    await page.getByRole("button", {name: cs.nav.darkTheme}).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.screenshot({path: `test-results/privacy-${width}-dark.png`, fullPage: true});
  });
}

test("sitemap includes both policies and message structures match", async ({request}) => {
  const response = await request.get("/sitemap.xml");
  const xml = await response.text();
  for (const locale of ["en", "cs"]) {
    for (const route of ["privacy", "legal"]) expect(xml).toContain("https://plainlysmart.com/" + locale + "/" + route);
  }
  const shape = (value: unknown): unknown => Array.isArray(value) ? value.map(shape) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).map(([key, item]) => [key, shape(item)])) : typeof value;
  expect(shape(en)).toEqual(shape(cs));
});
