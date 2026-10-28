import { expect, test, type Page } from "@playwright/test";

interface RangePickerTestOptions {
  readonly layout: "single" | "split";
  readonly mode: "inline" | "popover";
  readonly forcePopoverFallback?: boolean;
}

async function configureRangePicker(page: Page, options: RangePickerTestOptions) {
  await page.goto("./");

  const playground = page.locator("[data-playground]");
  await playground.locator("[data-playground-selection]").selectOption("range");
  await playground.locator("[data-playground-layout]").selectOption(options.layout);
  const calendarMode = playground.locator("[data-playground-calendar]");
  if (options.forcePopoverFallback) {
    await calendarMode.selectOption("inline");
    await page.evaluate(() => {
      const nativeCssSupports = CSS.supports.bind(CSS);
      CSS.supports = new Proxy(nativeCssSupports, {
        apply(target, thisArgument, argumentsList) {
          if (argumentsList[0] === "top" && argumentsList[1] === "anchor(bottom)") return false;
          return Reflect.apply(target, thisArgument, argumentsList);
        },
      });
    });
  }
  await calendarMode.selectOption(options.mode);
  await playground.locator("[data-playground-size]").selectOption("comfortable");
  await playground.locator("[data-playground-locale]").fill("uk-UA");
  await expect(playground.locator("[data-playground-selection]")).toHaveValue("range");
  await expect(playground.locator("[data-playground-layout]")).toHaveValue(options.layout);
  await expect(playground.locator("[data-playground-calendar]")).toHaveValue(options.mode);

  return playground.locator("[data-playground-picker].litopis");
}

test("split range popover uses calendar width instead of either 120px input", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  const picker = await configureRangePicker(page, { layout: "split", mode: "popover" });

  await page.addStyleTag({
    content: `
      [data-playground-picker].litopis {
        width: min(720px, 100vw) !important;
      }
      [data-playground-picker].litopis .litopis-range-fields {
        grid-template-columns: 120px 120px !important;
        width: max-content;
      }
    `,
  });

  const startInput = picker.locator(".litopis-range-fields .litopis-input").first();
  await expect(startInput).toHaveCSS("width", "120px");
  await startInput.click();

  const calendar = picker.locator(".litopis-calendar");
  await expect(calendar).toBeVisible();
  await expect(picker).toHaveAttribute("data-resolved-panels", "2");

  const geometry = await calendar.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const grids = [...element.querySelectorAll<HTMLElement>(".litopis-grid")]
      .filter((grid) => !grid.hidden)
      .map((grid) => ({ clientWidth: grid.clientWidth, scrollWidth: grid.scrollWidth }));

    return {
      left: rect.left,
      right: rect.right,
      width: rect.width,
      viewportWidth: document.documentElement.clientWidth,
      grids,
    };
  });

  expect(geometry.width).toBeGreaterThanOrEqual(640);
  expect(geometry.width).toBeLessThanOrEqual(geometry.viewportWidth);
  expect(geometry.left).toBeGreaterThanOrEqual(0);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth);
  expect(geometry.grids).toHaveLength(2);
  expect(geometry.grids.every(({ clientWidth, scrollWidth }) => scrollWidth <= clientWidth)).toBe(
    true,
  );
});

test("120px picker root opens a calendar at its recommended width", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  const picker = await configureRangePicker(page, { layout: "single", mode: "popover" });

  await page.addStyleTag({
    content: `
      [data-playground-picker].litopis {
        width: 120px !important;
      }
    `,
  });

  const input = picker.locator(".litopis-input").first();
  await expect(input).toHaveCSS("width", "120px");
  await input.click();

  const calendar = picker.locator(".litopis-calendar");
  await expect(calendar).toBeVisible();
  await expect(picker).toHaveAttribute("data-resolved-panels", "2");
  const geometry = await picker.evaluate((element) => {
    const root = element.getBoundingClientRect();
    const inputRect = element.querySelector(".litopis-input")?.getBoundingClientRect();
    const calendarRect = element
      .querySelector<HTMLElement>(".litopis-calendar")
      ?.getBoundingClientRect();

    return {
      rootWidth: root.width,
      inputWidth: inputRect?.width ?? 0,
      calendarWidth: calendarRect?.width ?? 0,
    };
  });

  expect(geometry.rootWidth).toBe(120);
  expect(geometry.inputWidth).toBe(120);
  expect(geometry.calendarWidth).toBeGreaterThanOrEqual(640);
  expect(geometry.calendarWidth).toBeGreaterThan(geometry.inputWidth);
});

