import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import path from "node:path";

function formatDottedDate(value: string): string {
  return value.split("-").reverse().join(".");
}

const documentationPages = [
  "./",
  "./examples/",
  "./guides/",
  "./integrations/",
  "./integrations/daisyui/",
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

test("documentation uses one expanded navigation tree for integrations", async ({ page }) => {
  await page.goto("./");

  const sidebar = page.getByRole("navigation", { name: "Documentation navigation" });
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toHaveCount(0);

  for (const integration of ["Plain DOM", "Web Components", "React", "Vue", "Solid", "Svelte"]) {
    await expect(sidebar.getByRole("link", { name: integration, exact: true })).toBeVisible();
  }

  await page.goto("./integrations/react/");
  await expect(
    page
      .getByRole("navigation", { name: "Documentation navigation" })
      .getByRole("link", { name: "React", exact: true }),
  ).toHaveAttribute("aria-current", "page");
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

  await expect(page.locator(".example-preview .litopis")).toHaveCount(14);

  const basicCard = page.locator("#basic");
  const previewTab = basicCard.getByRole("tab", { name: "Preview" });
  const codeTab = basicCard.getByRole("tab", { name: "Code" });

  await previewTab.focus();
  await page.keyboard.press("ArrowRight");

  await expect(codeTab).toBeFocused();
  await expect(codeTab).toHaveAttribute("aria-selected", "true");
  await expect(basicCard.getByRole("tabpanel", { name: "Code" })).toBeVisible();
  await expect(basicCard.getByRole("button", { name: "Copy code" })).toHaveCount(2);
  await expect(basicCard.locator("[data-source-code]")).toContainText(
    'import { createDatePicker } from "@litopis/dom"',
  );
});

test("headless example updates core state without generating a calendar", async ({ page }) => {
  await page.goto("./examples/");

  const headlessExample = page.locator("#headless");
  const state = headlessExample.locator("#headless-state");
  const initialState = await state.textContent();

  await headlessExample.getByRole("button", { name: "Next week" }).click();

  await expect(state).not.toHaveText(initialState ?? "");
  await expect(headlessExample.locator(".litopis")).toHaveCount(0);
});

test("range recipe submits ISO endpoints and replaces unavailable date snapshots", async ({
  page,
}) => {
  await page.goto("./examples/");
  const range = page.locator("#range");
  await range.getByRole("combobox", { name: "Departure", exact: true }).fill("2026-06-12");
  await range.getByRole("combobox", { name: "Return", exact: true }).fill("2026-06-18");
  await range.getByRole("button", { name: "Read submitted dates" }).click();
  await expect(range.locator("#range-value")).toContainText("2026-06-12");
  await expect(range.locator("#range-value")).toContainText("2026-06-18");

  const availability = page.locator("#disabled-dates");
  const unavailableDates = await availability.locator("#disabled-dates-list").textContent();
  await availability.getByRole("button", { name: "Block a second date" }).click();
  await expect(availability.locator("#disabled-dates-list")).not.toHaveText(unavailableDates ?? "");
  await expect(availability.getByRole("combobox", { name: "Arrival date" })).toBeVisible();
  await availability.getByRole("button", { name: "Use one unavailable date" }).click();
  await expect(availability.locator("#disabled-dates-list")).toHaveText(unavailableDates ?? "");
});

test("example Markdown contains the same complete source as its preview", async ({
  page,
  request,
}) => {
  await page.goto("./examples/");
  const cards = page.locator("article.example-card");
  await expect(cards).toHaveCount(11);

  for (const card of await cards.all()) {
    const id = await card.getAttribute("id");
    const response = await request.get(`./examples/${id}.md`);
    expect(response.ok(), `${id} Markdown should resolve`).toBe(true);
    const markdown = await response.text();
    const source = await card.locator("[data-source-code]").textContent();
    expect(source?.trim()).toBeTruthy();
    expect(markdown).toContain(source!.trim());
    expect(markdown).toContain("npm install @litopis/");
  }

  const index = await request.get("./llms.txt");
  expect(await index.text()).toContain("/litopis/examples/range.md");
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

test("styling playground keeps one inline calendar while themes change", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("./styling/");
  const playground = page.locator("[data-theme-playground]");
  const input = playground.getByRole("combobox", { name: "Inline calendar preview" });
  const selectedDay = playground.locator(".litopis-day[data-selected] .litopis-day-button");

  await expect(input).toBeVisible();
  await expect(playground.locator(".litopis")).toHaveAttribute("data-mode", "inline");
  await expect(playground.locator(".litopis-calendar")).toBeVisible();
  await expect(selectedDay).toHaveCSS("background-color", "rgb(15, 118, 110)");

  await playground.getByRole("tab", { name: "Bootstrap" }).click();
  await expect(playground).toHaveAttribute("data-style-theme", "bootstrap");
  await expect(playground.getByRole("tabpanel")).toContainText("@litopis/dom/styles/bootstrap.css");
  await expect(selectedDay).toHaveCSS("background-color", "rgb(13, 110, 253)");

  await playground.getByRole("tab", { name: "Bootstrap" }).press("Home");
  await expect(playground.getByRole("tab", { name: "Foundation" })).toBeFocused();
  await expect(playground).toHaveAttribute("data-style-theme", "foundation");

  await playground.getByRole("tab", { name: "shadcn", exact: true }).click();
  await expect(selectedDay).toHaveCSS("background-color", "rgb(24, 24, 27)");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(input).toBeVisible();
});

test("daisyUI recipe submits ISO form values and inherits the page theme", async ({ page }) => {
  await page.goto("./integrations/daisyui/");
  const demo = page.locator("[data-daisyui-demo]");
  const output = demo.locator("[data-daisyui-value]");
  const lightBackground = await demo.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );

  await demo.getByRole("button", { name: "Read form value" }).click();
  await expect(output).toHaveText("No date selected");
  await demo.getByRole("combobox", { name: "Appointment date" }).fill("2026-06-25");
  await demo.getByRole("combobox", { name: "Appointment date" }).press("Escape");
  await demo.getByRole("button", { name: "Read form value" }).click();
  await expect(output).toHaveText("2026-06-25");

  await expect(demo).not.toHaveAttribute("data-theme");
  await expect(demo.getByRole("combobox", { name: "Theme", exact: true })).toHaveCount(0);
  await page.locator("html").evaluate((element) => element.setAttribute("data-theme", "business"));
  await expect(demo).not.toHaveCSS("background-color", lightBackground);
  await expect(output).toHaveText("2026-06-25");

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("daisyUI preserves caller input styles across themes and states", async ({ page }) => {
  await page.goto("./integrations/daisyui/");
  const native = page.getByRole("textbox", { name: "daisyUI input", exact: true });
  const picker = page.getByRole("combobox", { name: "Appointment date", exact: true });
  await expect(picker).toHaveAttribute("slot", "input");
  await expect(picker).toHaveAttribute("class", "input");
  const properties = [
    "height",
    "width",
    "font-size",
    "font-family",
    "font-weight",
    "line-height",
    "font-variant-numeric",
    "background-color",
    "color",
    "border-top-width",
    "border-top-color",
    "border-top-left-radius",
    "padding-top",
    "padding-right",
    "padding-bottom",
    "padding-left",
    "box-shadow",
    "transition-duration",
    "touch-action",
    "cursor",
  ];
  const focusProperties = [...properties, "outline-color", "outline-width", "outline-offset"];
  const classes = ["input", "input input-sm", "input input-lg", "input input-error"];

  async function getStyles(
    input: typeof native,
    styleProperties: ReadonlyArray<string>,
  ): Promise<Record<string, string>> {
    return input.evaluate(
      async (element, properties) => {
        await Promise.all(element.getAnimations().map((animation) => animation.finished));
        const styles = getComputedStyle(element);
        return Object.fromEntries(
          properties.map((property) => [property, styles.getPropertyValue(property)]),
        );
      },
      [...styleProperties],
    );
  }

  for (const className of classes) {
    await native.evaluate((element, value) => {
      element.setAttribute("class", value);
    }, className);
    await picker.evaluate((element, value) => {
      element.setAttribute("class", value);
    }, className);
    await expect(picker).toHaveAttribute("class", className);

    for (const theme of ["corporate", "business"]) {
      await page.locator("html").evaluate((element, value) => {
        element.setAttribute("data-theme", value);
      }, theme);

      await native.blur();
      await picker.blur();
      expect(await getStyles(picker, properties)).toEqual(await getStyles(native, properties));

      await native.focus();
      const nativeFocus = await getStyles(native, focusProperties);
      await picker.focus();
      expect(await getStyles(picker, focusProperties)).toEqual(nativeFocus);
      await page.keyboard.press("Escape");

      await native.evaluate((element) => {
        element.setAttribute("disabled", "");
      });
      await picker.evaluate((element) => {
        element.setAttribute("disabled", "");
      });
      expect(await getStyles(picker, properties)).toEqual(await getStyles(native, properties));
      await native.evaluate((element) => {
        element.removeAttribute("disabled");
      });
      await picker.evaluate((element) => {
        element.removeAttribute("disabled");
      });
    }
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

test("default homepage popover opens on click and closes after keyboard selection", async ({
  page,
}) => {
  await page.goto("./");
  const input = page.getByRole("combobox", { name: "Travel date" });
  const picker = page.locator("[data-playground] .litopis");

  await expect(picker).toHaveAttribute("data-mode", "popover");
  await expect(input).toHaveAttribute("slot", "input");
  await expect(input).toHaveAttribute("class", "input w-full");
  await input.click();
  await expect(picker).toHaveAttribute("data-calendar-open", "true");
  await page.keyboard.press("ArrowDown");

  const focusedDay = page.locator(".litopis-day-button:focus");
  await expect(focusedDay).toHaveCount(1);
  await page.keyboard.press("ArrowRight");
  const selectedLabel = await focusedDay.getAttribute("aria-label");
  await page.keyboard.press("Enter");

  await expect(
    page.locator(".litopis-day[aria-selected='true'] .litopis-day-button"),
  ).toHaveAttribute("aria-label", selectedLabel ?? "");
  await expect(picker).toHaveAttribute("data-calendar-open", "false");
});

test("homepage playground mounts one responsive range calendar and updates native endpoint values", async ({
  page,
}) => {
  await page.goto("./");
  const playground = page.locator("[data-playground]");
  await playground.locator("[data-playground-advanced] > summary").click();

  await playground.locator("[data-playground-selection]").selectOption("range");
  await playground.locator("[data-playground-layout]").selectOption("split");
  await playground.locator("[data-playground-panels]").selectOption("2");
  await playground.locator("[data-playground-calendar]").selectOption("inline");

  const code = playground.locator("[data-playground-code]");
  await expect(code).toContainText('import { createDatePicker } from "@litopis/dom"');
  await expect(code).toContainText('import "@litopis/dom/styles/daisyui.css"');
  await expect(code).toContainText("panels: 2,");
  await expect(code).not.toContainText('panels: "2"');
  await expect(playground.locator(".litopis")).toHaveAttribute("data-mode", "inline");
  await expect(playground.locator(".litopis-calendar")).toHaveCount(1);
  await expect(playground.getByRole("combobox", { name: "From" })).toBeVisible();
  await expect(playground.getByRole("combobox", { name: "To" })).toBeVisible();
  await expect(playground.locator(".litopis-grid")).toHaveCount(2);

  const from = playground.getByRole("combobox", { name: "From" });
  const to = playground.getByRole("combobox", { name: "To" });
  await from.fill("12.06.2026");
  await to.fill("18.06.2026");

  await expect(playground.locator("input[type='hidden'][name='from']")).toHaveValue("2026-06-12");
  await expect(playground.locator("input[type='hidden'][name='to']")).toHaveValue("2026-06-18");
  await expect(playground.locator(".litopis-day[data-in-range]")).toHaveCount(7);
  await expect(playground.locator("[data-playground-value]")).toContainText("from=2026-06-12");
  await expect(playground.locator("[data-playground-value]")).toContainText("to=2026-06-18");
});

test("split range fields complete from one open calendar", async ({ page }) => {
  await page.goto("./");
  const playground = page.locator("[data-playground]");
  await playground.locator("[data-playground-advanced] > summary").click();

  await playground.locator("[data-playground-selection]").selectOption("range");
  await playground.locator("[data-playground-layout]").selectOption("split");
  await playground.locator("[data-playground-calendar]").selectOption("popover");

  const from = playground.getByRole("combobox", { name: "From" });
  const to = playground.getByRole("combobox", { name: "To" });
  await from.click();
  const primaryGrid = playground.locator(".litopis-grid:not(.litopis-grid-secondary)");
  const startCell = primaryGrid
    .locator(".litopis-day:not([data-outside-month])[data-iso-date$='-12']")
    .first();
  const endCell = primaryGrid
    .locator(".litopis-day:not([data-outside-month])[data-iso-date$='-18']")
    .first();
  const startIso = await startCell.getAttribute("data-iso-date");
  const endIso = await endCell.getAttribute("data-iso-date");

  expect(startIso).not.toBeNull();
  expect(endIso).not.toBeNull();
  await startCell.getByRole("button").click();

  await expect(from).toHaveValue(startIso!.split("-").reverse().join("."));
  await expect(to).toHaveValue("");
  await expect(playground.locator(".litopis")).toHaveAttribute("data-calendar-open", "true");
  await expect(playground.locator(".litopis")).toHaveAttribute("data-range-complete", "false");
  const pendingRangeContent = await startCell.evaluate(
    (cell) => getComputedStyle(cell, "::before").content,
  );
  expect(pendingRangeContent).toBe("none");

  await endCell.getByRole("button").click();

  await expect(from).toHaveValue(startIso!.split("-").reverse().join("."));
  await expect(to).toHaveValue(endIso!.split("-").reverse().join("."));
  await expect(playground.locator(".litopis")).toHaveAttribute("data-calendar-open", "false");
  await expect(playground.locator(".litopis")).toHaveAttribute("data-range-complete", "true");
});

test("playground can keep its popover open and clear the selected range", async ({ page }) => {
  await page.goto("./");
  const playground = page.locator("[data-playground]");
  await playground.locator("[data-playground-advanced] > summary").click();

  await playground.locator("[data-playground-selection]").selectOption("range");
  await playground.locator("[data-playground-layout]").selectOption("split");
  await playground.locator("[data-playground-calendar]").selectOption("popover");
  await playground.locator("[data-playground-close-on-select]").uncheck();
  await playground.getByRole("combobox", { name: "From" }).click();
  const primaryGrid = playground.locator(".litopis-grid:not(.litopis-grid-secondary)");
  await primaryGrid
    .locator(".litopis-day:not([data-outside-month])[data-iso-date$='-12'] button")
    .click();
  await primaryGrid
    .locator(".litopis-day:not([data-outside-month])[data-iso-date$='-18'] button")
    .click();

  await expect(playground.locator(".litopis")).toHaveAttribute("data-calendar-open", "true");
  const clearButton = playground.getByRole("button", { name: "Clear" });
  const clearButtonBounds = await clearButton.evaluate((button) => {
    const rect = button.getBoundingClientRect();

    return { bottom: rect.bottom, top: rect.top, viewportHeight: window.innerHeight };
  });

  expect(clearButtonBounds.top).toBeGreaterThanOrEqual(0);
  expect(clearButtonBounds.bottom).toBeLessThanOrEqual(clearButtonBounds.viewportHeight);
  await clearButton.click();

  await expect(playground.getByRole("combobox", { name: "From" })).toHaveValue("");
  await expect(playground.getByRole("combobox", { name: "To" })).toHaveValue("");
  await expect(playground.locator(".litopis")).toHaveAttribute("data-range-complete", "false");
});

test("playground can hide the optional clear action", async ({ page }) => {
  await page.goto("/");
  const playground = page.locator("[data-playground]");
  await playground.locator("[data-playground-advanced] > summary").click();

  await playground.locator("[data-playground-clear-button]").uncheck();

  await expect(playground.getByRole("button", { name: "Clear" })).toBeHidden();
  await expect(playground.locator("[data-playground-code]")).toContainText("clearButton: false");
});

test("playground keeps the clear action reachable in a short viewport", async ({ page }) => {
  await page.setViewportSize({ height: 360, width: 1280 });
  await page.goto("./");
  const playground = page.locator("[data-playground]");
  await playground.locator("[data-playground-advanced] > summary").click();
  await playground.locator("[data-playground-selection]").selectOption("range");
  await playground.locator("[data-playground-layout]").selectOption("split");
  await playground.locator("[data-playground-calendar]").selectOption("popover");
  await playground.locator("[data-playground-close-on-select]").uncheck();
  await playground.getByRole("combobox", { name: "From" }).click();

  const primaryGrid = playground.locator(".litopis-grid:not(.litopis-grid-secondary)");
  await primaryGrid
    .locator(".litopis-day:not([data-outside-month])[data-iso-date$='-12'] button")
    .click();
  await primaryGrid
    .locator(".litopis-day:not([data-outside-month])[data-iso-date$='-18'] button")
    .click();

  const calendar = playground.locator(".litopis-calendar");
  const dimensions = await calendar.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
  }));

  expect(dimensions.clientHeight).toBeLessThan(dimensions.scrollHeight);

  await playground.getByRole("button", { name: "Clear" }).click();

  await expect(playground.getByRole("combobox", { name: "From" })).toHaveValue("");
  await expect(playground.getByRole("combobox", { name: "To" })).toHaveValue("");
  await expect(playground.locator(".litopis")).toHaveAttribute("data-range-complete", "false");
});

test("an open popover stays reachable after the viewport shrinks", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1280 });
  await page.goto("./");
  const playground = page.locator("[data-playground]");
  await playground.locator("[data-playground-advanced] > summary").click();
  await playground.locator("[data-playground-selection]").selectOption("range");
  await playground.locator("[data-playground-layout]").selectOption("split");
  await playground.locator("[data-playground-calendar]").selectOption("popover");
  await playground.locator("[data-playground-close-on-select]").uncheck();
  await playground.getByRole("combobox", { name: "From" }).click();

  const primaryGrid = playground.locator(".litopis-grid:not(.litopis-grid-secondary)");
  await primaryGrid
    .locator(".litopis-day:not([data-outside-month])[data-iso-date$='-12'] button")
    .click();
  await primaryGrid
    .locator(".litopis-day:not([data-outside-month])[data-iso-date$='-18'] button")
    .click();

  const calendar = playground.locator(".litopis-calendar");
  const initialBounds = await calendar.evaluate((element) => {
    const rect = element.getBoundingClientRect();

    return { bottom: rect.bottom, top: rect.top, viewportHeight: window.innerHeight };
  });

  expect(initialBounds.top).toBeGreaterThanOrEqual(0);
  expect(initialBounds.bottom).toBeLessThanOrEqual(initialBounds.viewportHeight);

  await page.setViewportSize({ height: 300, width: 1280 });

  await expect
    .poll(async () =>
      calendar.evaluate((element) => {
        const rect = element.getBoundingClientRect();

        return rect.top >= 0 && rect.bottom <= window.innerHeight;
      }),
    )
    .toBe(true);

  const resizedBounds = await calendar.evaluate((element) => {
    const rect = element.getBoundingClientRect();

    return { bottom: rect.bottom, top: rect.top, viewportHeight: window.innerHeight };
  });

  expect(resizedBounds.top).toBeGreaterThanOrEqual(0);
  expect(resizedBounds.bottom).toBeLessThanOrEqual(resizedBounds.viewportHeight);

  await playground.getByRole("button", { name: "Clear" }).click();

  await expect(playground.getByRole("combobox", { name: "From" })).toHaveValue("");
  await expect(playground.getByRole("combobox", { name: "To" })).toHaveValue("");
  await expect(playground.locator(".litopis")).toHaveAttribute("data-range-complete", "false");
});

