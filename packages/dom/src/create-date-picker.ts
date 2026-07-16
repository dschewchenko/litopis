import {
  addDays,
  addMonths,
  addYears,
  compareDates,
  createCalendarState,
  focusDate,
  formatDate,
  getDaysInMonth,
  moveFocus,
  selectDate,
  selectFocusedDate,
  toIsoDate,
  type CalendarMove,
  type CalendarState,
  type CalendarStateOptions,
  type DateValue,
} from "@litopis/core";
import {
  clampDateFieldValue,
  formatDateFieldValue,
  getDateFieldPlaceholder,
  isDateInRange,
  maskDateFieldEdit,
  parseDateFieldPreviewMonth,
  parseDateFieldValue,
} from "./date-field-format";
import type {
  DateFieldFormat,
  DatePickerCalendarMode,
  DatePickerController,
  DatePickerOptions,
  DatePickerTargetSize,
} from "./types";

const keyMoves = new Map<string, CalendarMove>([
  ["ArrowRight", "next-day"],
  ["ArrowLeft", "previous-day"],
  ["ArrowDown", "next-week"],
  ["ArrowUp", "previous-week"],
  ["Home", "month-start"],
  ["End", "month-end"],
  ["PageDown", "next-month"],
  ["PageUp", "previous-month"],
]);

type PanelMode = "month" | "year";
type InputStatus = "invalid" | "valid";

let datePickerId = 0;