test("popover respects a rem and calc calendar width token independently of its input", async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  const picker = await configureRangePicker(page, { layout: "single", mode: "popover" });
  await picker.evaluate((element) => {
    element.style.width = "120px";
    element.style.setProperty("--litopis-width", "calc(40rem + 8vw)");
  });

  const input = picker.locator(".litopis-input").first();
  await input.click();
  const calendar = picker.locator(".litopis-calendar");
  await expect(calendar).toBeVisible();

  const geometry = await picker.evaluate((element) => {
    const preferredWidth = Number.parseFloat(getComputedStyle(element).maxWidth);
    const inputWidth = element.querySelector(".litopis-input")?.getBoundingClientRect().width ?? 0;
    const calendarWidth =
      element.querySelector<HTMLElement>(".litopis-calendar")?.getBoundingClientRect().width ?? 0;

    return { preferredWidth, inputWidth, calendarWidth };
  });

  expect(geometry.inputWidth).toBe(120);
  expect(geometry.preferredWidth).toBeGreaterThan(700);
  expect(Math.abs(geometry.calendarWidth - geometry.preferredWidth)).toBeLessThan(1);
});

test("320px popover shows one complete calendar with 44px date targets at enlarged text", async ({
  page,
}) => {
  await page.setViewportSize({ height: 700, width: 1440 });
  const picker = await configureRangePicker(page, { layout: "split", mode: "popover" });

  await page.addStyleTag({
    content: `
      [data-playground-picker].litopis {
        font-size: 200% !important;
        width: min(720px, 100vw) !important;
      }
      [data-playground-picker].litopis .litopis-range-fields {
        grid-template-columns: 120px 120px !important;
        width: max-content;
      }
    `,
  });

  await picker.locator(".litopis-input").first().click();
  await expect(picker).toHaveAttribute("data-resolved-panels", "2");
  await page.setViewportSize({ height: 700, width: 320 });

  const calendar = picker.locator(".litopis-calendar");
  await expect(calendar).toBeVisible();
  await expect(picker).toHaveAttribute("data-resolved-panels", "1");
  await expect(calendar.locator(".litopis-grid:visible")).toHaveCount(1);
  await expect(calendar.locator(".litopis-grid:not([hidden]) .litopis-weekday")).toHaveCount(7);

  const geometry = await calendar.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const weekdayRow = element.querySelector<HTMLElement>(
      ".litopis-grid:not([hidden]) .litopis-weekdays",
    );
    const weekdayCells = [
      ...element.querySelectorAll<HTMLElement>(".litopis-grid:not([hidden]) .litopis-weekday"),
    ];
    const dateButtons = [...element.querySelectorAll<HTMLButtonElement>(".litopis-day-button")];
    const captionLabel = element.querySelector<HTMLElement>(".litopis-caption-label");

    return {
      left: rect.left,
      right: rect.right,
      width: rect.width,
      viewportWidth: document.documentElement.clientWidth,
      weekdayRowClientWidth: weekdayRow?.clientWidth ?? 0,
      weekdayRowScrollWidth: weekdayRow?.scrollWidth ?? 0,
      dayFontSize: Number.parseFloat(
        getComputedStyle(element.querySelector<HTMLElement>(".litopis-day-button")!).fontSize,
      ),
      weekdayFontSize: Number.parseFloat(
        getComputedStyle(element.querySelector<HTMLElement>(".litopis-weekday")!).fontSize,
      ),
      captionFontSize: Number.parseFloat(
        getComputedStyle(element.querySelector<HTMLElement>(".litopis-caption-label")!).fontSize,
      ),
      weekdayCellWidths: weekdayCells.map((cell) => cell.getBoundingClientRect().width),
      weekdayCellOverflows: weekdayCells.map((cell) => cell.scrollWidth > cell.clientWidth),
      visibleDateButtonSizes: dateButtons
        .filter((button) => button.getClientRects().length > 0)
        .map((button) => {
          const rect = button.getBoundingClientRect();
          return { width: rect.width, height: rect.height };
        }),
      captionFits: captionLabel !== null && captionLabel.scrollWidth <= captionLabel.clientWidth,
    };
  });

  expect(geometry.width).toBe(320);
  expect(geometry.left).toBeGreaterThanOrEqual(0);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth);
  expect(geometry.weekdayRowScrollWidth).toBeLessThanOrEqual(geometry.weekdayRowClientWidth);
  expect(geometry.dayFontSize).toBeGreaterThan(14);
  expect(geometry.weekdayFontSize).toBeGreaterThan(12);
  expect(geometry.captionFontSize).toBeGreaterThan(15);
  expect(geometry.weekdayCellWidths).toHaveLength(7);
  expect(geometry.weekdayCellWidths.every((width) => width >= 44)).toBe(true);
  expect(geometry.weekdayCellOverflows).toEqual(Array(7).fill(false));
  expect(geometry.visibleDateButtonSizes.length).toBeGreaterThan(0);
  expect(
    geometry.visibleDateButtonSizes.every(({ width, height }) => width >= 44 && height >= 44),
  ).toBe(true);
  expect(geometry.captionFits).toBe(true);

  const playground = page.locator("[data-playground]");
  await playground.locator("[data-playground-panels]").selectOption("2");
  await picker.locator(".litopis-input").first().click();
  await expect(picker).toHaveAttribute("data-resolved-panels", "2");

  const explicitTwoPanelMetrics = await picker.locator(".litopis-calendar").evaluate((element) => {
    const calendar = element as HTMLElement;
    const rect = calendar.getBoundingClientRect();
    const visibleGrids = [...calendar.querySelectorAll<HTMLElement>(".litopis-grid")].filter(
      (grid) => !grid.hidden,
    );

    return {
      clientWidth: calendar.clientWidth,
      scrollWidth: calendar.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
      gridCount: visibleGrids.length,
      gridOverflow: visibleGrids.map((grid) => grid.scrollWidth > grid.clientWidth),
      left: rect.left,
      right: rect.right,
    };
  });

  expect(explicitTwoPanelMetrics.gridCount).toBe(2);
  expect(explicitTwoPanelMetrics.gridOverflow, JSON.stringify(explicitTwoPanelMetrics)).toEqual([
    false,
    false,
  ]);
  expect(explicitTwoPanelMetrics.scrollWidth).toBeLessThanOrEqual(
    explicitTwoPanelMetrics.clientWidth,
  );
  expect(explicitTwoPanelMetrics.left).toBeGreaterThanOrEqual(0);
  expect(explicitTwoPanelMetrics.right).toBeLessThanOrEqual(explicitTwoPanelMetrics.viewportWidth);
});