test("playground uses the browser locale in auto mode and exposes calendar settings", async ({
  page,
}) => {
  await page.goto("./");
  const playground = page.locator("[data-playground]");
  await playground.locator("[data-playground-advanced] > summary").click();
  await playground.locator("[data-playground-calendar]").selectOption("inline");
  const locale = playground.locator("[data-playground-locale]");
  const caption = playground.locator(".litopis-caption-label");
  const todayIso = await playground
    .locator(".litopis-day[data-today]")
    .first()
    .getAttribute("data-iso-date");

  expect(todayIso).not.toBeNull();
  const browserCaption = await page.evaluate(
    (isoDate) =>
      new Intl.DateTimeFormat(navigator.language, { month: "long", year: "numeric" }).format(
        new Date(`${isoDate}T12:00:00`),
      ),
    todayIso!,
  );
  const englishCaption = await page.evaluate(
    (isoDate) =>
      new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
        new Date(`${isoDate}T12:00:00`),
      ),
    todayIso!,
  );

  await expect(locale).toHaveValue("auto");
  await expect(caption).toHaveText(browserCaption);

  await locale.selectOption("en-US");
  await expect(caption).toHaveText(englishCaption);

  await locale.selectOption("auto");
  await playground.locator("[data-playground-first-day]").selectOption("0");
  await playground.locator("[data-playground-size]").selectOption("comfortable");
  await playground.locator("[data-playground-outside-days]").uncheck();
  await playground.locator("[data-playground-season]").check();

  await expect(caption).toHaveText(browserCaption);
  await expect(playground.locator(".litopis")).toHaveAttribute("data-size", "comfortable");
  await expect(playground.locator(".litopis-day[data-outside-month]")).toHaveCount(0);
  await expect(playground.locator(".litopis-season")).toBeVisible();
  await expect(playground.locator("[data-playground-code]")).toContainText("firstDayOfWeek: 0");
});

