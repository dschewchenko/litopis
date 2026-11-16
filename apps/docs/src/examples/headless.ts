import { createCalendarState, moveFocus, selectFocusedDate, toIsoDate } from "@litopis/core";

const output = document.querySelector<HTMLOutputElement>("#headless-state")!;
const nextDayButton = document.querySelector<HTMLButtonElement>("#headless-next-day")!;
const nextWeekButton = document.querySelector<HTMLButtonElement>("#headless-next-week")!;
const nextMonthButton = document.querySelector<HTMLButtonElement>("#headless-next-month")!;
const selectButton = document.querySelector<HTMLButtonElement>("#headless-select")!;
const today = { day: 15, month: 6, year: 2026 };

let state = createCalendarState({ selected: today, today });

function renderState(): void {
  const selectedDate = state.selected ? toIsoDate(state.selected) : "none";
  output.value = "Focused: " + toIsoDate(state.focusedDate) + " · Selected: " + selectedDate;
}

nextDayButton.addEventListener("click", () => {
  state = moveFocus(state, "next-day");
  renderState();
});
nextWeekButton.addEventListener("click", () => {
  state = moveFocus(state, "next-week");
  renderState();
});
nextMonthButton.addEventListener("click", () => {
  state = moveFocus(state, "next-month");
  renderState();
});
selectButton.addEventListener("click", () => {
  state = selectFocusedDate(state);
  renderState();
});

renderState();