test("inline range calendar expands to the width of its container", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  const picker = await configureRangePicker(page, { layout: "split", mode: "inline" });

  await page.addStyleTag({
    content: `
      form[data-playground-native-form] {
        max-width: none !important;
        padding: 0 !important;
        width: 840px !important;
      }
      [data-playground-picker].litopis {
        width: 100% !important;
      }
    `,
  });

  const geometry = await picker.evaluate((element) => {
    const root = element.getBoundingClientRect();
    const calendar = element
      .querySelector<HTMLElement>(".litopis-calendar")
      ?.getBoundingClientRect();

    return {
      rootWidth: root.width,
      calendarWidth: calendar?.width ?? 0,
    };
  });

  expect(geometry.rootWidth).toBe(840);
  expect(geometry.calendarWidth).toBe(geometry.rootWidth);
});

test("wide popover remains inside the viewport when its 120px input is at the right edge", async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  const picker = await configureRangePicker(page, { layout: "split", mode: "popover" });

  await page.addStyleTag({
    content: `
      [data-playground-picker].litopis {
        width: 720px !important;
      }
      [data-playground-picker].litopis .litopis-range-fields {
        position: fixed;
        left: calc(100vw - 120px);
        top: 100px;
        grid-template-columns: 120px 120px !important;
        width: max-content;
      }
    `,
  });

  const startInput = picker.locator(".litopis-range-fields .litopis-input").first();
  await expect(startInput).toHaveCSS("width", "120px");
  await startInput.click();

  const calendar = picker.locator(".litopis-calendar");
  await expect(calendar).toBeVisible();
  const geometry = await calendar.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      width: rect.width,
      viewportWidth: document.documentElement.clientWidth,
    };
  });

  expect(geometry.width).toBeGreaterThanOrEqual(640);
  expect(geometry.left).toBeGreaterThanOrEqual(0);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth);
});