export function createDatePicker(
  root: HTMLElement,
  options: DatePickerOptions = {},
): DatePickerController {
  let currentOptions = options;
  let state = createCalendarState(getCalendarStateOptions(currentOptions));
  let calendarOpen = getCalendarMode(currentOptions) === "inline";
  let monthYearPanelOpen = false;
  let panelMode: PanelMode = "month";
  let yearPageStart = getYearPageStart(state.visibleMonth.year);
  const id = `litopis-date-picker-${datePickerId}`;
  const anchorName = `--${id}-anchor`;
  datePickerId += 1;

  root.classList.add("litopis");
  root.innerHTML = "";

  const label = document.createElement("label");
  label.className = "litopis-label";
  label.htmlFor = `${id}-input`;

  const input = document.createElement("input");
  input.autocomplete = "off";
  input.className = "litopis-input input";
  input.id = `${id}-input`;
  input.inputMode = "numeric";
  input.type = "text";
  input.setAttribute("role", "combobox");
  input.setAttribute("aria-controls", `${id}-calendar`);
  input.setAttribute("aria-haspopup", "grid");

  const calendar = document.createElement("div");
  calendar.className = "litopis-calendar";
  calendar.id = `${id}-calendar`;

  const liveRegion = document.createElement("p");
  liveRegion.className = "litopis-live";
  liveRegion.setAttribute("aria-live", "polite");

  const calendarHeader = document.createElement("div");
  calendarHeader.className = "litopis-calendar-header";

  const previousMonthButton = document.createElement("button");
  previousMonthButton.className = "litopis-nav-button";
  previousMonthButton.textContent = "<";
  previousMonthButton.type = "button";
  previousMonthButton.setAttribute("aria-label", "Previous month");

  const caption = document.createElement("button");
  caption.className = "litopis-caption";
  caption.type = "button";
  caption.setAttribute("aria-label", "Choose month and year");

  const captionLabel = document.createElement("span");
  captionLabel.className = "litopis-caption-label";

  const season = document.createElement("span");
  season.className = "litopis-season";

  caption.append(captionLabel, season);

  const nextMonthButton = document.createElement("button");
  nextMonthButton.className = "litopis-nav-button";
  nextMonthButton.textContent = ">";
  nextMonthButton.type = "button";
  nextMonthButton.setAttribute("aria-label", "Next month");

  calendarHeader.append(previousMonthButton, caption, nextMonthButton);

  const monthYearPanel = document.createElement("div");
  monthYearPanel.className = "litopis-month-year-panel";
  monthYearPanel.hidden = true;

  const monthYearHeader = document.createElement("div");
  monthYearHeader.className = "litopis-month-year-header";

  const previousPanelButton = document.createElement("button");
  previousPanelButton.className = "litopis-panel-nav-button";
  previousPanelButton.textContent = "<";
  previousPanelButton.type = "button";

  const panelTitleButton = document.createElement("button");
  panelTitleButton.className = "litopis-panel-title";
  panelTitleButton.type = "button";

  const nextPanelButton = document.createElement("button");
  nextPanelButton.className = "litopis-panel-nav-button";
  nextPanelButton.textContent = ">";
  nextPanelButton.type = "button";

  monthYearHeader.append(previousPanelButton, panelTitleButton, nextPanelButton);

  const panelGrid = document.createElement("div");
  panelGrid.className = "litopis-panel-grid litopis-month-grid";
  panelGrid.setAttribute("role", "grid");

  monthYearPanel.append(monthYearHeader, panelGrid);

  const grid = document.createElement("div");
  grid.className = "litopis-grid react-day-picker";
  grid.setAttribute("role", "grid");

  const calendarFooter = document.createElement("div");
  calendarFooter.className = "litopis-calendar-footer";

  const todayButton = document.createElement("button");
  todayButton.className = "litopis-today-button";
  todayButton.type = "button";

  calendarFooter.append(todayButton);
  calendar.append(calendarHeader, liveRegion, monthYearPanel, grid, calendarFooter);
  root.append(label, input, calendar);

  function render(
    nextState: CalendarState = state,
    inputStatus: InputStatus = "valid",
    preserveInputValue = false,
  ): void {
    state = nextState;
    const selected = getSelectedDate(state);
    const inputFormat = getInputFormat(currentOptions);
    const calendarMode = getCalendarMode(currentOptions);
    const showSeason = currentOptions.showSeason ?? false;

    root.dataset.calendarMode = calendarMode;
    root.dataset.calendarOpen = String(calendarOpen);
    root.dataset.targetSize = getTargetSize(currentOptions);
    syncPopoverMode(calendarMode);
    label.textContent = currentOptions.label ?? "Date";
    input.placeholder = getDateFieldPlaceholder(inputFormat);
    if (!preserveInputValue) {
      input.value = selected ? formatDateFieldValue(selected, inputFormat) : input.value;
    }
    input.setAttribute("aria-expanded", String(calendarOpen));
    input.setAttribute("aria-invalid", String(inputStatus === "invalid"));
    calendar.hidden = calendarMode === "popover" && !supportsNativePopover() && !calendarOpen;
    captionLabel.textContent = state.grid.label;
    caption.setAttribute("aria-expanded", String(monthYearPanelOpen));
    previousMonthButton.disabled = isAdjacentMonthDisabled(-1);
    nextMonthButton.disabled = isAdjacentMonthDisabled(1);
    season.hidden = !showSeason;
    season.textContent = showSeason ? getSeasonLabel(state.visibleMonth.month) : "";
    calendarFooter.hidden = currentOptions.showTodayButton !== true;
    todayButton.disabled = !isDateInRange(state.today, state.min, state.max);
    todayButton.textContent = currentOptions.todayLabel ?? "Today";
    liveRegion.textContent = `${state.grid.label}. ${formatDate(state.focusedDate, state.locale, {
      dateStyle: "full",
    })}`;
    renderMonthYearPanel();
    renderDayGrid();
    syncNativePopoverState();
  }

  function renderDayGrid(): void {
    grid.setAttribute("aria-label", state.grid.label);
    grid.hidden = monthYearPanelOpen;
    grid.innerHTML = "";
    renderWeekdays();

    for (const week of state.grid.weeks) {
      const row = document.createElement("div");
      row.className = "litopis-week rdp-week";
      row.setAttribute("role", "row");

      for (const cell of week) {
        const gridcell = document.createElement("div");
        gridcell.className = "litopis-day rdp-day";
        gridcell.dataset.isoDate = toIsoDate(cell.date);

        if (cell.outsideMonth && currentOptions.showOutsideDays === false) {
          gridcell.classList.add("litopis-day-empty");
          gridcell.setAttribute("aria-hidden", "true");
          gridcell.setAttribute("role", "presentation");
          row.append(gridcell);
          continue;
        }

        gridcell.setAttribute("aria-selected", String(cell.selected));
        gridcell.setAttribute("role", "gridcell");

        const button = document.createElement("button");
        button.className = "litopis-day-button rdp-day_button";
        button.disabled = cell.disabled;
        button.tabIndex = toIsoDate(cell.date) === toIsoDate(state.focusedDate) ? 0 : -1;
        button.textContent = String(cell.date.day);
        button.type = "button";
        button.setAttribute(
          "aria-label",
          formatDate(cell.date, state.locale, { dateStyle: "full" }),
        );

        if (cell.outsideMonth) {
          gridcell.classList.add("rdp-outside");
          gridcell.dataset.outsideMonth = "";
        }

        if (cell.selected) {
          gridcell.classList.add("rdp-selected");
          gridcell.dataset.selected = "";
        }

        if (cell.today) {
          gridcell.classList.add("rdp-today");
          gridcell.dataset.today = "";
        }

        if (cell.disabled) {
          gridcell.classList.add("rdp-disabled");
        }

        gridcell.append(button);
        row.append(gridcell);
      }

      grid.append(row);
    }
  }

  function renderWeekdays(): void {
    const row = document.createElement("div");
    row.className = "litopis-week litopis-weekdays";
    row.setAttribute("role", "row");

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const weekdayOffset = (state.firstDayOfWeek + dayIndex) % 7;
      const weekday = document.createElement("div");
      weekday.className = "litopis-weekday";
      weekday.setAttribute("role", "columnheader");
      weekday.textContent = formatDate(
        addDays({ day: 4, month: 1, year: 2026 }, weekdayOffset),
        state.locale,
        {
          weekday: "short",
        },
      );
      row.append(weekday);
    }

    grid.append(row);
  }

  function renderMonthYearPanel(): void {
    monthYearPanel.hidden = !monthYearPanelOpen;
    panelGrid.innerHTML = "";
    panelGrid.className =
      panelMode === "month"
        ? "litopis-panel-grid litopis-month-grid"
        : "litopis-panel-grid litopis-year-grid";

    if (panelMode === "year") {
      renderYearPanel();
      return;
    }

    renderMonthPanel();
  }

  function renderMonthPanel(): void {
    panelTitleButton.textContent = String(state.visibleMonth.year);
    panelTitleButton.setAttribute("aria-label", "Choose year");
    previousPanelButton.disabled = isYearDisabled(state.visibleMonth.year - 1);
    nextPanelButton.disabled = isYearDisabled(state.visibleMonth.year + 1);
    previousPanelButton.setAttribute("aria-label", "Previous year");
    nextPanelButton.setAttribute("aria-label", "Next year");

    for (let month = 1; month <= 12; month += 1) {
      const monthButton = document.createElement("button");
      monthButton.className = "litopis-month-button";
      monthButton.disabled = isMonthDisabled(month, state.visibleMonth.year, state);
      monthButton.textContent = formatDate(
        { day: 1, month, year: state.visibleMonth.year },
        state.locale,
        {
          month: "short",
        },
      );
      monthButton.type = "button";

      if (month === state.visibleMonth.month) {
        monthButton.classList.add("selected");
        monthButton.setAttribute("aria-pressed", "true");
      }

      monthButton.addEventListener("click", () => {
        monthYearPanelOpen = false;
        focusMonthYear(month, state.visibleMonth.year);
      });

      panelGrid.append(monthButton);
    }
  }

  function renderYearPanel(): void {
    const yearPageEnd = yearPageStart + 11;
    panelTitleButton.textContent = `${yearPageStart}–${yearPageEnd}`;
    panelTitleButton.setAttribute("aria-label", "Choose month");
    previousPanelButton.disabled = isYearRangeDisabled(yearPageStart - 12, yearPageStart - 1);
    nextPanelButton.disabled = isYearRangeDisabled(yearPageStart + 12, yearPageStart + 23);
    previousPanelButton.setAttribute("aria-label", "Previous years");
    nextPanelButton.setAttribute("aria-label", "Next years");

    for (let year = yearPageStart; year <= yearPageEnd; year += 1) {
      const yearButton = document.createElement("button");
      yearButton.className = "litopis-year-button";
      yearButton.disabled = isYearDisabled(year);
      yearButton.textContent = String(year);
      yearButton.type = "button";

      if (year === state.visibleMonth.year) {
        yearButton.classList.add("selected");
        yearButton.setAttribute("aria-pressed", "true");
      }

      yearButton.addEventListener("click", () => {
        panelMode = "month";
        focusMonthYear(state.visibleMonth.month, year);
      });

      panelGrid.append(yearButton);
    }
  }

  function isMonthDisabled(month: number, year: number, calendarState: CalendarState): boolean {
    const monthStart = { day: 1, month, year };
    const monthEnd = { day: getDaysInMonth(monthStart), month, year };

    return Boolean(
      (calendarState.min && compareDates(monthEnd, calendarState.min) < 0) ||
      (calendarState.max && compareDates(monthStart, calendarState.max) > 0),
    );
  }

  function isYearDisabled(year: number): boolean {
    return isYearRangeDisabled(year, year);
  }

  function isYearRangeDisabled(startYear: number, endYear: number): boolean {
    return Boolean(
      (state.min && endYear < state.min.year) || (state.max && startYear > state.max.year),
    );
  }

  function isAdjacentMonthDisabled(direction: -1 | 1): boolean {
    const month = addMonths(state.visibleMonth, direction);
    return isMonthDisabled(month.month, month.year, state);
  }

  function getSeasonLabel(month: number): string {
    if (month === 12 || month <= 2) {
      return "Winter";
    }

    if (month <= 5) {
      return "Spring";
    }

    if (month <= 8) {
      return "Summer";
    }

    return "Autumn";
  }

  function focusMonthYear(month: number, year: number): void {
    const day = Math.min(state.focusedDate.day, getDaysInMonth({ day: 1, month, year }));
    const nextState = focusDate(state, { day, month, year });
    yearPageStart = getYearPageStart(nextState.visibleMonth.year);
    render(nextState);
  }

  function setSelectedDate(value: DateValue | null): void {
    input.value = value ? formatDateFieldValue(value, getInputFormat(currentOptions)) : "";
    const nextState = selectDate(state, value);
    yearPageStart = getYearPageStart(nextState.visibleMonth.year);
    render(nextState);
    currentOptions.onValueChange?.(getSelectedDate(nextState));
  }

  function setVisibleMonth(value: DateValue): void {
    const nextState = focusDate(state, { day: 1, month: value.month, year: value.year });
    yearPageStart = getYearPageStart(nextState.visibleMonth.year);
    render(nextState);
  }

  function goToToday(): void {
    const nextState = focusDate(state, state.today);
    yearPageStart = getYearPageStart(nextState.visibleMonth.year);
    monthYearPanelOpen = false;
    panelMode = "month";
    render(nextState);
  }

  function setOptions(nextOptions: Partial<DatePickerOptions>): void {
    const previousMode = getCalendarMode(currentOptions);
    currentOptions = { ...currentOptions, ...nextOptions };
    const selected = Object.hasOwn(nextOptions, "selected")
      ? (nextOptions.selected ?? null)
      : state.selected;
    state = createCalendarState(getCalendarStateOptions(currentOptions, selected));
    yearPageStart = getYearPageStart(state.visibleMonth.year);

    if (getCalendarMode(currentOptions) === "inline") {
      calendarOpen = true;
    } else if (previousMode === "inline") {
      calendarOpen = false;
      monthYearPanelOpen = false;
    }

    render(state);
  }

  function onKeydown(event: KeyboardEvent): void {
    const move = keyMoves.get(event.key);

    if (move) {
      event.preventDefault();
      render(moveFocus(state, event.shiftKey && move === "next-month" ? "next-year" : move));
      focusCurrentDay();
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const nextState = selectFocusedDate(state);
      render(nextState);
      closeAfterSelection();
      currentOptions.onValueChange?.(getSelectedDate(nextState));
    }
  }

  function onGridClick(event: MouseEvent): void {
    const button =
      event.target instanceof Element ? event.target.closest(".litopis-day-button") : null;

    if (!(button instanceof HTMLButtonElement) || button.disabled) {
      return;
    }

    const day = button.closest<HTMLElement>(".litopis-day");
    const date = parseDateFieldValue(day?.dataset.isoDate ?? "", "yyyy-mm-dd");

    if (!date) {
      return;
    }

    const nextState = selectFocusedDate({ ...state, focusedDate: date });
    render(nextState);
    closeAfterSelection();
    currentOptions.onValueChange?.(getSelectedDate(nextState));
  }

  function focusCurrentDay(): void {
    const current = grid.querySelector<HTMLButtonElement>(".litopis-day-button[tabindex='0']");
    current?.focus();
  }

  function onInput(): void {
    openCalendar();
    const inputFormat = getInputFormat(currentOptions);
    applyInputMask(inputFormat);
    const parsed = parseDateFieldValue(input.value, inputFormat);

    if (input.value.length === 0) {
      setSelectedDate(null);
      return;
    }

    if (parsed) {
      if (!isDateInRange(parsed, state.min, state.max)) {
        input.setAttribute("aria-invalid", "true");
        return;
      }

      const nextState = selectFocusedDate(focusDate(state, parsed));
      render(nextState);
      currentOptions.onValueChange?.(getSelectedDate(nextState));
      return;
    }

    const previewMonth = parseDateFieldPreviewMonth(
      input.value,
      inputFormat,
      state.visibleMonth.year,
    );

    if (previewMonth && !isMonthDisabled(previewMonth.month, previewMonth.year, state)) {
      render(focusDate(state, previewMonth), "valid", true);
      return;
    }

    input.setAttribute("aria-invalid", "false");
  }

  function applyInputMask(inputFormat: DateFieldFormat): void {
    const masked = maskDateFieldEdit(
      input.value,
      inputFormat,
      input.selectionStart,
      input.selectionEnd,
    );
    input.value = masked.value;

    if (document.activeElement === input) {
      input.setSelectionRange(masked.selectionStart, masked.selectionEnd);
    }
  }

  function commitInputValue(): void {
    const inputFormat = getInputFormat(currentOptions);

    if (input.value.length === 0) {
      setSelectedDate(null);
      input.setAttribute("aria-invalid", "false");
      return;
    }

    const parsed = parseDateFieldValue(input.value, inputFormat);

    if (!parsed) {
      const selected = getSelectedDate(state);
      input.value = selected ? formatDateFieldValue(selected, inputFormat) : "";
      input.setAttribute("aria-invalid", "false");
      return;
    }

    setSelectedDate(clampDateFieldValue(parsed, state.min, state.max));
    input.setAttribute("aria-invalid", "false");
  }

  function onInputFocus(): void {
    openCalendar();
  }

  function onInputBlur(): void {
    commitInputValue();
  }

  function onInputKeydown(event: KeyboardEvent): void {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openCalendar();
      focusCurrentDay();
      return;
    }

    if (event.key === "Enter") {
      commitInputValue();
      return;
    }

    if (event.key === "Escape") {
      closeCalendar();
    }
  }

  function onCaptionClick(): void {
    openCalendar();
    monthYearPanelOpen = !monthYearPanelOpen;
    panelMode = "month";
    yearPageStart = getYearPageStart(state.visibleMonth.year);
    render(state);
  }

  function onPreviousPanelClick(): void {
    if (panelMode === "year") {
      yearPageStart -= 12;
      render(state);
      return;
    }

    render(focusDate(state, addYears(state.focusedDate, -1)));
  }

  function onNextPanelClick(): void {
    if (panelMode === "year") {
      yearPageStart += 12;
      render(state);
      return;
    }

    render(focusDate(state, addYears(state.focusedDate, 1)));
  }

  function onPanelTitleClick(): void {
    panelMode = panelMode === "month" ? "year" : "month";
    yearPageStart = getYearPageStart(state.visibleMonth.year);
    render(state);
  }

  function onPreviousMonthClick(): void {
    const month = addMonths(state.visibleMonth, -1);
    focusMonthYear(month.month, month.year);
  }

  function onNextMonthClick(): void {
    const month = addMonths(state.visibleMonth, 1);
    focusMonthYear(month.month, month.year);
  }

  function onTodayClick(): void {
    goToToday();
  }

  function openCalendar(): void {
    if (getCalendarMode(currentOptions) !== "popover") {
      return;
    }

    calendarOpen = true;
    render(state);
  }

  function closeCalendar(): void {
    if (getCalendarMode(currentOptions) !== "popover") {
      return;
    }

    calendarOpen = false;
    monthYearPanelOpen = false;
    panelMode = "month";
    render(state);
  }

  function toggleCalendar(): void {
    if (getCalendarMode(currentOptions) !== "popover") {
      return;
    }

    if (calendarOpen) {
      closeCalendar();
      return;
    }

    openCalendar();
  }

  function closeAfterSelection(): void {
    if (getCalendarMode(currentOptions) === "popover") {
      closeCalendar();
    }
  }

  function syncPopoverMode(calendarMode: DatePickerCalendarMode): void {
    if (calendarMode === "popover") {
      calendar.setAttribute("popover", "auto");
      input.style.setProperty("anchor-name", anchorName);
      calendar.style.setProperty("position-anchor", anchorName);
      return;
    }

    hideNativePopover();
    calendar.removeAttribute("popover");
    input.style.removeProperty("anchor-name");
    calendar.style.removeProperty("position-anchor");
  }

  function syncNativePopoverState(): void {
    if (getCalendarMode(currentOptions) !== "popover" || !supportsNativePopover()) {
      return;
    }

    if (calendarOpen && !isNativePopoverOpen()) {
      calendar.showPopover();
      return;
    }

    if (!calendarOpen && isNativePopoverOpen()) {
      calendar.hidePopover();
    }
  }

  function hideNativePopover(): void {
    if (!supportsNativePopover() || !isNativePopoverOpen()) {
      return;
    }

    calendar.hidePopover();
  }

  function supportsNativePopover(): boolean {
    return typeof calendar.showPopover === "function" && typeof calendar.hidePopover === "function";
  }

  function isNativePopoverOpen(): boolean {
    if (!supportsNativePopover()) {
      return false;
    }

    try {
      return calendar.matches(":popover-open");
    } catch {
      return false;
    }
  }

  function onPopoverToggle(): void {
    if (getCalendarMode(currentOptions) !== "popover" || !supportsNativePopover()) {
      return;
    }

    const nextOpen = isNativePopoverOpen();

    if (calendarOpen === nextOpen) {
      return;
    }

    calendarOpen = nextOpen;

    if (!nextOpen) {
      monthYearPanelOpen = false;
      panelMode = "month";
    }

    render(state);
  }

  caption.addEventListener("click", onCaptionClick);
  previousPanelButton.addEventListener("click", onPreviousPanelClick);
  nextPanelButton.addEventListener("click", onNextPanelClick);
  panelTitleButton.addEventListener("click", onPanelTitleClick);
  previousMonthButton.addEventListener("click", onPreviousMonthClick);
  nextMonthButton.addEventListener("click", onNextMonthClick);
  todayButton.addEventListener("click", onTodayClick);
  input.addEventListener("click", onInputFocus);
  input.addEventListener("blur", onInputBlur);
  input.addEventListener("focus", onInputFocus);
  input.addEventListener("input", onInput);
  input.addEventListener("keydown", onInputKeydown);
  grid.addEventListener("click", onGridClick);
  grid.addEventListener("keydown", onKeydown);
  calendar.addEventListener("toggle", onPopoverToggle);
  render(state);

  return {
    close() {
      closeCalendar();
    },
    destroy() {
      caption.removeEventListener("click", onCaptionClick);
      previousPanelButton.removeEventListener("click", onPreviousPanelClick);
      nextPanelButton.removeEventListener("click", onNextPanelClick);
      panelTitleButton.removeEventListener("click", onPanelTitleClick);
      previousMonthButton.removeEventListener("click", onPreviousMonthClick);
      nextMonthButton.removeEventListener("click", onNextMonthClick);
      todayButton.removeEventListener("click", onTodayClick);
      input.removeEventListener("click", onInputFocus);
      input.removeEventListener("blur", onInputBlur);
      input.removeEventListener("focus", onInputFocus);
      input.removeEventListener("input", onInput);
      input.removeEventListener("keydown", onInputKeydown);
      grid.removeEventListener("click", onGridClick);
      grid.removeEventListener("keydown", onKeydown);
      calendar.removeEventListener("toggle", onPopoverToggle);
      hideNativePopover();
      root.replaceChildren();
      root.classList.remove("litopis");
      delete root.dataset.calendarOpen;
      delete root.dataset.calendarMode;
      delete root.dataset.targetSize;
    },
    getDate() {
      return getSelectedDate(state);
    },
    getValue() {
      const selected = getSelectedDate(state);
      return selected ? toIsoDate(selected) : "";
    },
    goToToday,
    open() {
      openCalendar();
    },
    setDate(value) {
      setSelectedDate(value);
    },
    setOptions,
    setVisibleMonth,
    toggle() {
      toggleCalendar();
    },
  };
}

function getCalendarStateOptions(
  options: DatePickerOptions,
  selected = options.selected ?? null,
): CalendarStateOptions {
  return {
    ...(options.firstDayOfWeek === undefined ? {} : { firstDayOfWeek: options.firstDayOfWeek }),
    ...(options.locale === undefined ? {} : { locale: options.locale }),
    ...(options.max === undefined ? {} : { max: options.max }),
    ...(options.min === undefined ? {} : { min: options.min }),
    ...(options.mode === undefined ? {} : { mode: options.mode }),
    selected,
    ...(options.today === undefined ? {} : { today: options.today }),
  };
}

function getSelectedDate(state: CalendarState): DateValue | null {
  return state.selected && "day" in state.selected ? state.selected : null;
}

function getCalendarMode(options: DatePickerOptions): DatePickerCalendarMode {
  return options.calendarMode ?? "inline";
}

function getInputFormat(options: DatePickerOptions): DateFieldFormat {
  return options.inputFormat ?? "yyyy-mm-dd";
}

function getTargetSize(options: DatePickerOptions): DatePickerTargetSize {
  return options.targetSize ?? "compact";
}

function getYearPageStart(year: number): number {
  return Math.floor(year / 12) * 12;
}
