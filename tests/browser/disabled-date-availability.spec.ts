import { expect, test } from "@playwright/test";

interface AvailabilityTestWindow extends Window {
  availabilityPicker?: { destroy(): void; getISOValue(): string };
  availabilityVisibleMonths?: string[];
}

test("unavailable dates stay unselectable through browser input, keyboard and navigation", async ({
  page,
}) => {
  await page.goto("./examples/disabled-dates.fixture.html");

  const host = page.locator("#availability-picker");
  const unavailable = host.locator(".litopis-day[data-iso-date='2026-06-26'] button");
  await expect(unavailable).toBeDisabled();

  const input = host.getByRole("combobox");
  await input.fill("2026-06-26");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect
    .poll(() =>
      page.evaluate(() => (window as AvailabilityTestWindow).availabilityPicker?.getISOValue()),
    )
    .toBe("2026-06-25");

  await input.focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowRight");
  const focusedUnavailable = host.locator(".litopis-day[data-iso-date='2026-06-26'] button");
  await expect(focusedUnavailable).toBeFocused();
  await expect(focusedUnavailable).toHaveAttribute("aria-disabled", "true");
  await focusedUnavailable.dispatchEvent("click");
  await page.keyboard.press("Enter");
  await expect
    .poll(() =>
      page.evaluate(() => (window as AvailabilityTestWindow).availabilityPicker?.getISOValue()),
    )
    .toBe("2026-06-25");

  await host.getByRole("button", { name: "Next month" }).click();
  await expect
    .poll(() => page.evaluate(() => (window as AvailabilityTestWindow).availabilityVisibleMonths))
    .toEqual(["2026-7-1"]);

  await page.evaluate(() => (window as AvailabilityTestWindow).availabilityPicker?.destroy());
});