test("120px wide popover fallback remains visible at the right viewport edge", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  const picker = await configureRangePicker(page, {
    forcePopoverFallback: true,
    layout: "split",
    mode: "popover",
  });

  await page.addStyleTag({
    content: `
      [data-playground-picker].litopis {
        width: 720px !important;
      }
      [data-playground-picker].litopis .litopis-range-fields {
        position: fixed;
        left: calc(100vw - 120px);
        top: 100px;
        grid-template-columns: 120px 120px !important;
        width: max-content;
      }
    `,
  });

  const startInput = picker.locator(".litopis-range-fields .litopis-input").first();
  await expect(startInput).toHaveCSS("width", "120px");
  await startInput.click();

  const calendar = picker.locator(".litopis-calendar");
  await expect(calendar).toBeVisible();
  const geometry = await calendar.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      width: rect.width,
      viewportWidth: document.documentElement.clientWidth,
    };
  });

  expect(geometry.width).toBeGreaterThanOrEqual(640);
  expect(geometry.left).toBeGreaterThanOrEqual(0);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth);
});

for (const forcePopoverFallback of [false, true]) {
  test(`two explicit panels stay vertically scrollable in a 320x500 viewport with ${forcePopoverFallback ? "fallback" : "CSS anchor"} positioning`, async ({
    page,
  }) => {
    await page.setViewportSize({ height: 500, width: 320 });
    const picker = await configureRangePicker(page, {
      forcePopoverFallback,
      layout: "split",
      mode: "popover",
    });

    await page.addStyleTag({
      content: `
        [data-playground-picker].litopis {
          left: 0 !important;
          position: fixed !important;
          top: 200px !important;
          width: min(720px, 100vw) !important;
        }
      `,
    });
    await page.locator("[data-playground-panels]").selectOption("2");
    await picker.locator(".litopis-input").first().click();

    const calendar = picker.locator(".litopis-calendar");
    await expect(calendar).toBeVisible();
    await expect(picker).toHaveAttribute("data-resolved-panels", "2");
    await expect(picker).toHaveAttribute("data-stacked-panels", "true");
    await expect(calendar.locator(".litopis-grid:visible")).toHaveCount(2);

    const geometry = await calendar.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        height: rect.height,
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight,
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        viewportHeight: document.documentElement.clientHeight,
        viewportWidth: document.documentElement.clientWidth,
        overflowY: getComputedStyle(element).overflowY,
      };
    });

    expect(geometry.top).toBeGreaterThanOrEqual(0);
    expect(geometry.bottom).toBeLessThanOrEqual(geometry.viewportHeight);
    expect(geometry.left).toBeGreaterThanOrEqual(0);
    expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth);
    expect(geometry.height).toBeLessThanOrEqual(geometry.viewportHeight);
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth);
    expect(geometry.overflowY).toBe("auto");
    expect(geometry.scrollHeight).toBeGreaterThan(geometry.clientHeight);
  });
}

