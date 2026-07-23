import {
  createCalendarState,
  moveFocus,
  selectFocusedDate,
  toIsoDate,
} from "../packages/core/dist/index.mjs";

if ("document" in globalThis || "window" in globalThis) {
  throw new Error("The headless runtime check must run without browser globals.");
}

const initialState = createCalendarState({
  selected: { day: 16, month: 7, year: 2026 },
  today: { day: 16, month: 7, year: 2026 },
});
const nextState = selectFocusedDate(moveFocus(initialState, "next-day"));

if (!nextState.selected || toIsoDate(nextState.selected) !== "2026-07-17") {
  throw new Error("The headless core did not complete a calendar interaction.");
}
