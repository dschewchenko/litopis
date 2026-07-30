import {
  addDays,
  addMonths,
  addYears,
  compareDates,
  createCalendarGrid,
  createCalendarState,
  createEmptyDateRange,
  fromLocalDate,
  focusDate,
  formatDate,
  getDaysInMonth,
  getDateRangeBoundaries,
  MAX_YEAR,
  MIN_YEAR,
  moveFocus,
  isDateInDateRange,
  isSameDate,
  selectDate,
  selectFocusedDate,
  selectDateRange,
  selectRange,
  toIsoDate,
  toLocalDate,
  normalizeDateForGranularity,
  normalizeDateRange,
  type CalendarMove,
  type CalendarGrid,
  type CalendarGridCell,
  type CalendarState,
  type CalendarStateOptions,
  type DateRange,
  type DateValue,
} from "@litopis/core";
import {
  clampDateFieldValue,
  formatDateFieldValue,
  getDateFieldError,
  getDateFieldPlaceholder,
  isDateInRange,
  maskDateFieldEdit,
  parseDateFieldPreviewMonth,
  parseDateFieldValue,
} from "./date-field-format";
import type {
  DateFieldFormat,
  DatePickerMode,
  DatePickerController,
  DatePickerLayout,
  DatePickerOptions,
  DatePickerRange,
  DatePickerRangeOptions,
  DatePickerSelection,
  DatePickerSize,
  DatePickerValue,
  DatePickerValueAs,
} from "./types";

const keyMoves = new Map<string, CalendarMove>([
  ["ArrowRight", "next-day"],
  ["ArrowLeft", "previous-day"],
  ["ArrowDown", "next-week"],
  ["ArrowUp", "previous-week"],
  ["Home", "week-start"],
  ["End", "week-end"],
  ["PageDown", "next-month"],
  ["PageUp", "previous-month"],
]);

type PanelMode = "month" | "year";
type InputStatus = "invalid" | "valid";
type RangeEndpoint = "end" | "start";

let datePickerId = 0;

export function createDatePicker(
  root: HTMLElement,
  options?: DatePickerOptions<"date-value", "single">,
): DatePickerController<"date-value", "single">;
export function createDatePicker<ValueAs extends DatePickerValueAs = "date-value">(
  root: HTMLElement,
  options: DatePickerRangeOptions<ValueAs>,
): DatePickerController<ValueAs, "range">;
export function createDatePicker<ValueAs extends DatePickerValueAs = "date-value">(
  root: HTMLElement,
  options: DatePickerOptions<ValueAs, "single">,
): DatePickerController<ValueAs, "single">;
export function createDatePicker<
  ValueAs extends DatePickerValueAs,
  Selection extends DatePickerSelection,
>(
  root: HTMLElement,
  options: DatePickerOptions<ValueAs, Selection>,
): DatePickerController<ValueAs, Selection>;
export function createDatePicker<
  ValueAs extends DatePickerValueAs,
  Selection extends DatePickerSelection = "single",
