import { expect, test } from "@playwright/test";

for (const locale of ["en", "cs"]) {
  for (const width of [390, 1440]) {
    for (const reducedMotion of ["no-preference", "reduce"] as const) {
      test(`${locale}: motion, layout and native controls at ${width}px (${reducedMotion})`, async ({ browser }) => {
        const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion });
        const page = await context.newPage();
        await page.goto(`http://127.0.0.1:4173/${locale}`);
        await expect(page.locator("h1")).toBeVisible();
        await expect(page.locator(".hero-proof")).toHaveCSS("opacity", "1");
        await page.locator(".workflow-visual").scrollIntoViewIfNeeded();
        await expect(page.locator(".saved-pill")).toHaveCSS("opacity", "1");

        for (const selector of [".service-card", ".comparison-row", ".benefit", ".process-step", ".why-grid > div", ".contact-card"]) {
          const items = page.locator(selector);
          for (const item of await items.all()) {
            await item.scrollIntoViewIfNeeded();
            await expect(item).toBeVisible();
            await expect(item).toHaveCSS("opacity", "1");
            if (reducedMotion === "reduce") await expect(item).toHaveCSS("transform", /^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
          }
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        if (width === 1440 && reducedMotion === "no-preference") {
          const card = page.locator(".service-card").first();
          await card.hover();
          await expect.poll(() => card.evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).m42)).toBeLessThan(-2.9);
          await page.mouse.move(0, 0);
          const offsets = await card.evaluate(async element => {
            const values: number[] = [];
            const end = performance.now() + 650;
            do {
              await new Promise(requestAnimationFrame);
              values.push(new DOMMatrixReadOnly(getComputedStyle(element).transform).m42);
            } while (performance.now() < end);
            return values;
          });
          // No downward jump or replay of the entrance after leaving a hovered card.
          expect(Math.max(...offsets)).toBeLessThan(0.5);
          expect(Math.abs(offsets.at(-1)!)).toBeLessThan(0.1);
        }
        const question = page.locator("details").first();
        await question.locator("summary").click();
        await expect(question).toHaveAttribute("open", "");
        await expect(question.locator("p")).toBeVisible();

        if (width < 600) {
          await page.locator("header").scrollIntoViewIfNeeded();
          const toggle = page.locator("#menu-toggle");
          await toggle.click();
          await expect(toggle).toHaveAttribute("aria-expanded", "true");
          await page.locator("nav a").first().focus();
          await page.keyboard.press("Escape");
          await expect(toggle).toBeFocused();
          await expect(toggle).toHaveAttribute("aria-expanded", "false");
          await toggle.click();
          await page.locator('nav a[href="#contact"]').click();
          await expect(toggle).toHaveAttribute("aria-expanded", "false");
        }

        const trigger = page.locator(".contact-card button");
        await trigger.click();
        await expect(page.getByRole("dialog")).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(page.locator("dialog")).not.toHaveAttribute("open");
        await expect(trigger).toBeFocused();
        // Rapid reopening must not be swallowed by an exit animation.
        await trigger.click();
        await expect(page.getByRole("dialog")).toBeVisible();
        await page.locator(".dialog-close").click();
        await expect(page.locator("dialog")).not.toHaveAttribute("open");
        await page.screenshot({ path: `test-results/motion-${locale}-${width}-${reducedMotion}.png`, fullPage: true });
        await context.close();
      });
    }

    test(`${locale}: exported content remains visible without JavaScript at ${width}px`, async ({ browser }) => {
      const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width, height: 900 } });
      const page = await context.newPage();
      await page.goto(`http://127.0.0.1:4173/${locale}`);
      for (const selector of ["h1", ".hero-proof", ".input-card", ".engine-card", ".saved-pill", ".service-card", ".comparison-row", ".process-step", ".contact-card"]) {
        for (const element of await page.locator(selector).all()) {
          await expect(element).toBeVisible();
          await expect(element).toHaveCSS("opacity", "1");
        }
      }
      await page.locator("details summary").first().click();
      await expect(page.locator("details").first().locator("p")).toBeVisible();
      await expect(page.locator('.email-alternative a')).toHaveAttribute("href", /^mailto:/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await context.close();
    });
  }

  test(`${locale}: delayed hydration never hides the exported content`, async ({ page }) => {
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    await page.route("**/*.js", async route => { await gate; await route.continue(); });
    try {
      await page.goto(`/${locale}`, { waitUntil: "commit" });
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator(".hero-copy")).toHaveCSS("opacity", "1");
      await expect(page.locator(".contact-card")).toHaveCSS("opacity", "1");
    } finally {
      release();
    }
    await page.waitForLoadState("networkidle");
    await page.locator(".hero-buttons button").click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });
}