test("320px calendar header has even gaps, 44px controls, and complete date rows", async ({
  page,
}) => {
  await page.setViewportSize({ height: 700, width: 320 });
  const picker = await configureRangePicker(page, { layout: "split", mode: "popover" });
  await page.addStyleTag({
    content: `
      [data-playground-picker].litopis {
        font-size: 200% !important;
        width: min(720px, 100vw) !important;
      }
    `,
  });
  await page.locator("[data-playground-panels]").selectOption("2");
  await picker.locator(".litopis-input").first().click();
  const calendar = picker.locator(".litopis-calendar");
  await expect(picker).toHaveAttribute("data-resolved-panels", "2");
  await expect(picker).toHaveAttribute("data-stacked-panels", "true");
  const metrics = await calendar.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const header = element.querySelector<HTMLElement>(".litopis-calendar-header")!;
    const headerRect = header.getBoundingClientRect();
    const previous = header.querySelector<HTMLElement>('[data-direction="previous"]')!;
    const next = header.querySelector<HTMLElement>('[data-direction="next"]')!;
    const captionButton = header.querySelector<HTMLElement>(".litopis-caption")!;
    const caption = header.querySelector<HTMLElement>(".litopis-caption-label")!;
    const captionText = document.createRange();
    captionText.selectNodeContents(caption);
    const captionRect = captionText.getBoundingClientRect();
    const previousRect = previous.getBoundingClientRect();
    const nextRect = next.getBoundingClientRect();
    const captionButtonRect = captionButton.getBoundingClientRect();
    const grids = [...element.querySelectorAll<HTMLElement>(".litopis-grid:not([hidden])")];
    const weekdayRows = grids.flatMap((grid) => [
      ...grid.querySelectorAll<HTMLElement>(".litopis-weekdays"),
    ]);
    const dateRows = grids.flatMap((grid) => [
      ...grid.querySelectorAll<HTMLElement>(".litopis-week:not(.litopis-weekdays)"),
    ]);
    const dayButtons = grids.flatMap((grid) =>
      [...grid.querySelectorAll<HTMLButtonElement>(".litopis-day-button")].map((button) => {
        const buttonRect = button.getBoundingClientRect();
        return {
          height: buttonRect.height,
          right: buttonRect.right,
          width: buttonRect.width,
          gridRight: grid.getBoundingClientRect().right,
        };
      }),
    );
    return {
      calendar: {
        left: rect.left,
        right: rect.right,
        width: rect.width,
        paddingLeft: Number.parseFloat(getComputedStyle(element).paddingLeft),
        paddingRight: Number.parseFloat(getComputedStyle(element).paddingRight),
      },
      header: {
        left: headerRect.left,
        right: headerRect.right,
        width: headerRect.width,
        leftTrackGap: captionButtonRect.left - previousRect.right,
        rightTrackGap: nextRect.left - captionButtonRect.right,
      },
      leftGap: captionRect.left - previousRect.right,
      rightGap: nextRect.left - captionRect.right,
      sideLeft: previousRect.left - rect.left,
      sideRight: rect.right - nextRect.right,
      controlSizes: [previousRect, nextRect].map(({ width, height }) => ({ width, height })),
      weekdayRows: weekdayRows.map((row) => ({
        clientWidth: row.clientWidth,
        scrollWidth: row.scrollWidth,
      })),
      dateRows: dateRows.map((row) => ({
        clientWidth: row.clientWidth,
        scrollWidth: row.scrollWidth,
      })),
      dayButtons,
      grids: grids.map((grid) => ({
        dateCount: grid.querySelectorAll(".litopis-day-button").length,
      })),
      viewport: document.documentElement.clientWidth,
    };
  });

  expect(metrics.calendar.left).toBeGreaterThanOrEqual(0);
  expect(metrics.calendar.right).toBeLessThanOrEqual(metrics.viewport);
  expect(metrics.calendar.paddingLeft).toBe(metrics.calendar.paddingRight);
  expect(Math.abs(metrics.sideLeft - metrics.sideRight)).toBeLessThan(1);
  expect(Math.abs(metrics.header.leftTrackGap - metrics.header.rightTrackGap)).toBeLessThan(1);
  expect(Math.abs(metrics.leftGap - metrics.rightGap)).toBeLessThan(1);
  expect(metrics.controlSizes).toEqual([
    { width: 44, height: 44 },
    { width: 44, height: 44 },
  ]);
  expect(metrics.weekdayRows).toHaveLength(2);
  expect(
    metrics.weekdayRows.every(({ scrollWidth, clientWidth }) => scrollWidth <= clientWidth),
  ).toBe(true);
  expect(metrics.dateRows.length).toBeGreaterThanOrEqual(8);
  expect(metrics.dateRows.every(({ scrollWidth, clientWidth }) => scrollWidth <= clientWidth)).toBe(
    true,
  );
  expect(metrics.grids).toHaveLength(2);
  expect(metrics.grids.every(({ dateCount }) => dateCount >= 28 && dateCount <= 42)).toBe(true);
  expect(metrics.dayButtons.length).toBeGreaterThanOrEqual(56);
  expect(
    metrics.dayButtons.every(
      ({ width, height, right, gridRight }) =>
        width >= 44 && height >= 44 && right <= gridRight + 1,
    ),
  ).toBe(true);
});