>(
  root: HTMLElement,
  options: DatePickerOptions<ValueAs, Selection> = {},
): DatePickerController<ValueAs, Selection> {
  let currentOptions = options;
  let state = createCalendarState(getCalendarStateOptions(currentOptions));
  let range = normalizeDateRange(getInternalRange(currentOptions.range ?? createEmptyDateRange()));
  const initialRange = range;
  let calendarOpen = getCalendarMode(currentOptions) === "inline";
  let resolvedPanelCount = 1;
  let monthYearPanelOpen = getGranularity(currentOptions) !== "day";
  let panelMode: PanelMode = getGranularity(currentOptions) === "year" ? "year" : "month";
  let yearPageStart = getYearPageStart(state.visibleMonth.year);
  let suppressInputOpen = false;
  const form = root.closest("form");
  const id = `litopis-date-picker-${datePickerId}`;
  const anchorName = `--${id}-anchor`;
  datePickerId += 1;

  root.classList.add("litopis");
  root.innerHTML = "";
  resolvedPanelCount = resolvePanelCount();

  const label = document.createElement("label");
  label.className = "litopis-label";
  label.htmlFor = `${id}-input`;

  const input = document.createElement("input");
  input.autocomplete = "off";
  input.className = "litopis-input";
  input.id = `${id}-input`;
  input.inputMode = "numeric";
  input.type = "text";
  input.setAttribute("role", "combobox");
  input.setAttribute("aria-autocomplete", "none");
  input.setAttribute("aria-controls", `${id}-grid`);
  input.setAttribute("aria-haspopup", "grid");

  const endLabel = document.createElement("label");
  endLabel.className = "litopis-label";
  endLabel.htmlFor = `${id}-end-input`;

  const endInput = input.cloneNode() as HTMLInputElement;
  endInput.id = `${id}-end-input`;

  const fields = document.createElement("div");
  fields.className = "litopis-range-fields";

  const startField = document.createElement("div");
  startField.className = "litopis-range-field";
  const endField = document.createElement("div");
  endField.className = "litopis-range-field";

  const calendar = document.createElement("div");
  calendar.className = "litopis-calendar";
  calendar.id = `${id}-calendar`;

  const liveRegion = document.createElement("p");
  liveRegion.className = "litopis-live";
  liveRegion.setAttribute("aria-live", "polite");

  const fieldMessage = document.createElement("p");
  fieldMessage.className = "litopis-field-message";
  fieldMessage.id = `${id}-message`;
  fieldMessage.setAttribute("aria-live", "polite");
  input.setAttribute("aria-describedby", fieldMessage.id);

  const endFieldMessage = document.createElement("p");
  endFieldMessage.className = "litopis-field-message";
  endFieldMessage.id = `${id}-end-message`;
  endFieldMessage.setAttribute("aria-live", "polite");
  endInput.setAttribute("aria-describedby", endFieldMessage.id);

  const hiddenStartInput = document.createElement("input");
  hiddenStartInput.type = "hidden";
  const hiddenEndInput = document.createElement("input");
  hiddenEndInput.type = "hidden";
  const hiddenRangeInput = document.createElement("input");
  hiddenRangeInput.type = "hidden";
  const hiddenValueInput = document.createElement("input");
  hiddenValueInput.type = "hidden";

  const calendarHeader = document.createElement("div");
  calendarHeader.className = "litopis-calendar-header";

  const previousMonthButton = document.createElement("button");
  previousMonthButton.className = "litopis-nav-button";
  previousMonthButton.dataset.direction = "previous";
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
  nextMonthButton.dataset.direction = "next";
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
  previousPanelButton.dataset.direction = "previous";
  previousPanelButton.type = "button";

  const panelTitleButton = document.createElement("button");
  panelTitleButton.className = "litopis-panel-title";
  panelTitleButton.type = "button";

  const nextPanelButton = document.createElement("button");
  nextPanelButton.className = "litopis-panel-nav-button";
  nextPanelButton.dataset.direction = "next";
  nextPanelButton.type = "button";

  monthYearHeader.append(previousPanelButton, panelTitleButton, nextPanelButton);

  const panelGrid = document.createElement("div");
  panelGrid.className = "litopis-panel-grid litopis-month-grid";
  panelGrid.setAttribute("role", "group");

  monthYearPanel.append(monthYearHeader, panelGrid);

  const grid = document.createElement("div");
  grid.className = "litopis-grid";
  grid.id = `${id}-grid`;
  grid.setAttribute("role", "grid");

  const secondaryGrid = document.createElement("div");
  secondaryGrid.className = "litopis-grid litopis-grid-secondary";
  secondaryGrid.id = `${id}-secondary-grid`;
  secondaryGrid.setAttribute("role", "grid");

  const calendarGrids = document.createElement("div");
  calendarGrids.className = "litopis-grids";
  calendarGrids.append(grid, secondaryGrid);

  const calendarFooter = document.createElement("div");
  calendarFooter.className = "litopis-calendar-footer";

  const todayButton = document.createElement("button");
  todayButton.className = "litopis-today-button";
  todayButton.type = "button";

  const clearButton = document.createElement("button");
  clearButton.className = "litopis-clear-button";
  clearButton.type = "button";

  calendarFooter.append(clearButton, todayButton);
  calendar.append(calendarHeader, liveRegion, monthYearPanel, calendarGrids, calendarFooter);
  mountStructure();

  const resizeObserver =
    typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(() => {
          const nextPanelCount = resolvePanelCount();
          if (nextPanelCount === resolvedPanelCount) return;
          resolvedPanelCount = nextPanelCount;
          render(state);
        });
  resizeObserver?.observe(root);

  function isRangeSelection(): boolean {
    return currentOptions.selection === "range";
  }

  function hasSelection(): boolean {
    return isRangeSelection() ? Boolean(range.start || range.end) : getSelectedDate(state) !== null;
  }

  function mountStructure(): void {
    root.replaceChildren();

    if (isRangeSelection()) {
      if (getFieldLayout(currentOptions) === "split") {
        startField.append(label, input, fieldMessage);
        endField.append(endLabel, endInput, endFieldMessage);
        fields.append(startField, endField);
        root.append(fields, hiddenStartInput, hiddenEndInput, calendar);
        return;
      }

      root.append(label, input, fieldMessage, hiddenRangeInput, calendar);
      return;
    }

    root.append(label, input, fieldMessage, hiddenValueInput, calendar);
  }

  function resolvePanelCount(): 1 | 2 {
    if (getVisiblePanels(currentOptions) === 1) return 1;
    const width = root.getBoundingClientRect().width;
    if (width === 0) return getVisiblePanels(currentOptions) === 2 ? 2 : 1;
    return width >= 640 ? 2 : 1;
  }
  function getFieldMessage(target: HTMLInputElement): HTMLParagraphElement {
    return target === endInput ? endFieldMessage : fieldMessage;
  }

  function render(
    nextState: CalendarState = state,
    inputStatus: InputStatus = "valid",
    preserveInputValue = false,
  ): void {
    state = nextState;
    const selected = getSelectedDate(state);
    const format = getInputFormat(currentOptions);
    const mode = getCalendarMode(currentOptions);
    const displaySeason = currentOptions.season ?? false;

    root.dataset.mode = mode;
    root.dataset.calendarOpen = String(calendarOpen);
    root.dataset.size = getTargetSize(currentOptions);
    root.dataset.selection = currentOptions.selection ?? "single";
    root.dataset.panels = String(getVisiblePanels(currentOptions));
    root.dataset.resolvedPanels = String(resolvedPanelCount);
    setDataValue(root, "rangeComplete", String(Boolean(range.start && range.end)));
    syncPopoverMode(mode);
    label.textContent = getStartLabel(currentOptions);
    input.placeholder = getFieldPlaceholder(format, getGranularity(currentOptions));
    endLabel.textContent = getEndLabel(currentOptions);
    endInput.placeholder = getFieldPlaceholder(format, getGranularity(currentOptions));
    if (!preserveInputValue) {
      renderFieldValues(selected, format);
    }
    input.setAttribute("aria-expanded", String(calendarOpen));
    input.setAttribute("aria-invalid", String(inputStatus === "invalid"));
    fieldMessage.textContent = inputStatus === "invalid" ? "Enter a valid date." : "";
    calendar.hidden = mode === "popover" && !supportsNativePopover() && !calendarOpen;
    calendarHeader.hidden = getGranularity(currentOptions) !== "day" || monthYearPanelOpen;
    captionLabel.textContent = getCalendarCaption();
    caption.setAttribute("aria-expanded", String(monthYearPanelOpen));
    caption.disabled = getGranularity(currentOptions) !== "day";
    previousMonthButton.disabled = isAdjacentMonthDisabled(-1);
    nextMonthButton.disabled = isAdjacentMonthDisabled(1);
    season.hidden = !displaySeason;
    season.textContent = displaySeason ? getSeasonLabel(state.visibleMonth.month) : "";
    calendarFooter.hidden =
      currentOptions.todayButton !== true && currentOptions.clearButton !== true;
    clearButton.hidden = currentOptions.clearButton !== true;
    clearButton.disabled = !hasSelection();
    clearButton.textContent = currentOptions.clearLabel ?? "Clear";
    todayButton.disabled = !isDateInRange(state.today, state.min, state.max);
    todayButton.hidden = currentOptions.todayButton !== true;
    todayButton.textContent = currentOptions.todayLabel ?? "Today";
    liveRegion.textContent = `${state.grid.label}. ${formatDate(state.focusedDate, state.locale, {
      dateStyle: "full",
    })}`;
    renderMonthYearPanel();
    renderDayGrid();
    syncNativePopoverState();
  }

  function renderFieldValues(selected: DateValue | null, format: DateFieldFormat): void {
    if (!isRangeSelection()) {
      input.value = selected
        ? formatPeriodFieldValue(selected, format, getGranularity(currentOptions))
        : "";
      const boundaries = getDateRangeBoundaries(
        { end: selected, start: selected },
        getGranularity(currentOptions),
      );
      hiddenValueInput.name = typeof currentOptions.name === "string" ? currentOptions.name : "";
      hiddenValueInput.value = boundaries.start ? toIsoDate(boundaries.start) : "";
      return;
    }

    const granularity = getGranularity(currentOptions);
    const start = range.start ? formatPeriodFieldValue(range.start, format, granularity) : "";
    const end = range.end ? formatPeriodFieldValue(range.end, format, granularity) : "";
    const boundaries = getDateRangeBoundaries(range, granularity);
    hiddenStartInput.name = getRangeFieldName(currentOptions, "start");
    hiddenStartInput.value = boundaries.start ? toIsoDate(boundaries.start) : "";
    hiddenEndInput.name = getRangeFieldName(currentOptions, "end");
    hiddenEndInput.value = boundaries.end ? toIsoDate(boundaries.end) : "";
    hiddenRangeInput.name = typeof currentOptions.name === "string" ? currentOptions.name : "";
    hiddenRangeInput.value =
      boundaries.start && boundaries.end
        ? `${toIsoDate(boundaries.start)}/${toIsoDate(boundaries.end)}`
        : "";

    if (getFieldLayout(currentOptions) === "split") {
      input.value = start;
      endInput.value = end;
      return;
    }

    input.value = start && end ? `${start} – ${end}` : start;
  }

  function getCalendarCaption(): string {
    if (resolvedPanelCount === 1) return state.grid.label;

    const followingMonth = addMonths(state.visibleMonth, 1);
    if (followingMonth.year === state.visibleMonth.year) {
      return `${formatDate(state.visibleMonth, state.locale, { month: "long" })} – ${formatDate(followingMonth, state.locale, { month: "long", year: "numeric" })}`;
    }

    return `${state.grid.label} – ${formatDate(followingMonth, state.locale, { month: "long", year: "numeric" })}`;
  }

  function renderDayGrid(): void {
    renderDayGridFor(grid, state.grid);
    if (resolvedPanelCount === 1) {
      secondaryGrid.hidden = true;
      return;
    }

    const secondaryMonth = addMonths(state.visibleMonth, 1);
    const secondaryCalendarGrid = createCalendarGrid(
      secondaryMonth,
      state.selected,
      state.today,
      state.locale,
      state.firstDayOfWeek,
      state.min,
      state.max,
      state.range,
    );
    renderDayGridFor(secondaryGrid, secondaryCalendarGrid);
  }

  function renderDayGridFor(target: HTMLElement, calendarGrid: CalendarGrid): void {
    setAttribute(target, "aria-label", calendarGrid.label);
    target.hidden = monthYearPanelOpen;
    ensureDayGridStructure(target, calendarGrid.weeks.length);
    syncWeekdays(target);

    const dayCells = target.querySelectorAll<HTMLElement>(".litopis-day");
    let dayIndex = 0;

    for (const week of calendarGrid.weeks) {
      for (const cell of week) {
        syncDayCell(dayCells[dayIndex]!, cell);
        dayIndex += 1;
      }
    }
  }

  function ensureDayGridStructure(target: HTMLElement, weekCount: number): void {
    if (target.children.length === weekCount + 1) return;

    const rows = [createWeekdaysRow()];

    for (let weekIndex = 0; weekIndex < weekCount; weekIndex += 1) {
      rows.push(createDayRow());
    }

    target.replaceChildren(...rows);
  }

  function createWeekdaysRow(): HTMLElement {
    const row = document.createElement("div");
    row.className = "litopis-week litopis-weekdays";
    row.setAttribute("role", "row");

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const weekday = document.createElement("div");
      weekday.className = "litopis-weekday";
      weekday.setAttribute("role", "columnheader");
      row.append(weekday);
    }

    return row;
  }

  function createDayRow(): HTMLElement {
    const row = document.createElement("div");
    row.className = "litopis-week";
    row.setAttribute("role", "row");

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const day = document.createElement("div");
      day.className = "litopis-day";
      row.append(day);
    }

    return row;
  }

  function syncWeekdays(target: HTMLElement): void {
    const weekdays = target.querySelectorAll<HTMLElement>(".litopis-weekday");

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const weekdayOffset = (state.firstDayOfWeek + dayIndex) % 7;
      const label = formatDate(
        addDays({ day: 4, month: 1, year: 2026 }, weekdayOffset),
        state.locale,
        { weekday: "short" },
      );
      setText(weekdays[dayIndex]!, label);
    }
  }

  function syncDayCell(day: HTMLElement, cell: CalendarGridCell): void {
    const hidden = !cell.date || (cell.outsideMonth && currentOptions.outsideDays === false);

    if (hidden) {
      clearDayCell(day);
      return;
    }

    const date = cell.date!;
    const button = getDayButton(day);
    day.classList.remove("litopis-day-empty");
    day.removeAttribute("aria-hidden");
    setAttribute(day, "aria-selected", String(cell.selected));
    setAttribute(day, "role", "gridcell");
    setDataValue(day, "isoDate", toIsoDate(date));
    setDataState(day, "inRange", cell.inRange);
    setDataState(day, "outsideMonth", cell.outsideMonth);
    setDataState(day, "rangeEnd", cell.rangeEnd);
    setDataState(day, "rangeStart", cell.rangeStart);
    setDataState(day, "selected", cell.selected);
    setDataState(day, "today", cell.today);
    setDisabled(button, cell.disabled);
    const tabIndex = toIsoDate(date) === toIsoDate(state.focusedDate) ? 0 : -1;
    if (button.getAttribute("tabindex") !== String(tabIndex)) {
      button.tabIndex = tabIndex;
    }
    setText(button, String(date.day));
    setAttribute(button, "aria-label", formatDate(date, state.locale, { dateStyle: "full" }));

    if (cell.today) {
      setAttribute(button, "aria-current", "date");
    } else {
      removeAttribute(button, "aria-current");
    }
  }

  function clearDayCell(day: HTMLElement): void {
    day.classList.add("litopis-day-empty");
    setAttribute(day, "aria-hidden", "true");
    setAttribute(day, "role", "presentation");
    removeAttribute(day, "aria-selected");
    delete day.dataset.isoDate;
    setDataState(day, "inRange", false);
    setDataState(day, "outsideMonth", false);
    setDataState(day, "rangeEnd", false);
    setDataState(day, "rangeStart", false);
    setDataState(day, "selected", false);
    setDataState(day, "today", false);

    if (day.hasChildNodes()) {
      day.replaceChildren();
    }
  }

  function getDayButton(day: HTMLElement): HTMLButtonElement {
    const existingButton = day.querySelector<HTMLButtonElement>(".litopis-day-button");
    if (existingButton) return existingButton;

    const button = document.createElement("button");
    button.className = "litopis-day-button";
    button.type = "button";
    day.append(button);
    return button;
  }

  function setDataState(
    element: HTMLElement,
    stateName: keyof DOMStringMap,
    active: boolean,
  ): void {
    if (active) {
      setDataValue(element, stateName, "");
      return;
    }

    if (stateName in element.dataset) {
      delete element.dataset[stateName];
    }
  }

  function setDataValue(element: HTMLElement, name: keyof DOMStringMap, value: string): void {
    if (element.dataset[name] !== value) {
      element.dataset[name] = value;
    }
  }

  function setText(element: HTMLElement, value: string): void {
    if (element.textContent !== value) {
      element.textContent = value;
    }
  }

  function setAttribute(element: HTMLElement, name: string, value: string): void {
    if (element.getAttribute(name) !== value) {
      element.setAttribute(name, value);
    }
  }

  function removeAttribute(element: HTMLElement, name: string): void {
    if (element.hasAttribute(name)) {
      element.removeAttribute(name);
    }
  }

  function setDisabled(button: HTMLButtonElement, disabled: boolean): void {
    if (button.disabled !== disabled) {
      button.disabled = disabled;
    }
  }

  function renderMonthYearPanel(): void {
    monthYearPanel.hidden = !monthYearPanelOpen;
    if (!monthYearPanelOpen) return;

    if (panelMode === "year") {
      ensurePeriodPanelStructure("year");
      setAttribute(panelGrid, "aria-label", "Choose year");
      renderYearPanel();
      return;
    }

    ensurePeriodPanelStructure("month");
    setAttribute(panelGrid, "aria-label", "Choose month");
    renderMonthPanel();
  }

  function ensurePeriodPanelStructure(mode: PanelMode): void {
    const buttonClass = mode === "month" ? "litopis-month-button" : "litopis-year-button";
    const panelClass =
      mode === "month"
        ? "litopis-panel-grid litopis-month-grid"
        : "litopis-panel-grid litopis-year-grid";

    if (panelGrid.className === panelClass && panelGrid.children.length === 12) return;

    panelGrid.className = panelClass;
    const buttons: HTMLButtonElement[] = [];

    for (let index = 0; index < 12; index += 1) {
      const button = document.createElement("button");
      button.className = buttonClass;
      button.type = "button";
      buttons.push(button);
    }

    panelGrid.replaceChildren(...buttons);
  }

  function renderMonthPanel(): void {
    setText(panelTitleButton, String(state.visibleMonth.year));
    setAttribute(panelTitleButton, "aria-label", "Choose year");
    setDisabled(previousPanelButton, isYearDisabled(state.visibleMonth.year - 1));
    setDisabled(nextPanelButton, isYearDisabled(state.visibleMonth.year + 1));
    setAttribute(previousPanelButton, "aria-label", "Previous year");
    setAttribute(nextPanelButton, "aria-label", "Next year");
    const monthButtons = panelGrid.querySelectorAll<HTMLButtonElement>(".litopis-month-button");

    for (let month = 1; month <= 12; month += 1) {
      const monthButton = monthButtons[month - 1]!;
      setDisabled(monthButton, isMonthDisabled(month, state.visibleMonth.year, state));
      setText(
        monthButton,
        formatDate({ day: 1, month, year: state.visibleMonth.year }, state.locale, {
          month: "short",
        }),
      );
      setDataValue(monthButton, "month", String(month));

      syncPeriodSelection(
        monthButton,
        { day: 1, month, year: state.visibleMonth.year },
        !isRangeSelection() && month === state.visibleMonth.month,
      );
    }
  }

  function renderYearPanel(): void {
    const yearPageEnd = yearPageStart + 11;
    setText(panelTitleButton, `${yearPageStart}–${yearPageEnd}`);
    setDisabled(panelTitleButton, getGranularity(currentOptions) === "year");
    setAttribute(panelTitleButton, "aria-label", "Current year page");
    setDisabled(previousPanelButton, isYearRangeDisabled(yearPageStart - 12, yearPageStart - 1));
    setDisabled(nextPanelButton, isYearRangeDisabled(yearPageStart + 12, yearPageStart + 23));
    setAttribute(previousPanelButton, "aria-label", "Previous years");
    setAttribute(nextPanelButton, "aria-label", "Next years");
    const yearButtons = panelGrid.querySelectorAll<HTMLButtonElement>(".litopis-year-button");

    for (let year = yearPageStart; year <= yearPageEnd; year += 1) {
      const yearButton = yearButtons[year - yearPageStart]!;
      setDisabled(yearButton, isYearDisabled(year));
      setText(yearButton, String(year));
      setDataValue(yearButton, "year", String(year));

      syncPeriodSelection(
        yearButton,
        { day: 1, month: 1, year },
        !isRangeSelection() && year === state.visibleMonth.year,
      );
    }
  }

  function isMonthDisabled(month: number, year: number, calendarState: CalendarState): boolean {
    if (year < MIN_YEAR || year > MAX_YEAR) {
      return true;
    }

    const monthStart = { day: 1, month, year };
    const monthEnd = { day: getDaysInMonth(monthStart), month, year };

    return Boolean(
      (calendarState.min && compareDates(monthEnd, calendarState.min) < 0) ||
      (calendarState.max && compareDates(monthStart, calendarState.max) > 0),
    );
  }

  function syncPeriodSelection(
    button: HTMLButtonElement,
    value: DateValue,
    selected: boolean,
  ): void {
    const normalized = normalizeDateForGranularity(value, getGranularity(currentOptions));
    const rangeStart = Boolean(
      isRangeSelection() && range.start && isSameDate(normalized, range.start),
    );
    const rangeEnd = Boolean(isRangeSelection() && range.end && isSameDate(normalized, range.end));
    const inRange =
      isRangeSelection() && isDateInDateRange(normalized, range, getGranularity(currentOptions));
    setDataState(button, "inRange", inRange);
    setDataState(button, "rangeEnd", rangeEnd);
    setDataState(button, "rangeStart", rangeStart);
    setDataState(button, "selected", selected);

    if (rangeStart || rangeEnd || selected) {
      setAttribute(button, "aria-pressed", "true");
      return;
    }

    removeAttribute(button, "aria-pressed");
  }

  function isYearDisabled(year: number): boolean {
    return isYearRangeDisabled(year, year);
  }

  function isYearRangeDisabled(startYear: number, endYear: number): boolean {
    return Boolean(
      endYear < MIN_YEAR ||
      startYear > MAX_YEAR ||
      (state.min && endYear < state.min.year) ||
      (state.max && startYear > state.max.year),
    );
  }

  function isAdjacentMonthDisabled(direction: -1 | 1): boolean {
    const month = addMonths(state.visibleMonth, direction);
    return (
      (month.month === state.visibleMonth.month && month.year === state.visibleMonth.year) ||
      isMonthDisabled(month.month, month.year, state)
    );
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
    if (isRangeSelection()) {
      setSelectedRange(
        value
          ? selectDateRange(range, value, getGranularity(currentOptions))
          : createEmptyDateRange(),
      );
      return;
    }

    input.value = value ? formatDateFieldValue(value, getInputFormat(currentOptions)) : "";
    const nextState = selectDate(state, value);
    yearPageStart = getYearPageStart(nextState.visibleMonth.year);
    render(nextState);
    emitValueChange(getSelectedDate(nextState));
  }

  function setSelectedRange(value: DateRange, preserveVisibleMonth = false): void {
    range = normalizeDateRange(value, getGranularity(currentOptions));
    const nextState = preserveVisibleMonth ? getRangeSelectionState() : selectRange(state, range);
    yearPageStart = getYearPageStart(nextState.visibleMonth.year);
    render(nextState);
    emitRangeChange(range);
  }

  function emitValueChange(value: DateValue | null): void {
    currentOptions.onValueChange?.(getPublicDate(value, currentOptions.valueAs));
  }

  function emitRangeChange(value: DateRange): void {
    currentOptions.onRangeChange?.(
      getPublicRange(value, getGranularity(currentOptions), currentOptions.valueAs),
    );
  }

  function selectPeriod(value: DateValue): void {
    const normalized = normalizeDateForGranularity(value, getGranularity(currentOptions));

    if (isRangeSelection()) {
      const nextRange = selectDateRange(range, normalized, getGranularity(currentOptions));
      setSelectedRange(nextRange, true);

      if (nextRange.end) {
        closeAfterSelection();
      }
      return;
    }

    setSelectedDate(normalized);
    closeAfterSelection();
  }

  function getRangeSelectionState(): CalendarState {
    return {
      ...state,
      grid: createCalendarGrid(
        state.visibleMonth,
        null,
        state.today,
        state.locale,
        state.firstDayOfWeek,
        state.min,
        state.max,
        range,
      ),
      range,
      selected: null,
    };
  }

  function setVisibleMonth(value: DateValue): void {
    const nextState = focusDate(state, { day: 1, month: value.month, year: value.year });
    yearPageStart = getYearPageStart(nextState.visibleMonth.year);
    render(nextState);
  }

  function goToToday(): void {
    const nextState = focusDate(state, state.today);
    yearPageStart = getYearPageStart(nextState.visibleMonth.year);
    monthYearPanelOpen = getGranularity(currentOptions) !== "day";
    panelMode = getGranularity(currentOptions) === "year" ? "year" : "month";
    render(nextState);
  }

  function setOptions(nextOptions: DatePickerOptions<ValueAs, Selection>): void {
    const previousMode = getCalendarMode(currentOptions);
    const previousSelection = isRangeSelection();
    const previousLayout = getFieldLayout(currentOptions);
    currentOptions = nextOptions;
    const selected = Object.hasOwn(nextOptions, "selected")
      ? getInternalDate(nextOptions.selected ?? null)
      : state.selected;
    range = Object.hasOwn(nextOptions, "range")
      ? normalizeDateRange(
          getInternalRange(nextOptions.range ?? createEmptyDateRange()),
          getGranularity(nextOptions),
        )
      : range;
    state = createCalendarState(getCalendarStateOptions(currentOptions, selected));
    state = isRangeSelection() ? selectRange(state, range) : state;
    resolvedPanelCount = resolvePanelCount();
    yearPageStart = getYearPageStart(state.visibleMonth.year);

    if (getGranularity(currentOptions) !== "day") {
      monthYearPanelOpen = true;
      panelMode = getGranularity(currentOptions) === "year" ? "year" : "month";
    }

    if (getCalendarMode(currentOptions) === "inline") {
      calendarOpen = true;
    } else if (previousMode === "inline") {
      calendarOpen = false;
      monthYearPanelOpen = false;
    }

    if (
      previousSelection !== isRangeSelection() ||
      (isRangeSelection() && previousLayout !== getFieldLayout(currentOptions))
    ) {
      mountStructure();
    }

    render(state);
  }

  function onKeydown(event: KeyboardEvent): void {
    const move = keyMoves.get(event.key);

    if (move) {
      event.preventDefault();
      const keyboardMove = event.shiftKey
        ? move === "next-month"
          ? "next-year"
          : move === "previous-month"
            ? "previous-year"
            : move
        : move;
      render(moveFocus(state, keyboardMove));
      focusCurrentDay();
      return;
    }

    if (event.key === "Escape" && getCalendarMode(currentOptions) === "popover") {
      event.preventDefault();
      closeCalendarAndFocusInput();
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectPeriod(state.focusedDate);
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

    selectPeriod(date);
  }

  function onPeriodPanelClick(event: MouseEvent): void {
    const button =
      event.target instanceof Element
        ? event.target.closest(".litopis-month-button, .litopis-year-button")
        : null;

    if (!(button instanceof HTMLButtonElement) || button.disabled) {
      return;
    }

    if (panelMode === "month") {
      const month = Number(button.dataset.month);
      if (!Number.isInteger(month)) return;

      if (getGranularity(currentOptions) === "month") {
        selectPeriod({ day: 1, month, year: state.visibleMonth.year });
        return;
      }

      monthYearPanelOpen = false;
      focusMonthYear(month, state.visibleMonth.year);
      return;
    }

    const year = Number(button.dataset.year);
    if (!Number.isInteger(year)) return;

    if (getGranularity(currentOptions) === "year") {
      selectPeriod({ day: 1, month: 1, year });
      return;
    }

    panelMode = "month";
    focusMonthYear(state.visibleMonth.month, year);
  }

  function focusCurrentDay(): void {
    const current = calendarGrids.querySelector<HTMLButtonElement>(
      ".litopis-day-button[tabindex='0']",
    );
    current?.focus({ preventScroll: true });
  }

  function onInput(target: HTMLInputElement = input, endpoint: RangeEndpoint = "start"): void {
    openCalendar();
    const format = getInputFormat(currentOptions);
    applyInputMask(target, format);

    if (isRangeSelection() && getFieldLayout(currentOptions) === "single") {
      const parsedRange = parseRangeFieldValue(
        target.value,
        format,
        getGranularity(currentOptions),
      );
      if (parsedRange) setSelectedRange(parsedRange);
      return;
    }

    const parsed = parsePeriodFieldValue(target.value, format, getGranularity(currentOptions));
    if (target.value.length === 0) {
      if (isRangeSelection()) {
        setSelectedRange({ ...range, [endpoint]: null });
      } else {
        setSelectedDate(null);
      }
      return;
    }

    if (parsed) {
      if (!isDateInRange(parsed, state.min, state.max)) {
        target.setAttribute("aria-invalid", "true");
        getFieldMessage(target).textContent = getDateFieldError(parsed, state.min, state.max);
        return;
      }

      if (isRangeSelection()) {
        setSelectedRange({ ...range, [endpoint]: parsed });
      } else {
        const nextState = selectFocusedDate(focusDate(state, parsed));
        render(nextState);
        emitValueChange(getSelectedDate(nextState));
      }
      return;
    }

    const previewMonth = parseDateFieldPreviewMonth(target.value, format, state.visibleMonth.year);
    if (previewMonth && !isMonthDisabled(previewMonth.month, previewMonth.year, state)) {
      render(focusDate(state, previewMonth), "valid", true);
      return;
    }

    target.setAttribute("aria-invalid", "false");
    getFieldMessage(target).textContent = "";
  }

  function onStartInput(): void {
    onInput(input, "start");
  }

  function onEndInput(): void {
    onInput(endInput, "end");
  }

  function applyInputMask(target: HTMLInputElement, format: DateFieldFormat): void {
    if (isRangeSelection() && getFieldLayout(currentOptions) === "single") {
      target.value = maskRangeFieldEdit(target.value, format, getGranularity(currentOptions));
      return;
    }

    if (getGranularity(currentOptions) !== "day") {
      target.value = maskPeriodFieldEdit(
        target.value,
        getInputFormat(currentOptions),
        getGranularity(currentOptions),
      );
      return;
    }

    const masked = maskDateFieldEdit(
      target.value,
      format,
      target.selectionStart,
      target.selectionEnd,
    );
    target.value = masked.value;

    if (document.activeElement === target) {
      target.setSelectionRange(masked.selectionStart, masked.selectionEnd);
    }
  }

  function commitInputValue(
    target: HTMLInputElement = input,
    endpoint: RangeEndpoint = "start",
  ): void {
    const format = getInputFormat(currentOptions);
    if (target.value.length === 0) {
      if (isRangeSelection()) {
        setSelectedRange({ ...range, [endpoint]: null });
      } else {
        setSelectedDate(null);
      }
      target.setAttribute("aria-invalid", "false");
      getFieldMessage(target).textContent = "";
      return;
    }

    const parsed =
      isRangeSelection() && getFieldLayout(currentOptions) === "single"
        ? parseRangeFieldValue(target.value, format, getGranularity(currentOptions))
        : parsePeriodFieldValue(target.value, format, getGranularity(currentOptions));
    if (!parsed) {
      render(state);
      target.setAttribute("aria-invalid", "false");
      getFieldMessage(target).textContent = "";
      return;
    }

    if (isDateRange(parsed)) {
      setSelectedRange(parsed);
    } else if (isRangeSelection()) {
      setSelectedRange({ ...range, [endpoint]: clampDateFieldValue(parsed, state.min, state.max) });
    } else {
      setSelectedDate(clampDateFieldValue(parsed, state.min, state.max));
    }
    target.setAttribute("aria-invalid", "false");
    getFieldMessage(target).textContent = "";
  }

  function onInputFocus(): void {
    if (suppressInputOpen) {
      return;
    }

    openCalendar();
  }

  function onInputBlur(
    event: FocusEvent,
    target: HTMLInputElement = input,
    endpoint: RangeEndpoint = "start",
  ): void {
    if (event.relatedTarget instanceof Node && calendar.contains(event.relatedTarget)) {
      return;
    }

    commitInputValue(target, endpoint);
  }

  function onEndInputBlur(event: FocusEvent): void {
    onInputBlur(event, endInput, "end");
  }

  function onInputKeydown(
    event: KeyboardEvent,
    target: HTMLInputElement = input,
    endpoint: RangeEndpoint = "start",
  ): void {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openCalendar();
      focusCurrentDay();
      return;
    }

    if (event.key === "Enter") {
      commitInputValue(target, endpoint);
      return;
    }

    if (event.key === "Escape") {
      closeCalendar();
    }
  }

  function onEndInputKeydown(event: KeyboardEvent): void {
    onInputKeydown(event, endInput, "end");
  }

  function onFormReset(): void {
    queueMicrotask(() => {
      if (isRangeSelection()) {
        setSelectedRange(initialRange);
        return;
      }

      setSelectedDate(getInternalDate(currentOptions.selected ?? null));
    });
  }

  function onCaptionClick(): void {
    openCalendar();
    if (getGranularity(currentOptions) !== "day") {
      monthYearPanelOpen = true;
      panelMode = getGranularity(currentOptions) === "year" ? "year" : "month";
      render(state);
      return;
    }

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
    if (getGranularity(currentOptions) === "year") return;

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

  function onClearClick(): void {
    if (isRangeSelection()) {
      setSelectedRange(createEmptyDateRange(), true);
      return;
    }

    setSelectedDate(null);
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
    monthYearPanelOpen = getGranularity(currentOptions) !== "day";
    panelMode = getGranularity(currentOptions) === "year" ? "year" : "month";
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
    if (getCalendarMode(currentOptions) === "popover" && currentOptions.closeOnSelect !== false) {
      closeCalendarAndFocusInput();
      return;
    }

    if (getGranularity(currentOptions) === "day") {
      focusCurrentDay();
    }
  }

  function closeCalendarAndFocusInput(): void {
    suppressInputOpen = true;
    closeCalendar();
    input.focus();
    setTimeout(() => {
      suppressInputOpen = false;
    }, 0);
  }

  function syncPopoverMode(mode: DatePickerMode): void {
    if (mode === "popover") {
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
  panelGrid.addEventListener("click", onPeriodPanelClick);
  previousMonthButton.addEventListener("click", onPreviousMonthClick);
  nextMonthButton.addEventListener("click", onNextMonthClick);
  todayButton.addEventListener("click", onTodayClick);
  clearButton.addEventListener("click", onClearClick);
  input.addEventListener("click", onInputFocus);
  input.addEventListener("blur", onInputBlur);
  input.addEventListener("focus", onInputFocus);
  input.addEventListener("input", onStartInput);
  input.addEventListener("keydown", onInputKeydown);
  endInput.addEventListener("click", onInputFocus);
  endInput.addEventListener("blur", onEndInputBlur);
  endInput.addEventListener("focus", onInputFocus);
  endInput.addEventListener("input", onEndInput);
  endInput.addEventListener("keydown", onEndInputKeydown);
  grid.addEventListener("click", onGridClick);
  grid.addEventListener("keydown", onKeydown);
  secondaryGrid.addEventListener("click", onGridClick);
  secondaryGrid.addEventListener("keydown", onKeydown);
  calendar.addEventListener("toggle", onPopoverToggle);
  form?.addEventListener("reset", onFormReset);
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
      panelGrid.removeEventListener("click", onPeriodPanelClick);
      previousMonthButton.removeEventListener("click", onPreviousMonthClick);
      nextMonthButton.removeEventListener("click", onNextMonthClick);
      todayButton.removeEventListener("click", onTodayClick);
      clearButton.removeEventListener("click", onClearClick);
      input.removeEventListener("click", onInputFocus);
      input.removeEventListener("blur", onInputBlur);
      input.removeEventListener("focus", onInputFocus);
      input.removeEventListener("input", onStartInput);
      input.removeEventListener("keydown", onInputKeydown);
      endInput.removeEventListener("click", onInputFocus);
      endInput.removeEventListener("blur", onEndInputBlur);
      endInput.removeEventListener("focus", onInputFocus);
      endInput.removeEventListener("input", onEndInput);
      endInput.removeEventListener("keydown", onEndInputKeydown);
      grid.removeEventListener("click", onGridClick);
      grid.removeEventListener("keydown", onKeydown);
      secondaryGrid.removeEventListener("click", onGridClick);
      secondaryGrid.removeEventListener("keydown", onKeydown);
      calendar.removeEventListener("toggle", onPopoverToggle);
      form?.removeEventListener("reset", onFormReset);
      resizeObserver?.disconnect();
      hideNativePopover();
      root.replaceChildren();
      root.classList.remove("litopis");
      delete root.dataset.calendarOpen;
      delete root.dataset.mode;
      delete root.dataset.size;
      delete root.dataset.selection;
      delete root.dataset.panels;
      delete root.dataset.rangeComplete;
      delete root.dataset.resolvedPanels;
    },
    getInputValue() {
      return getFormattedSelectionValue(range, getSelectedDate(state), currentOptions);
    },
    getISOValue() {
      if (isRangeSelection()) {
        const boundaries = getDateRangeBoundaries(range, getGranularity(currentOptions));
        return boundaries.start && boundaries.end
          ? `${toIsoDate(boundaries.start)}/${toIsoDate(boundaries.end)}`
          : "";
      }
      const selected = getSelectedDate(state);
      return selected ? toIsoDate(selected) : "";
    },
    getValue() {
      return (
        isRangeSelection()
          ? getPublicRange(range, getGranularity(currentOptions), currentOptions.valueAs)
          : getPublicDate(getSelectedDate(state), currentOptions.valueAs)
      ) as never;
    },
    goToToday,
    open() {
      openCalendar();
    },
    setDate(value) {
      setSelectedDate(getInternalDate(value));
    },
    setRange(value) {
      setSelectedRange(getInternalRange(value));
    },
    setOptions,
    setVisibleMonth,
    toggle() {
      toggleCalendar();
    },
  };
}

