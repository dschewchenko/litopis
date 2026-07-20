import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import path from "node:path";

const documentationPages = [
  "./",
  "./examples/",
  "./guides/",
  "./integrations/",
  "./integrations/react/",
  "./integrations/vue/",
  "./integrations/solid/",
  "./integrations/svelte/",
  "./integrations/web-components/",
  "./api/",
  "./styling/",
  "./accessibility/",
];
const extendedAccessibilityTimeout = 90_000;
const extendedAccessibilityPages = new Set(["./examples/", "./guides/"]);

for (const documentationPage of documentationPages) {
  test(`${documentationPage} has no detectable accessibility violations`, async ({ page }) => {
    if (extendedAccessibilityPages.has(documentationPage)) {
      test.setTimeout(extendedAccessibilityTimeout);
    }

    await page.goto(documentationPage);

    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("meta[name='description']")).toHaveAttribute("content", /\S+/);
  });

  test(`${documentationPage} stays accessible without horizontal page overflow on mobile`, async ({
    page,
  }) => {
    if (extendedAccessibilityPages.has(documentationPage)) {
      test.setTimeout(extendedAccessibilityTimeout);
    }

    await page.setViewportSize({ height: 844, width: 390 });
    await page.goto(documentationPage);

    const results = await new AxeBuilder({ page }).analyze();
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );

    expect(results.violations).toEqual([]);
    expect(hasHorizontalOverflow).toBe(false);
  });
}

test("documentation routes and in-page anchors resolve", async ({ page, request }) => {
  const internalRoutes = new Set<string>();

  for (const documentationPage of documentationPages) {
    await page.goto(documentationPage);

    const missingAnchors = await page
      .locator("a[href^='#']")
      .evaluateAll((links) =>
        links
          .map((link) => link.getAttribute("href")?.slice(1) ?? "")
          .filter((id) => id && !document.getElementById(id)),
      );
    const pageRoutes = await page
      .locator("a[href^='/litopis/']")
      .evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? "").filter(Boolean));

    expect(missingAnchors).toEqual([]);

    for (const route of pageRoutes) {
      internalRoutes.add(route);
    }
  }

  for (const route of internalRoutes) {
    const response = await request.get(route);
    expect(response.ok(), `${route} should resolve`).toBe(true);
  }
});

test("code examples expose keyboard-focusable scrolling and copy actions", async ({ page }) => {
  await page.goto("./api/");

  const firstCodeBlock = page.locator(".vp-code-group").first();
  await expect(firstCodeBlock.getByRole("button", { name: "Copy code" })).toBeVisible();
  await expect(firstCodeBlock.locator("pre")).toHaveAttribute("tabindex", "0");
});

test("example previews mount real pickers and expose keyboard-operated code tabs", async ({
  page,
}) => {
  await page.goto("./examples/");

  await expect(page.locator("[data-litopis-picker].litopis")).toHaveCount(10);

  const basicCard = page.locator("#basic");
  const previewTab = basicCard.getByRole("tab", { name: "Preview" });
  const codeTab = basicCard.getByRole("tab", { name: "Code" });

  await previewTab.focus();
  await page.keyboard.press("ArrowRight");

  await expect(codeTab).toBeFocused();
  await expect(codeTab).toHaveAttribute("aria-selected", "true");
  await expect(basicCard.getByRole("tabpanel", { name: "Code" })).toBeVisible();
  await expect(basicCard.getByRole("button", { name: "Copy code" })).toBeVisible();
});

test("headless example updates core state without generating a calendar", async ({ page }) => {
  await page.goto("./examples/");

  const headlessExample = page.locator("[data-core-example]");
  const state = headlessExample.locator("[data-core-state]");
  const initialState = await state.textContent();

  await headlessExample.getByRole("button", { name: "Next week" }).click();

  await expect(state).not.toHaveText(initialState ?? "");
  await expect(headlessExample.locator(".litopis")).toHaveCount(0);
});

test("integration pages mount their real package with the shared keyboard flow", async ({
  page,
}) => {
  const integrations = [
    { label: "React date", route: "./integrations/react/" },
    { label: "Vue date", route: "./integrations/vue/" },
    { label: "Solid date", route: "./integrations/solid/" },
    { label: "Svelte date", route: "./integrations/svelte/" },
    { label: "Web Component date", route: "./integrations/web-components/" },
  ];

  for (const integration of integrations) {
    await page.goto(integration.route);

    const label = integration.label;
    const input = page.getByRole("combobox", { name: label });
    const picker = input.locator("..");

    await expect(input).toBeVisible();
    await input.focus();
    await page.keyboard.press("ArrowDown");
    await expect(picker.locator(".litopis-day-button:focus")).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(input).toBeFocused();
  }
});

