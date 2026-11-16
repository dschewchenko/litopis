import { expect, test } from "@playwright/test";
import path from "node:path";

test("daisyUI range days keep selected colors and a visible keyboard focus", async ({ page }) => {
  const fixture = path.resolve("tests/browser/fixture.html");
  const bundle = path.resolve("packages/elements/dist/index.global.js");
  const stylesheet = path.resolve("packages/dom/styles/daisyui.css");
  await page.goto(`/litopis/@fs${fixture}`);
  await page.setContent(`
    <link rel="stylesheet" href="/litopis/@fs${stylesheet}">
    <style>
      :root {
        --border: 1px;
        --color-base-100: #fff7ed;
        --color-base-200: #ffedd5;
        --color-base-300: #fed7aa;
        --color-base-content: #431407;
        --color-error: #b91c1c;
        --color-primary: #c2410c;
        --color-primary-content: #ffffff;
        --radius-box: 12px;
        --radius-field: 8px;
        --size-field: 0.25rem;
      }
    </style>
    <script src="/litopis/@fs${bundle}"></script>
    <litopis-date-picker label="Dates" selection="range" start="2026-11-10" end="2026-11-14"></litopis-date-picker>
  `);
  const cell = page
    .locator(".litopis-day[data-in-range]:not([data-range-start]):not([data-range-end])")
    .first();
  const button = cell.locator("button");
  await expect(cell).toHaveCSS("background-color", "rgb(67, 20, 7)");
  await expect(button).toHaveCSS("color", "rgb(255, 247, 237)");
  await button.hover();
  await expect(button).toHaveCSS("background-color", "rgb(67, 20, 7)");
  await expect(button).toHaveCSS("color", "rgb(255, 247, 237)");
  await page.keyboard.press("Tab");
  await button.focus();
  await expect(button).toHaveCSS("box-shadow", /255, 247, 237/);
});

test("selected range remains visible in forced colors", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Forced colors emulation requires Chromium");
  const fixture = path.resolve("tests/browser/fixture.html");
  const bundle = path.resolve("packages/elements/dist/index.global.js");
  const stylesheet = path.resolve("packages/dom/styles/daisyui.css");
  await page.goto(`/litopis/@fs${fixture}`);
  await page.setContent(`
    <link rel="stylesheet" href="/litopis/@fs${stylesheet}">
    <style>.litopis * { transition: none !important; }</style>
    <script src="/litopis/@fs${bundle}"></script>
    <litopis-date-picker label="Dates" selection="range" start="2026-11-10" end="2026-11-14"></litopis-date-picker>
  `);
  await page.emulateMedia({ forcedColors: "active" });
  const start = page.locator(".litopis-day[data-range-start] button");
  const middle = page
    .locator(".litopis-day[data-in-range]:not([data-range-start]):not([data-range-end]) button")
    .first();
  const normal = page.locator('.litopis-day[data-iso-date="2026-11-16"] button');
  const selectedBackground = await start.evaluate(
    (button) => getComputedStyle(button).backgroundColor,
  );
  expect(selectedBackground).not.toBe(
    await normal.evaluate((button) => getComputedStyle(button).backgroundColor),
  );
  await expect(middle).toHaveCSS("background-color", selectedBackground);
  await page.keyboard.press("Tab");
  await middle.focus();
  await expect(middle).toHaveCSS("outline-style", "solid");
});