function getCalendarStateOptions<ValueAs extends DatePickerValueAs>(
  options: DatePickerOptions<ValueAs>,
  selected = getInternalDate(options.selected ?? null),
): CalendarStateOptions {
  return {
    ...(options.firstDayOfWeek === undefined ? {} : { firstDayOfWeek: options.firstDayOfWeek }),
    ...(options.locale === undefined ? {} : { locale: options.locale }),
    ...(options.max === undefined ? {} : { max: options.max }),
    ...(options.min === undefined ? {} : { min: options.min }),
    ...(options.range === undefined ? {} : { range: getInternalRange(options.range) }),
    selected,
    selectionMode: options.selection ?? "single",
    ...(options.today === undefined ? {} : { today: options.today }),
  };
}

function getSelectedDate(state: CalendarState): DateValue | null {
  return state.selected;
}

function getCalendarMode<ValueAs extends DatePickerValueAs>(
  options: DatePickerOptions<ValueAs>,
): DatePickerMode {
  return options.mode ?? "inline";
}

function getInputFormat<ValueAs extends DatePickerValueAs>(
  options: DatePickerOptions<ValueAs>,
): DateFieldFormat {
  return options.format ?? "yyyy-mm-dd";
}

function getGranularity<ValueAs extends DatePickerValueAs>(
  options: DatePickerOptions<ValueAs>,
): "day" | "month" | "year" {
  return options.granularity ?? "day";
}