test("integration index stays basic and links to independent framework guides", async ({
  page,
}) => {
  await page.goto("./integrations/");

  const integrationList = page.locator(".integration-links");
  await expect(integrationList).toHaveRole("list");

  for (const integration of ["Plain DOM", "Web Components", "React", "Vue", "Solid", "Svelte"]) {
    await expect(
      integrationList.getByRole("link", { name: integration, exact: true }),
    ).toBeVisible();
  }

  await expect(page.locator("[data-integration-demo]")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /runtimes/i })).toHaveCount(0);
});

test("keyboard users can enter, navigate, and select in the calendar grid", async ({ page }) => {
  await page.goto("./");
  const input = page.getByRole("combobox", { name: "Travel date" });

  await input.focus();
  await page.keyboard.press("ArrowDown");

  const focusedDay = page.locator(".litopis-day-button:focus");
  await expect(focusedDay).toHaveCount(1);
  await page.keyboard.press("ArrowRight");
  const selectedLabel = await focusedDay.getAttribute("aria-label");
  await page.keyboard.press("Enter");

  await expect(
    page.locator(".litopis-day[aria-selected='true'] .litopis-day-button"),
  ).toHaveAttribute("aria-label", selectedLabel ?? "");
  await expect(focusedDay).toHaveCount(1);
});

test("day focus indicator stays inside its grid cell", async ({ page }) => {
  await page.goto("./");
  const input = page.getByRole("combobox", { name: "Travel date" });

  await input.focus();
  await page.keyboard.press("ArrowDown");

  const focusedDay = page.locator(".litopis-day-button:focus");
  const geometry = await focusedDay.evaluate((button) => {
    const cell = button.closest(".litopis-day");
    const buttonRect = button.getBoundingClientRect();
    const cellRect = cell?.getBoundingClientRect();

    return {
      bottom: buttonRect.bottom,
      cellBottom: cellRect?.bottom ?? 0,
      cellLeft: cellRect?.left ?? 0,
      cellRight: cellRect?.right ?? 0,
      cellTop: cellRect?.top ?? 0,
      left: buttonRect.left,
      boxShadow: getComputedStyle(button).boxShadow,
      outlineStyle: getComputedStyle(button).outlineStyle,
      right: buttonRect.right,
      top: buttonRect.top,
    };
  });

  expect(geometry.boxShadow).toContain("inset");
  expect(geometry.outlineStyle).toBe("none");
  expect(geometry.left).toBeGreaterThanOrEqual(geometry.cellLeft);
  expect(geometry.right).toBeLessThanOrEqual(geometry.cellRight);
  expect(geometry.top).toBeGreaterThanOrEqual(geometry.cellTop);
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.cellBottom);
});

test("Escape closes the popover and restores focus to its input", async ({ page }) => {
  await page.goto("./guides/");
  const input = page.getByRole("combobox", { name: "Departure date" });

  await input.focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.locator(".litopis-day-button:focus")).toHaveCount(1);
  await page.keyboard.press("Escape");

  await expect(input).toBeFocused();
  await expect(input).toHaveAttribute("aria-expanded", "false");
});

test("comfortable targets are at least 44 by 44 CSS pixels", async ({ page }) => {
  await page.goto("./guides/");
  const input = page.getByRole("combobox", { name: "Departure date" });
  const picker = input.locator("..");

  await input.click();
  const dayButton = picker.locator(".litopis-day-button").first();
  const previousButton = picker.getByRole("button", { name: "Previous month" });

  await expect(input).toHaveCSS("height", "44px");
  await expect(dayButton).toHaveCSS("height", "44px");
  await expect(dayButton).toHaveCSS("width", "44px");
  await expect(previousButton).toHaveCSS("height", "44px");
  await expect(previousButton).toHaveCSS("width", "44px");
});

test("open popover and month selection states have no detectable violations", async ({ page }) => {
  test.setTimeout(extendedAccessibilityTimeout);

  await page.goto("./guides/");
  const input = page.getByRole("combobox", { name: "Departure date" });
  const picker = input.locator("..");

  await input.click();
  await picker.getByRole("button", { name: "Choose month and year" }).click();
  const results = await new AxeBuilder({ page }).analyze();

  expect(results.violations).toEqual([]);
});

test("the published browser bundle defines a working custom element", async ({ page }) => {
  const fixturePath = path.resolve("tests/browser/fixture.html");
  await page.goto(`/litopis/@fs${fixturePath}`);
  const bundlePath = path.resolve("packages/elements/dist/index.global.js");
  const stylesheetPath = path.resolve("packages/dom/styles/base.css");

  await page.setContent(`
    <link rel="stylesheet" href="/litopis/@fs${stylesheetPath}">
    <script src="/litopis/@fs${bundlePath}"></script>
    <litopis-date-picker label="Bundle date"></litopis-date-picker>
  `);

  await expect(page.getByRole("combobox", { name: "Bundle date" })).toBeVisible();
});