test("homepage playground masks a single range field and keeps its keyboard contract", async ({
  page,
}) => {
  await page.goto("./");
  const playground = page.locator("[data-playground]");
  await playground.locator("[data-playground-advanced] > summary").click();
  await playground.locator("[data-playground-selection]").selectOption("range");
  await playground.locator("[data-playground-layout]").selectOption("single");
  const input = playground.getByRole("combobox", { name: "Travel date" });
  const picker = playground.locator(".litopis");

  await input.fill("1206202618062026");
  await expect(input).toHaveValue("12.06.2026 – 18.06.2026");
  await input.focus();
  await page.keyboard.press("ArrowDown");
  await expect(picker).toHaveAttribute("data-mode", "popover");
  await expect(picker).toHaveAttribute("data-calendar-open", "true");
  await expect(playground.locator(".litopis-day-button:focus")).toHaveCount(1);
});

test("responsive range panels use available width without squeezing the month grids", async ({
  page,
}) => {
  await page.goto("./");
  const playground = page.locator("[data-playground]");
  await playground.locator("[data-playground-advanced] > summary").click();
  await playground.locator("[data-playground-selection]").selectOption("range");
  await playground.locator("[data-playground-calendar]").selectOption("inline");

  await expect(playground.locator(".litopis-grid:visible")).toHaveCount(2);
  await page.setViewportSize({ height: 844, width: 390 });
  await expect(playground.locator(".litopis-grid:visible")).toHaveCount(1);
  const grid = playground.locator(".litopis-grid:visible");
  await expect(grid.locator(".litopis-day-button").first()).toHaveCSS("width", "40px");
  expect(await grid.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
});

test("comfortable popup fits a narrow viewport without clipping the week", async ({ page }) => {
  const fixturePath = path.resolve("tests/browser/fixture.html");
  const bundlePath = path.resolve("packages/elements/dist/index.global.js");
  const stylesheetPath = path.resolve("packages/dom/styles/base.css");
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto(`/litopis/@fs${fixturePath}`);
  await page.setContent(`
    <link rel="stylesheet" href="/litopis/@fs${stylesheetPath}">
    <script src="/litopis/@fs${bundlePath}"></script>
    <litopis-date-picker label="Date" mode="popover" size="comfortable"></litopis-date-picker>
  `);
  await page.getByRole("combobox", { name: "Date" }).click();
  const grid = page.locator(".litopis-grid:visible");
  expect(await grid.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  const day = grid.locator(".litopis-day-button").first();
  await expect(day).toHaveCSS("width", "40px");
  await expect(day).toHaveCSS("height", "40px");
});

test("a narrow inline container reduces padding before the day size", async ({ page }) => {
  const fixturePath = path.resolve("tests/browser/fixture.html");
  const bundlePath = path.resolve("packages/elements/dist/index.global.js");
  const stylesheetPath = path.resolve("packages/dom/styles/base.css");
  await page.setViewportSize({ width: 900, height: 844 });
  await page.goto(`/litopis/@fs${fixturePath}`);
  await page.setContent(`
    <link rel="stylesheet" href="/litopis/@fs${stylesheetPath}">
    <script src="/litopis/@fs${bundlePath}"></script>
    <litopis-date-picker label="Date" mode="inline" size="comfortable" style="width: 296px"></litopis-date-picker>
  `);
  const calendar = page.locator(".litopis-calendar");
  await expect(calendar).toHaveCSS("padding-left", "8px");
  await expect(calendar.locator(".litopis-day-button").first()).toHaveCSS("width", "40px");
});

test("two comfortable months reduce their gap before shrinking days", async ({ page }) => {
  const fixturePath = path.resolve("tests/browser/fixture.html");
  const bundlePath = path.resolve("packages/elements/dist/index.global.js");
  const stylesheetPath = path.resolve("packages/dom/styles/base.css");
  await page.setViewportSize({ width: 900, height: 844 });
  await page.goto(`/litopis/@fs${fixturePath}`);
  await page.setContent(`
    <link rel="stylesheet" href="/litopis/@fs${stylesheetPath}">
    <script src="/litopis/@fs${bundlePath}"></script>
    <litopis-date-picker label="Dates" mode="inline" selection="range" panels="2" size="comfortable" style="width: 640px"></litopis-date-picker>
  `);
  const grids = page.locator(".litopis-grid:visible");
  await expect(grids).toHaveCount(2);
  for (const grid of await grids.all()) {
    await expect(grid.locator(".litopis-day-button").first()).toHaveCSS("width", "44px");
    expect(await grid.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  }
});

test("inline range picker fills its container for either panel count", async ({ page }) => {
  await page.goto("./");
  const playground = page.locator("[data-playground]");
  await playground.locator("[data-playground-advanced] > summary").click();
  const picker = playground.locator(".litopis");

  await playground.locator("[data-playground-selection]").selectOption("range");
  await playground.locator("[data-playground-panels]").selectOption("1");
  await playground.locator("[data-playground-calendar]").selectOption("inline");
  const onePanel = await picker.evaluate((element) => ({
    width: element.getBoundingClientRect().width,
    parentWidth: element.parentElement
      ? element.parentElement.clientWidth -
        Number.parseFloat(getComputedStyle(element.parentElement).paddingLeft) -
        Number.parseFloat(getComputedStyle(element.parentElement).paddingRight)
      : 0,
    resolvedPanels: element.dataset.resolvedPanels,
  }));

  await playground.locator("[data-playground-panels]").selectOption("2");
  const twoPanels = await picker.evaluate((element) => ({
    width: element.getBoundingClientRect().width,
    parentWidth: element.parentElement
      ? element.parentElement.clientWidth -
        Number.parseFloat(getComputedStyle(element.parentElement).paddingLeft) -
        Number.parseFloat(getComputedStyle(element.parentElement).paddingRight)
      : 0,
    resolvedPanels: element.dataset.resolvedPanels,
  }));

  expect(onePanel.resolvedPanels).toBe("1");
  expect(twoPanels.resolvedPanels).toBe("2");
  expect(onePanel.width).toBeGreaterThan(360);
  expect(Math.abs(onePanel.width - onePanel.parentWidth)).toBeLessThan(1);
  expect(Math.abs(twoPanels.width - twoPanels.parentWidth)).toBeLessThan(1);
  expect(Math.abs(twoPanels.width - onePanel.width)).toBeLessThan(1);
});

test("range highlights start and end at the center of their buttons", async ({ page }) => {
  await page.goto("./");
  const playground = page.locator("[data-playground]");

  await playground.locator("[data-playground-advanced] > summary").click();
  await playground.locator("[data-playground-selection]").selectOption("range");
  await playground.locator("[data-playground-calendar]").selectOption("inline");
  await playground.getByRole("combobox", { name: "Travel date" }).fill("08.07.2026 – 18.07.2026");

  const week = playground.locator(".litopis-week").filter({
    has: page.locator('.litopis-day[data-iso-date="2026-07-08"]'),
  });
  const start = (await week.locator(".litopis-day").first().getAttribute("data-iso-date"))!;
  const end = (await week.locator(".litopis-day").last().getAttribute("data-iso-date"))!;
  await playground
    .getByRole("combobox", { name: "Travel date" })
    .fill(`${formatDottedDate(start)} – ${formatDottedDate(end)}`);

  const endpointGeometry = await playground
    .locator(".litopis-day[data-range-start], .litopis-day[data-range-end]")
    .evaluateAll((cells) =>
      cells.map((cell) => {
        const button = cell.querySelector("button");
        const cellRect = cell.getBoundingClientRect();
        const buttonRect = button?.getBoundingClientRect();

        return {
          bottom: buttonRect?.bottom ?? 0,
          cellBottom: cellRect.bottom,
          cellLeft: cellRect.left,
          cellRight: cellRect.right,
          cellTop: cellRect.top,
          left: buttonRect?.left ?? 0,
          isStart: cell.hasAttribute("data-range-start"),
          pseudoStart: Number.parseFloat(getComputedStyle(cell, "::before").insetInlineStart),
          pseudoEnd: Number.parseFloat(getComputedStyle(cell, "::before").insetInlineEnd),
          right: buttonRect?.right ?? 0,
          top: buttonRect?.top ?? 0,
        };
      }),
    );

  expect(endpointGeometry).toHaveLength(2);
  for (const endpoint of endpointGeometry) {
    const buttonCenter = (endpoint.left + endpoint.right) / 2;
    const highlightCenter = endpoint.isStart
      ? endpoint.cellLeft + endpoint.pseudoStart
      : endpoint.cellRight - endpoint.pseudoEnd;
    expect(highlightCenter).toBeCloseTo(buttonCenter, 0);
    expect(endpoint.left).toBeGreaterThanOrEqual(endpoint.cellLeft - 0.01);
    expect(endpoint.right).toBeLessThanOrEqual(endpoint.cellRight + 0.01);
    expect(endpoint.top).toBeGreaterThanOrEqual(endpoint.cellTop);
    expect(endpoint.bottom).toBeLessThanOrEqual(endpoint.cellBottom);
  }
});

test("calendar edge buttons have equal insets and align with weekdays", async ({ page }) => {
  const fixturePath = path.resolve("tests/browser/fixture.html");
  const bundlePath = path.resolve("packages/elements/dist/index.global.js");
  const stylesheetPath = path.resolve("packages/dom/styles/base.css");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/litopis/@fs${fixturePath}`);
  await page.setContent(`
    <link rel="stylesheet" href="/litopis/@fs${stylesheetPath}">
    <script src="/litopis/@fs${bundlePath}"></script>
    <litopis-date-picker label="Date" mode="inline"></litopis-date-picker>
  `);

  const picker = page.locator("litopis-date-picker");
  for (const direction of ["ltr", "rtl"]) {
    await page
      .locator("html")
      .evaluate((element, value) => element.setAttribute("dir", value), direction);
    for (const width of [320, 360]) {
      await picker.evaluate((element, value) => (element.style.width = `${value}px`), width);
      const geometry = await picker.evaluate((root) => {
        const calendar = root.querySelector<HTMLElement>(".litopis-calendar")!;
        const navigation = [...calendar.querySelectorAll<HTMLElement>(".litopis-nav-button")];
        const weekdays = [...calendar.querySelectorAll<HTMLElement>(".litopis-weekday")];
        const weeks = [
          ...calendar.querySelectorAll<HTMLElement>(".litopis-week:not(.litopis-weekdays)"),
        ];
        const buttons = [...weeks[0]!.querySelectorAll<HTMLElement>(".litopis-day-button")];
        const bounds = calendar.getBoundingClientRect();
        const nav = navigation
          .map((element) => element.getBoundingClientRect())
          .sort((a, b) => a.left - b.left);
        const days = [buttons[0]!, buttons.at(-1)!]
          .map((element) => element.getBoundingClientRect())
          .sort((a, b) => a.left - b.left);
        const labels = [weekdays[0]!, weekdays.at(-1)!]
          .map((element) => element.getBoundingClientRect())
          .sort((a, b) => a.left - b.left);
        return {
          top: nav[0]!.top - bounds.top,
          bottom: bounds.bottom - weeks.at(-1)!.getBoundingClientRect().bottom,
          navLeft: nav[0]!.left - bounds.left,
          navRight: bounds.right - nav[1]!.right,
          dayLeft: days[0]!.left - bounds.left,
          dayRight: bounds.right - days[1]!.right,
          leftCenters:
            labels[0]!.left + labels[0]!.width / 2 - (days[0]!.left + days[0]!.width / 2),
          rightCenters:
            labels[1]!.left + labels[1]!.width / 2 - (days[1]!.left + days[1]!.width / 2),
          navWidth: nav[0]!.width,
          dayWidth: days[0]!.width,
          dayHeight: days[0]!.height,
        };
      });
      for (const inset of [
        geometry.bottom,
        geometry.navLeft,
        geometry.navRight,
        geometry.dayLeft,
        geometry.dayRight,
      ]) {
        expect(inset).toBeCloseTo(geometry.top, 0);
      }
      expect(geometry.leftCenters).toBeCloseTo(0, 0);
      expect(geometry.rightCenters).toBeCloseTo(0, 0);
      expect(geometry.dayWidth).toBeCloseTo(geometry.navWidth, 0);
      expect(geometry.dayHeight).toBeCloseTo(geometry.navWidth, 0);
    }
  }
});

test("pointer selection does not scroll the document", async ({ page }) => {
  await page.setViewportSize({ height: 300, width: 1280 });
  await page.goto("./");
  const playground = page.locator("[data-playground]");
  await playground.locator("[data-playground-advanced] > summary").click();
  await playground.locator("[data-playground-calendar]").selectOption("inline");

  const scrollPosition = await page.evaluate(() => {
    window.scrollTo(0, 0);
    const dayButton = document.querySelector<HTMLButtonElement>(
      "[data-playground] .litopis-day-button",
    );
    dayButton?.click();
    return window.scrollY;
  });

  expect(scrollPosition).toBe(0);
});

test("day focus indicator stays inside its grid cell", async ({ page }) => {
  await page.goto("./");
  const picker = page.locator("[data-playground] .litopis");
  const input = page.getByRole("combobox", { name: "Travel date" });

  await expect(picker).toHaveAttribute("data-mode", "popover");
  await input.focus();
  await page.keyboard.press("ArrowDown");
  await expect(picker).toHaveAttribute("data-calendar-open", "true");

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
  await page.goto("./styling/");
  const input = page.getByRole("combobox", { name: "Departure date" });

  await input.focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.locator(".litopis-day-button:focus")).toHaveCount(1);
  await page.keyboard.press("Escape");

  await expect(input).toBeFocused();
  await expect(input).toHaveAttribute("aria-expanded", "false");
});

test("comfortable targets are at least 44 by 44 CSS pixels", async ({ page }) => {
  await page.goto("./styling/");
  const picker = page.locator("[data-litopis-picker='popover']");
  const input = picker.getByRole("combobox", { name: "Departure date" });

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

  await page.goto("./styling/");
  const picker = page.locator("[data-litopis-picker='popover']");
  const input = picker.getByRole("combobox", { name: "Departure date" });

  await input.click();
  const caption = picker.locator(".litopis-caption");
  const visibleCaption = await picker.locator(".litopis-caption-label").textContent();
  await expect(caption).toHaveAccessibleName(new RegExp(visibleCaption ?? "^$"));
  await expect(caption).toHaveAccessibleDescription("Choose month and year");
  await caption.click();
  const results = await new AxeBuilder({ page }).analyze();

  expect(results.violations).toEqual([]);
});

test("popover fallback stays aligned when CSS anchors are unavailable", async ({ page }) => {
  const fixturePath = path.resolve("tests/browser/fixture.html");
  const bundlePath = path.resolve("packages/dom/dist/index.global.js");
  const stylesheetPath = path.resolve("packages/dom/styles/base.css");
  await page.goto(`/litopis/@fs${fixturePath}`);
  await page.setContent(`
    <link rel="stylesheet" href="/litopis/@fs${stylesheetPath}">
    <style>
      body { margin: 0; min-height: 2000px; padding: 100px; }
      #picker { width: 200px; }
    </style>
    <div id="picker"></div>
    <script src="/litopis/@fs${bundlePath}"></script>
    <script>
      LitopisDOM.createDatePicker(document.querySelector("#picker"), {
        mode: "popover",
      });
    </script>
  `);

  const input = page.getByRole("combobox", { name: "Date" });
  await input.click();

  const nativeRect = await page.locator(".litopis-calendar").boundingBox();
  await page.keyboard.press("Escape");
  await page.evaluate(() => {
    const nativeCssSupports = CSS.supports.bind(CSS);
    CSS.supports = new Proxy(nativeCssSupports, {
      apply(target, thisArgument, argumentsList) {
        if (argumentsList[0] === "top" && argumentsList[1] === "anchor(bottom)") {
          return false;
        }

        return target(...(argumentsList as Parameters<typeof CSS.supports>));
      },
    });
  });
  await input.click();

  const fallbackRect = await page.locator(".litopis-calendar").boundingBox();
  const inputRect = await input.boundingBox();
  const offsets = await page.evaluate(() => {
    const input = document.querySelector(".litopis-input");
    const calendar = document.querySelector(".litopis-calendar");
    if (!input || !calendar) {
      return null;
    }
    const inputRect = input.getBoundingClientRect();
    const calendarRect = calendar.getBoundingClientRect();

    return {
      left: calendarRect.left - inputRect.left,
      top: calendarRect.top - inputRect.bottom,
    };
  });

  expect(offsets).not.toBeNull();
  expect(nativeRect).not.toBeNull();
  expect(fallbackRect).not.toBeNull();
  expect(inputRect).not.toBeNull();
  expect(Math.abs(offsets!.left)).toBeLessThan(1);
  expect(Math.abs(offsets!.top - 8)).toBeLessThan(1);
  expect(Math.abs(fallbackRect!.x - nativeRect!.x)).toBeLessThan(1);
  expect(Math.abs(fallbackRect!.y - nativeRect!.y)).toBeLessThan(1);
  expect(Math.abs(fallbackRect!.width - nativeRect!.width)).toBeLessThan(1);
  expect(inputRect!.width).toBe(200);
  expect(fallbackRect!.width).toBe(360);
});

test("popover fallback matches native dismiss behavior without the Popover API", async ({
  page,
}) => {
  const fixturePath = path.resolve("tests/browser/fixture.html");
  const bundlePath = path.resolve("packages/dom/dist/index.global.js");
  const stylesheetPath = path.resolve("packages/dom/styles/base.css");
  await page.goto(`/litopis/@fs${fixturePath}`);
  await page.setContent(`
    <link rel="stylesheet" href="/litopis/@fs${stylesheetPath}">
    <style>
      body { margin: 0; min-height: 2000px; padding: 100px; }
      #picker { width: 360px; }
      #outside { position: fixed; top: 10px; left: 10px; }
    </style>
    <script>
      Object.defineProperties(HTMLElement.prototype, {
        hidePopover: { configurable: true, value: undefined },
        showPopover: { configurable: true, value: undefined },
      });
      const nativeCssSupports = CSS.supports.bind(CSS);
      CSS.supports = (property, value) =>
        property === "top" && value === "anchor(bottom)"
          ? false
          : nativeCssSupports(property, value);
    </script>
    <div id="picker"></div>
    <button id="outside" type="button">Outside</button>
    <script src="/litopis/@fs${bundlePath}"></script>
    <script>
      LitopisDOM.createDatePicker(document.querySelector("#picker"), {
        mode: "popover",
      });
    </script>
  `);

  const picker = page.locator("#picker");
  const input = picker.getByRole("combobox", { name: "Date" });
  const calendar = picker.locator(".litopis-calendar");
  await input.click();

  await expect(picker).toHaveAttribute("data-calendar-open", "true");
  await expect(calendar).not.toHaveAttribute("popover");
  await expect(calendar).toBeVisible();

  await picker.locator(".litopis-caption").click();
  await expect(picker).toHaveAttribute("data-calendar-open", "true");

  await page.getByRole("button", { name: "Outside" }).click();
  await expect(picker).toHaveAttribute("data-calendar-open", "false");
  await expect(calendar).toBeHidden();

  await input.click();
  await picker.locator(".litopis-caption").click();
  await picker.locator(".litopis-panel-title").focus();
  await page.keyboard.press("Escape");

  await expect(picker).toHaveAttribute("data-calendar-open", "false");
  await expect(input).toBeFocused();
});

test("selected day, month and year keep the same selection styling", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./examples/");
  const input = page.getByRole("combobox", { name: "Дата події" });
  const picker = input.locator("..");
  await picker
    .locator(".litopis-day:not([data-outside-month]) .litopis-day-button")
    .first()
    .click();
  const selectedDay = picker.locator(".litopis-day[data-selected] .litopis-day-button");
  await selectedDay.evaluate(async (element) => {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
  });
  const selectedBackground = await selectedDay.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
  const selectedForeground = await selectedDay.evaluate(
    (element) => getComputedStyle(element).color,
  );

  await picker.locator(".litopis-caption").click();

  const selectedMonth = picker.locator(".litopis-month-button[data-selected]");
  await expect(selectedMonth).toHaveCount(1);
  await expect(selectedMonth).toHaveCSS("background-color", selectedBackground);
  await expect(selectedMonth).toHaveCSS("color", selectedForeground);

  await selectedMonth.hover();

  await expect(selectedMonth).toHaveCSS("background-color", selectedBackground);
  await expect(selectedMonth).toHaveCSS("color", selectedForeground);

  const yearChooser = picker.locator(".litopis-panel-title");
  const visibleYear = await yearChooser.textContent();
  await expect(yearChooser).toHaveAccessibleName(new RegExp(visibleYear ?? "^$"));
  await expect(yearChooser).toHaveAccessibleDescription("Вибрати рік");
  await yearChooser.click();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);

  const selectedYear = picker.locator(".litopis-year-button[data-selected]");
  await expect(selectedYear).toHaveCount(1);
  await expect(selectedYear).toHaveCSS("background-color", selectedBackground);
  await expect(selectedYear).toHaveCSS("color", selectedForeground);
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

test("base styles preserve supplied typography and fit generated inputs to large text", async ({
  page,
}) => {
  const fixturePath = path.resolve("tests/browser/fixture.html");
  await page.goto(`/litopis/@fs${fixturePath}`);
  const bundlePath = path.resolve("packages/elements/dist/index.global.js");
  const stylesheetPath = path.resolve("packages/dom/styles/base.css");
  await page.setContent(`
    <link rel="stylesheet" href="/litopis/@fs${stylesheetPath}">
    <script src="/litopis/@fs${bundlePath}"></script>
    <litopis-date-picker mode="popover" label="Large text date">
      <input slot="input" style="font-size: 24px; font-family: Georgia" />
    </litopis-date-picker>
    <litopis-date-picker
      mode="popover"
      label="Large generated date"
      style="--litopis-font-size: 24px; --litopis-font-family: Georgia"
    ></litopis-date-picker>
  `);
  const suppliedInput = page.getByRole("combobox", { name: "Large text date" });
  await expect(suppliedInput).toHaveCSS("font-size", "24px");
  await expect(suppliedInput).toHaveCSS("font-family", "Georgia");

  const generatedInput = page.getByRole("combobox", { name: "Large generated date" });
  await expect(generatedInput).toHaveCSS("font-size", "24px");
  await expect(generatedInput).toHaveCSS("font-family", "Georgia");
  const fits = await generatedInput.evaluate((element) => {
    const style = getComputedStyle(element);
    const contentHeight =
      Number.parseFloat(style.lineHeight) +
      Number.parseFloat(style.paddingTop) +
      Number.parseFloat(style.paddingBottom) +
      Number.parseFloat(style.borderTopWidth) +
      Number.parseFloat(style.borderBottomWidth);
    return element.getBoundingClientRect().height >= contentHeight;
  });
  expect(fits).toBe(true);
});

test("every stylesheet leaves controls outside library roots unchanged", async ({ page }) => {
  const fixturePath = path.resolve("tests/browser/fixture.html");
  const properties = [
    "font",
    "color",
    "background-color",
    "padding",
    "border",
    "box-shadow",
    "width",
    "height",
    "opacity",
  ];
  for (const stylesheet of ["foundation", "base", "daisyui", "bootstrap", "shadcn"]) {
    await page.goto(`/litopis/@fs${fixturePath}`);
    await page.setContent(`
      <style>body { font: 24px Georgia; }</style>
      <section id="foreign-controls">
        <input type="text" aria-label="Foreign input">
        <button type="button">Foreign button</button>
        <input class="litopis-input" aria-label="Escaped internal class">
        <span class="litopis-label">Escaped label class</span>
      </section>
      <div class="litopis"><input class="litopis-input" aria-label="Library input"></div>
    `);
    const before = await page.locator("#foreign-controls > *").evaluateAll(
      (elements, properties) =>
        elements.map((element) => {
          const style = getComputedStyle(element);
          return properties.map((property) => style.getPropertyValue(property));
        }),
      properties,
    );
    const stylesheetPath = path.resolve(`packages/dom/styles/${stylesheet}.css`);
    await page.addStyleTag({ url: `/litopis/@fs${stylesheetPath}` });
    await expect(page.getByRole("textbox", { name: "Library input", exact: true })).toHaveCSS(
      "appearance",
      "none",
    );
    const after = await page.locator("#foreign-controls > *").evaluateAll(
      (elements, properties) =>
        elements.map((element) => {
          const style = getComputedStyle(element);
          return properties.map((property) => style.getPropertyValue(property));
        }),
      properties,
    );
    expect(after, `${stylesheet} must not style controls outside the library`).toEqual(before);
  }
});

test("every stylesheet preserves host styles on supplied inputs", async ({ page }) => {
  const fixturePath = path.resolve("tests/browser/fixture.html");
  const bundlePath = path.resolve("packages/elements/dist/index.global.js");
  const properties = [
    "appearance",
    "background-color",
    "border-top-color",
    "border-top-left-radius",
    "border-top-width",
    "box-shadow",
    "box-sizing",
    "color",
    "cursor",
    "font-family",
    "font-size",
    "font-variant-numeric",
    "height",
    "line-height",
    "padding-bottom",
    "padding-left",
    "padding-right",
    "padding-top",
    "touch-action",
    "transition-duration",
    "width",
  ];

  for (const stylesheet of ["foundation", "base", "daisyui", "bootstrap", "shadcn"]) {
    await page.goto(`/litopis/@fs${fixturePath}`);
    const stylesheetPath = path.resolve(`packages/dom/styles/${stylesheet}.css`);
    await page.setContent(`
      <link rel="stylesheet" href="/litopis/@fs${stylesheetPath}">
      <style>
        html {
          color: rgb(42, 53, 77);
          font: 21px/1.4 Georgia, serif;
        }
        body { margin: 0; }
        .app-input {
          appearance: none;
          background-color: rgb(255, 250, 240);
          border: 2px solid rgb(72, 61, 139);
          border-radius: 13px;
          box-shadow: 0 2px 5px rgb(0 0 0 / 20%);
          box-sizing: content-box;
          color: inherit;
          cursor: crosshair;
          font: inherit;
          font-variant-numeric: tabular-nums;
          height: 38px;
          padding: 6px 13px;
          touch-action: pan-y;
          transition: border-color 180ms ease;
          width: 15rem;
        }
      </style>
      <input id="host-reference" class="app-input" aria-label="Host reference">
      <litopis-date-picker mode="popover" label="Host owned date">
        <input id="host-supplied" slot="input" class="app-input" placeholder="Choose a date">
      </litopis-date-picker>
    `);

    const reference = page.locator("#host-reference");
    const supplied = page.locator("#host-supplied");
    const before = await reference.evaluate((element, styleProperties) => {
      const styles = getComputedStyle(element);
      return Object.fromEntries(
        styleProperties.map((property) => [property, styles.getPropertyValue(property)]),
      );
    }, properties);
    expect(
      await supplied.evaluate((element, styleProperties) => {
        const styles = getComputedStyle(element);
        return Object.fromEntries(
          styleProperties.map((property) => [property, styles.getPropertyValue(property)]),
        );
      }, properties),
    ).toEqual(before);

    await page.addScriptTag({ url: `/litopis/@fs${bundlePath}` });
    await expect(supplied).toHaveAttribute("role", "combobox");
    await expect(supplied).toHaveAttribute("class", "app-input");
    const after = await supplied.evaluate((element, styleProperties) => {
      const styles = getComputedStyle(element);
      return Object.fromEntries(
        styleProperties.map((property) => [property, styles.getPropertyValue(property)]),
      );
    }, properties);
    expect(after).toEqual(before);
  }
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
        --size-field: 0.3rem;
      }
    </style>
    <script src="/litopis/@fs${bundlePath}"></script>
    <litopis-date-picker label="Daisy date" value="2026-07-16"></litopis-date-picker>
  `);

  const calendar = page.locator(".litopis-calendar");
  const previousButton = calendar.getByRole("button", { name: "Previous month" });
  const selectedDay = page.locator(".litopis-day[data-selected] .litopis-day-button");

  await expect(calendar).toHaveCSS("background-color", "rgb(255, 247, 237)");
  await expect(calendar).toHaveCSS("border-radius", "24px");
  await expect(previousButton).toHaveCSS("height", "48px");
  await expect(previousButton).toHaveCSS("width", "48px");
  await page.keyboard.press("Tab");
  await previousButton.focus();
  await expect(previousButton).toBeFocused();
  await expect(previousButton).toHaveCSS("box-shadow", /67, 20, 7/);
  await expect(selectedDay).toHaveCSS("background-color", "rgb(67, 20, 7)");
  await expect(selectedDay).toHaveCSS("color", "rgb(255, 247, 237)");
});

test("disabled outside days use the same disabled color as other unavailable days", async ({
  page,
}) => {
  const fixturePath = path.resolve("tests/browser/fixture.html");
  const bundlePath = path.resolve("packages/elements/dist/index.global.js");
  const stylesheetPath = path.resolve("packages/dom/styles/base.css");
  await page.goto(`/litopis/@fs${fixturePath}`);
  await page.setContent(`
    <link rel="stylesheet" href="/litopis/@fs${stylesheetPath}">
    <script src="/litopis/@fs${bundlePath}"></script>
    <litopis-date-picker label="Date" value="2026-11-16" max="2026-11-25"></litopis-date-picker>
  `);
  const outside = page
    .locator('.litopis-day[data-outside-month] .litopis-day-button[aria-disabled="true"]')
    .first();
  const current = page
    .locator('.litopis-day:not([data-outside-month]) .litopis-day-button[aria-disabled="true"]')
    .first();
  const color = await current.evaluate((element) => getComputedStyle(element).color);
  await expect(outside).toHaveCSS("color", color);
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
  const selectedDay = page.locator(".litopis-day[data-selected] .litopis-day-button");

  await expect(calendar).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(calendar).toHaveCSS("border-radius", "12px");
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
        --bs-body-font-size: 18px;
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