function getFieldLayout<ValueAs extends DatePickerValueAs>(
  options: DatePickerOptions<ValueAs>,
): DatePickerLayout {
  return options.layout ?? (options.selection === "range" ? "split" : "single");
}

function getStartLabel<ValueAs extends DatePickerValueAs>(
  options: DatePickerOptions<ValueAs>,
): string {
  if (options.selection === "range") {
    if (typeof options.label === "object") return options.label.start;
    if (getFieldLayout(options) === "single" && typeof options.label === "string") {
      return options.label;
    }

    return "Start";
  }

  return typeof options.label === "string" ? options.label : "Date";
}

function getEndLabel<ValueAs extends DatePickerValueAs>(
  options: DatePickerOptions<ValueAs>,
): string {
  return typeof options.label === "object" ? options.label.end : "End";
}

function getRangeFieldName<ValueAs extends DatePickerValueAs>(
  options: DatePickerOptions<ValueAs>,
  endpoint: RangeEndpoint,
): string {
  if (typeof options.name === "string") {
    return `${options.name}[${endpoint}]`;
  }

  return options.name?.[endpoint] ?? "";
}

function getFieldPlaceholder(
  format: DateFieldFormat,
  granularity: "day" | "month" | "year",
): string {
  if (granularity === "year") return "YYYY";
  if (granularity === "month") return format === "yyyy-mm-dd" ? "YYYY-MM" : "MM.YYYY";
  return getDateFieldPlaceholder(format);
}