test("auto panel sizing resolves calc day-size tokens before the viewport narrows", async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  const picker = await configureRangePicker(page, { layout: "split", mode: "popover" });
  await picker.evaluate((element) => {
    element.style.setProperty("--litopis-day-size", "4rem");
    element.style.width = "720px";
  });

  await page.setViewportSize({ height: 900, width: 600 });
  await expect(picker).toHaveAttribute("data-panels", "auto");
  await expect(picker).toHaveAttribute("data-resolved-panels", "1");
});

for (const forcePopoverFallback of [false, true]) {
  test(`two explicit panels with 200% text stay inside a 320x700 viewport with ${forcePopoverFallback ? "fallback" : "CSS anchor"} positioning`, async ({
    page,
  }) => {
    await page.setViewportSize({ height: 700, width: 320 });
    const picker = await configureRangePicker(page, {
      forcePopoverFallback,
      layout: "split",
      mode: "popover",
    });

    await page.addStyleTag({
      content: `
        [data-playground-picker].litopis {
          font-size: 200% !important;
          left: 0 !important;
          position: fixed !important;
          top: 300px !important;
          width: min(720px, 100vw) !important;
        }
      `,
    });
    await page.locator("[data-playground-panels]").selectOption("2");
    await picker.locator(".litopis-input").first().click();

    const calendar = picker.locator(".litopis-calendar");
    await expect(calendar).toBeVisible();
    await expect(picker).toHaveAttribute("data-resolved-panels", "2");
    await expect(picker).toHaveAttribute("data-stacked-panels", "true");
    await expect(calendar.locator(".litopis-grid:visible")).toHaveCount(2);

    const geometry = await calendar.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const dayButton = element.querySelector<HTMLElement>(".litopis-day-button");
      return {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight,
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        dayButtonHeight: dayButton?.getBoundingClientRect().height ?? 0,
        viewportHeight: document.documentElement.clientHeight,
        viewportWidth: document.documentElement.clientWidth,
        overflowY: getComputedStyle(element).overflowY,
      };
    });

    expect(geometry.top).toBeGreaterThanOrEqual(0);
    expect(geometry.bottom).toBeLessThanOrEqual(geometry.viewportHeight);
    expect(geometry.left).toBeGreaterThanOrEqual(0);
    expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth);
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth);
    expect(geometry.overflowY).toBe("auto");
    expect(geometry.scrollHeight).toBeGreaterThan(geometry.clientHeight);
    expect(geometry.dayButtonHeight).toBeGreaterThanOrEqual(44);
  });
}