test("the daisyUI adapter consumes semantic theme variables", async ({ page }) => {
  const fixturePath = path.resolve("tests/browser/fixture.html");
  await page.goto(`/litopis/@fs${fixturePath}`);
  const bundlePath = path.resolve("packages/elements/dist/index.global.js");
  const stylesheetPath = path.resolve("packages/dom/styles/daisyui.css");

  await page.setContent(`
    <link rel="stylesheet" href="/litopis/@fs${stylesheetPath}">
    <style>
      :root {
        --border: 2px;
        --color-base-100: #fff7ed;
        --color-base-200: #ffedd5;
        --color-base-300: #fed7aa;
        --color-base-content: #431407;
        --color-error: #b91c1c;
        --color-primary: #c2410c;
        --color-primary-content: #ffffff;
        --radius-box: 24px;
        --radius-field: 10px;
      }
    </style>
    <script src="/litopis/@fs${bundlePath}"></script>
    <litopis-date-picker label="Daisy date" value="2026-07-16"></litopis-date-picker>
  `);

  const calendar = page.locator(".litopis-calendar");
  const input = page.getByRole("combobox", { name: "Daisy date" });
  const selectedDay = page.locator(".litopis-day[data-selected] .litopis-day-button");

  await expect(calendar).toHaveCSS("background-color", "rgb(255, 247, 237)");
  await expect(calendar).toHaveCSS("border-radius", "24px");
  await expect(input).toHaveCSS("border-top-width", "2px");
  await expect(selectedDay).toHaveCSS("background-color", "rgb(194, 65, 12)");
});

test("the shadcn adapter consumes semantic theme variables", async ({ page }) => {
  const fixturePath = path.resolve("tests/browser/fixture.html");
  await page.goto(`/litopis/@fs${fixturePath}`);
  const bundlePath = path.resolve("packages/elements/dist/index.global.js");
  const stylesheetPath = path.resolve("packages/dom/styles/shadcn.css");

  await page.setContent(`
    <link rel="stylesheet" href="/litopis/@fs${stylesheetPath}">
    <style>
      :root {
        --accent: #fef3c7;
        --accent-foreground: #451a03;
        --background: #fffbeb;
        --border: #fde68a;
        --destructive: #b91c1c;
        --foreground: #451a03;
        --input: #f59e0b;
        --muted: #fef3c7;
        --muted-foreground: #92400e;
        --popover: #ffffff;
        --popover-foreground: #451a03;
        --primary: #b45309;
        --primary-foreground: #ffffff;
        --radius: 12px;
        --ring: #d97706;
      }
    </style>
    <script src="/litopis/@fs${bundlePath}"></script>
    <litopis-date-picker label="Shadcn date" value="2026-07-16"></litopis-date-picker>
  `);

  const calendar = page.locator(".litopis-calendar");
  const input = page.getByRole("combobox", { name: "Shadcn date" });
  const selectedDay = page.locator(".litopis-day[data-selected] .litopis-day-button");

  await expect(calendar).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(calendar).toHaveCSS("border-radius", "12px");
  await expect(input).toHaveCSS("border-top-color", "rgb(245, 158, 11)");
  await expect(selectedDay).toHaveCSS("background-color", "rgb(180, 83, 9)");
});

test("the Bootstrap adapter follows Bootstrap color-mode variables", async ({ page }) => {
  const fixturePath = path.resolve("tests/browser/fixture.html");
  await page.goto(`/litopis/@fs${fixturePath}`);
  const bundlePath = path.resolve("packages/elements/dist/index.global.js");
  const stylesheetPath = path.resolve("packages/dom/styles/bootstrap.css");

  await page.setContent(`
    <link rel="stylesheet" href="/litopis/@fs${stylesheetPath}">
    <style>
      :root {
        --bs-body-bg: #f8f9fa;
        --bs-body-color: #212529;
        --bs-body-font-family: system-ui;
        --bs-body-font-size: 16px;
        --bs-border-color: #dee2e6;
        --bs-border-radius: 6px;
        --bs-border-radius-lg: 8px;
        --bs-border-width: 2px;
        --bs-box-shadow: 0 8px 16px rgb(0 0 0 / 15%);
        --bs-danger: #dc3545;
        --bs-focus-ring-color: rgb(13 110 253 / 25%);
        --bs-primary: #0d6efd;
        --bs-secondary-color: rgb(33 37 41 / 75%);
        --bs-tertiary-bg: #f8f9fa;
        --bs-tertiary-color: rgb(33 37 41 / 50%);
        --bs-white: #ffffff;
      }
    </style>
    <script src="/litopis/@fs${bundlePath}"></script>
    <litopis-date-picker label="Bootstrap date" value="2026-07-16"></litopis-date-picker>
  `);

  const calendar = page.locator(".litopis-calendar");
  const input = page.getByRole("combobox", { name: "Bootstrap date" });
  const selectedDay = page.locator(".litopis-day[data-selected] .litopis-day-button");

  await expect(calendar).toHaveCSS("border-radius", "8px");
  await expect(input).toHaveCSS("border-top-width", "2px");
  await expect(input).toHaveCSS("border-top-color", "rgb(222, 226, 230)");
  await expect(selectedDay).toHaveCSS("background-color", "rgb(13, 110, 253)");
});