function formatPeriodFieldValue(
  value: DateValue,
  format: DateFieldFormat,
  granularity: "day" | "month" | "year",
): string {
  if (granularity === "day") return formatDateFieldValue(value, format);
  if (granularity === "year") return String(value.year).padStart(4, "0");

  const year = String(value.year).padStart(4, "0");
  const month = String(value.month).padStart(2, "0");
  return format === "yyyy-mm-dd" ? `${year}-${month}` : `${month}.${year}`;
}

function parsePeriodFieldValue(
  value: string,
  format: DateFieldFormat,
  granularity: "day" | "month" | "year",
): DateValue | null {
  if (granularity === "day") return parseDateFieldValue(value, format);
  const digits = value.replace(/\D/g, "");

  if (granularity === "year") {
    return digits.length === 4 ? { day: 1, month: 1, year: Number(digits) } : null;
  }

  if (digits.length !== 6) return null;
  const year = format === "yyyy-mm-dd" ? Number(digits.slice(0, 4)) : Number(digits.slice(2, 6));
  const month = format === "yyyy-mm-dd" ? Number(digits.slice(4, 6)) : Number(digits.slice(0, 2));
  return month >= 1 && month <= 12 ? { day: 1, month, year } : null;
}

function maskPeriodFieldEdit(
  value: string,
  format: DateFieldFormat,
  granularity: "day" | "month" | "year",
): string {
  const digits = value.replace(/\D/g, "");
  if (granularity === "day") return value;
  if (granularity === "year") return digits.slice(0, 4);
  const clipped = digits.slice(0, 6);
  if (format === "yyyy-mm-dd") {
    return clipped.length > 4 ? `${clipped.slice(0, 4)}-${clipped.slice(4)}` : clipped;
  }

  return clipped.length > 2 ? `${clipped.slice(0, 2)}.${clipped.slice(2)}` : clipped;
}

