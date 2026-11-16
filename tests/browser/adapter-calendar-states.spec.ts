import { expect, test } from "@playwright/test";
import path from "node:path";

const adapters = ["bootstrap", "shadcn"] as const;

for (const adapter of adapters) {
  test(`${adapter} calendar states follow light and dark tokens`, async ({ page }) => {
    const fixture = path.resolve("tests/browser/fixture.html");
    const bundle = path.resolve("packages/elements/dist/index.global.js");
    const stylesheet = path.resolve(`packages/dom/styles/${adapter}.css`);
    await page.goto(`/litopis/@fs${fixture}`);
    await page.setContent(`
      <link rel="stylesheet" href="/litopis/@fs${stylesheet}">
      <style>
        :root {
          --bs-primary: #0d6efd; --bs-white: #fff; --bs-body-bg: #fff;
          --bs-body-color: #212529; --bs-body-font-family: sans-serif; --bs-body-font-size: 16px;
          --bs-border-color: #dee2e6; --bs-border-width: 1px; --bs-border-radius: 6px;
          --bs-border-radius-lg: 8px; --bs-form-invalid-border-color: #dc3545;
          --bs-form-invalid-color: #dc3545; --bs-tertiary-bg: #f8f9fa;
          --bs-tertiary-color: #6c757d; --bs-secondary-color: #6c757d; --bs-box-shadow: none;
          --primary: #18181b; --primary-foreground: #fff; --background: #fff;
          --foreground: #18181b; --popover: #fff; --popover-foreground: #18181b;
          --border: #e4e4e7; --input: #e4e4e7; --muted: #f4f4f5;
          --muted-foreground: #71717a; --accent: #f4f4f5; --accent-foreground: #18181b;
          --destructive: #b42318; --radius: 8px; --ring: #71717a;
        }
        :root.dark {
          --bs-body-bg: #212529; --bs-body-color: #f8f9fa; --bs-border-color: #495057;
          --bs-tertiary-bg: #343a40; --bs-tertiary-color: #adb5bd; --bs-secondary-color: #adb5bd;
          --primary: #fafafa; --primary-foreground: #18181b; --background: #09090b;
          --foreground: #fafafa; --popover: #09090b; --popover-foreground: #fafafa;
          --border: #27272a; --input: #27272a; --muted: #27272a;
          --muted-foreground: #a1a1aa; --accent: #27272a; --accent-foreground: #fafafa;
        }
      </style>
      <script src="/litopis/@fs${bundle}"></script>
      <litopis-date-picker label="Dates" selection="range" start="2026-11-10" end="2026-11-14" max="2026-11-25"></litopis-date-picker>
    `);
    const selected = page.locator(".litopis-day[data-range-start] button");
    const middle = page
      .locator(".litopis-day[data-in-range]:not([data-range-start]):not([data-range-end])")
      .first();
    const disabled = page
      .locator('.litopis-day:not([data-outside-month]) button[aria-disabled="true"]')
      .first();
    const outside = page
      .locator('.litopis-day[data-outside-month] button[aria-disabled="true"]')
      .first();
    for (const mode of ["light", "dark"]) {
      await page
        .locator("html")
        .evaluate((element, value) => element.classList.toggle("dark", value === "dark"), mode);
      const color =
        adapter === "bootstrap"
          ? "rgb(13, 110, 253)"
          : mode === "dark"
            ? "rgb(250, 250, 250)"
            : "rgb(24, 24, 27)";
      await expect(selected).toHaveCSS("background-color", color);
      const foreground = await selected.evaluate((element) => getComputedStyle(element).color);
      await selected.hover();
      await expect(selected).toHaveCSS("background-color", color);
      await expect(selected).toHaveCSS("color", foreground);
      await page.keyboard.press("Tab");
      await selected.focus();
      await expect(selected).not.toHaveCSS("box-shadow", "none");
      await expect(middle).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      const disabledColor = await disabled.evaluate(async (element) => {
        await Promise.all(element.getAnimations().map((animation) => animation.finished));
        return getComputedStyle(element).color;
      });
      await expect(outside).toHaveCSS("color", disabledColor);
    }
  });
}
