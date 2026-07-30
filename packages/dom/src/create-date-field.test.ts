import { describe, expect, it } from "vitest";
import { createDateField } from "./create-date-field";
import { maskDateFieldEdit, maskDateFieldInput, parseDateFieldValue } from "./date-field-format";

describe("createDateField", () => {
  it("masks and parses configured date formats", () => {
    expect(maskDateFieldInput("25062026", "dd.mm.yyyy")).toBe("25.06.2026");
    expect(maskDateFieldInput("0072026", "dd.mm.yyyy")).toBe("01.12.026");
    expect(maskDateFieldInput("31022026", "dd.mm.yyyy")).toBe("28.02.2026");
    expect(parseDateFieldValue("25.06.2026", "dd.mm.yyyy")).toEqual({
      day: 25,
      month: 6,
      year: 2026,
    });
    expect(parseDateFieldValue("0001-01-01", "yyyy-mm-dd")).toEqual({
      day: 1,
      month: 1,
      year: 1,
    });
    expect(parseDateFieldValue("0000-01-01", "yyyy-mm-dd")).toBeNull();
    expect(parseDateFieldValue("10000-01-01", "yyyy-mm-dd")).toBeNull();
  });

  it("keeps the caret stable when editing inside a masked value", () => {
    expect(maskDateFieldEdit("25.06.2027", "dd.mm.yyyy", 10, 10)).toEqual({
      selectionEnd: 10,
      selectionStart: 10,
      value: "25.06.2027",
    });
    expect(maskDateFieldEdit("25.06.92026", "dd.mm.yyyy", 7, 7)).toEqual({
      selectionEnd: 7,
      selectionStart: 7,
      value: "25.06.9202",
    });
  });

  it("renders an accessible masked input", () => {
    const root = document.createElement("div");

    const field = createDateField(root, {
      format: "mm/dd/yyyy",
      label: "Start date",
    });

    const input = root.querySelector<HTMLInputElement>(".litopis-input");
    input!.value = "06252026";
    input!.dispatchEvent(new Event("input"));

    expect(input?.value).toBe("06/25/2026");
    expect(field.getDate()).toEqual({ day: 25, month: 6, year: 2026 });
    expect(field.getISOValue()).toBe("2026-06-25");
    expect(field.isValid()).toBe(true);
  });

  it("clamps committed values to the allowed range", () => {
    const root = document.createElement("div");

    const field = createDateField(root, {
      format: "dd.mm.yyyy",
      max: { day: 10, month: 7, year: 2026 },
      min: { day: 10, month: 6, year: 2026 },
    });

    const input = root.querySelector<HTMLInputElement>(".litopis-input");
    input!.value = "01012020";
    input!.dispatchEvent(new Event("input"));
    input!.dispatchEvent(new Event("blur"));

    expect(input?.value).toBe("10.06.2026");
    expect(field.getDate()).toEqual({ day: 10, month: 6, year: 2026 });
    expect(field.getISOValue()).toBe("2026-06-10");
    expect(field.isValid()).toBe(true);
  });
});