function parseRangeFieldValue(
  value: string,
  format: DateFieldFormat,
  granularity: "day" | "month" | "year",
): DateRange | null {
  const [start, end, extra] = value.split(/\s*[–—]\s*/);
  if (!start || !end || extra) return null;
  const parsedStart = parsePeriodFieldValue(start, format, granularity);
  const parsedEnd = parsePeriodFieldValue(end, format, granularity);
  if (!parsedStart || !parsedEnd) return null;
  return normalizeDateRange({ end: parsedEnd, start: parsedStart }, granularity);
}

function maskRangeFieldEdit(
  value: string,
  format: DateFieldFormat,
  granularity: "day" | "month" | "year",
): string {
  const width = granularity === "day" ? 8 : granularity === "month" ? 6 : 4;
  const digits = value.replace(/\D/g, "").slice(0, width * 2);
  const start = digits.slice(0, width);
  const end = digits.slice(width);
  const formatPartial = (part: string): string => {
    if (granularity === "day")
      return maskDateFieldEdit(part, format, part.length, part.length).value;
    return maskPeriodFieldEdit(part, format, granularity);
  };

  if (!end) return formatPartial(start);
  return `${formatPartial(start)} – ${formatPartial(end)}`;
}

function getInternalDate(value: DateValue | Date | null): DateValue | null {
  if (!value) {
    return null;
  }

  return value instanceof Date ? fromLocalDate(value) : value;
}

function getInternalRange(range: DatePickerRange<DatePickerValueAs> | DateRange): DateRange {
  return {
    end: getInternalDate(range.end),
    start: getInternalDate(range.start),
  };
}

function getPublicDate<ValueAs extends DatePickerValueAs>(
  value: DateValue | null,
  valueAs: ValueAs | undefined,
): DatePickerValue<ValueAs> | null {
  if (!value) {
    return null;
  }

  return (valueAs === "date" ? toLocalDate(value) : value) as DatePickerValue<ValueAs>;
}

function getPublicRange<ValueAs extends DatePickerValueAs>(
  range: DateRange,
  granularity: "day" | "month" | "year",
  valueAs: ValueAs | undefined,
): DatePickerRange<ValueAs> {
  const boundaries = getDateRangeBoundaries(range, granularity);

  return {
    end: getPublicDate(boundaries.end, valueAs),
    start: getPublicDate(boundaries.start, valueAs),
  };
}

function getFormattedSelectionValue<ValueAs extends DatePickerValueAs>(
  range: DateRange,
  selected: DateValue | null,
  options: DatePickerOptions<ValueAs>,
): string {
  const format = getInputFormat(options);
  const granularity = getGranularity(options);

  if (options.selection !== "range") {
    return selected ? formatPeriodFieldValue(selected, format, granularity) : "";
  }

  const start = range.start ? formatPeriodFieldValue(range.start, format, granularity) : "";
  const end = range.end ? formatPeriodFieldValue(range.end, format, granularity) : "";

  return start && end ? `${start} – ${end}` : start || end;
}

function isDateRange(value: DateValue | DateRange): value is DateRange {
  return "start" in value;
}

function getTargetSize<ValueAs extends DatePickerValueAs>(
  options: DatePickerOptions<ValueAs>,
): DatePickerSize {
  return options.size ?? "compact";
}

function getVisiblePanels<ValueAs extends DatePickerValueAs>(
  options: DatePickerOptions<ValueAs>,
): 1 | 2 | "auto" {
  if (options.selection !== "range") return 1;
  return options.panels ?? "auto";
}

function getYearPageStart(year: number): number {
  return Math.floor(year / 12) * 12;
}
