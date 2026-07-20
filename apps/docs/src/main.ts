import "@litopis/dom/styles/daisyui.css";
import { createDatePicker } from "@litopis/dom";
import {
  addDays,
  addMonths,
  createCalendarState,
  getToday,
  moveFocus,
  selectFocusedDate,
  toIsoDate,
} from "@litopis/core";
import type { CalendarMove, CalendarState } from "@litopis/core";
import type { DatePickerOptions, DateValue } from "@litopis/dom";
import "./styles.css";

const today = getToday();
const minBookingDate = addDays(today, -15);
const maxBookingDate = addDays(today, 15);
const programmaticDate = addDays(today, 9);
const programmaticMonth = startOfMonth(addMonths(today, 6));

const pickerOptions: Record<string, DatePickerOptions> = {
  bounds: {
    label: "Booking date",
    max: maxBookingDate,
    min: minBookingDate,
    showOutsideDays: false,
    today,
  },
  "example-basic": {
    label: "Appointment date",
    onValueChange: updateExampleValue("basic"),
    selected: today,
    today,
  },
  "example-bounds": {
    label: "Booking date",
    max: maxBookingDate,
    min: minBookingDate,
    onValueChange: updateExampleValue("bounds"),
    showOutsideDays: false,
    today,
  },
  "example-comfortable": {
    inputFormat: "dd.mm.yyyy",
    label: "Touch-friendly date",
    onValueChange: updateExampleValue("comfortable"),
    showOutsideDays: false,
    showSeason: true,
    showTodayButton: true,
    targetSize: "comfortable",
    today,
  },
  "example-format-eu": {
    inputFormat: "dd.mm.yyyy",
    label: "European format",
    today,
  },
  "example-format-iso": {
    inputFormat: "yyyy-mm-dd",
    label: "ISO format",
    today,
  },
  "example-format-us": {
    inputFormat: "mm/dd/yyyy",
    label: "US format",
    today,
  },
  "example-locale-uk": {
    inputFormat: "dd.mm.yyyy",
    label: "Дата події",
    locale: "uk-UA",
    selected: today,
    today,
  },
  "example-locale-us": {
    firstDayOfWeek: 1,
    inputFormat: "mm/dd/yyyy",
    label: "Event date",
    locale: "en-US",
    selected: today,
    today,
  },
  "example-popover": {
    calendarMode: "popover",
    inputFormat: "dd.mm.yyyy",
    label: "Departure date",
    onValueChange: updateExampleValue("popover"),
    showOutsideDays: false,
    targetSize: "comfortable",
    today,
  },
  "example-programmatic": {
    firstDayOfWeek: 1,
    inputFormat: "dd.mm.yyyy",
    label: "Managed date",
    onValueChange: updateExampleValue("programmatic"),
    showOutsideDays: false,
    showTodayButton: true,
    today,
  },
  overview: {
    firstDayOfWeek: 1,
    inputFormat: "dd.mm.yyyy",
    label: "Travel date",
    onValueChange: updateOverviewValue,
    showSeason: true,
    today,
  },
  mobile: {
    label: "Return date",
    max: maxBookingDate,
    min: minBookingDate,
    showOutsideDays: false,
    targetSize: "comfortable",
    today,
  },
  popover: {
    calendarMode: "popover",
    inputFormat: "dd.mm.yyyy",
    label: "Departure date",
    showOutsideDays: false,
    showSeason: true,
    targetSize: "comfortable",
    today,
  },
  programmatic: {
    firstDayOfWeek: 1,
    inputFormat: "dd.mm.yyyy",
    label: "Managed date",
    showOutsideDays: false,
    showTodayButton: true,
    today,
  },
  single: {
    firstDayOfWeek: 0,
    label: "Appointment date",
    today,
  },
  weekStart: {
    firstDayOfWeek: 6,
    inputFormat: "mm/dd/yyyy",
    label: "Weekend trip",
    today,
  },
  styling: {
    label: "Styled date",
    showOutsideDays: false,
    showSeason: true,
    today,
  },
};

const controllers = new Map<string, ReturnType<typeof createDatePicker>>();
let programmaticSeason = false;

setupDaisyClasses();
setupCodeBlocks();
setupScrollableTables();
setupExampleTabs();
setupCoreExample();

for (const root of document.querySelectorAll<HTMLElement>("[data-litopis-picker]")) {
  const preset = root.dataset.litopisPicker;

  if (preset && pickerOptions[preset]) {
    const controller = createDatePicker(root, pickerOptions[preset]);
    const exampleOutput = root
      .closest<HTMLElement>(".example-card")
      ?.querySelector<HTMLElement>("[data-example-value]");

    controllers.set(preset, controller);

    if (exampleOutput) {
      exampleOutput.textContent = `Value: ${controller.getValue() || "none"}`;
    }
  }
}

for (const action of document.querySelectorAll<HTMLButtonElement>("[data-litopis-action]")) {
  action.addEventListener("click", () => {
    const controller = controllers.get(action.dataset.litopisTarget ?? "");

    if (!controller) {
      return;
    }

    switch (action.dataset.litopisAction) {
      case "clear":
        controller.setDate(null);
        break;
      case "jump":
        controller.setVisibleMonth(programmaticMonth);
        break;
      case "today":
        controller.goToToday();
        break;
      case "season":
        programmaticSeason = !programmaticSeason;
        controller.setOptions({ showSeason: programmaticSeason });
        break;
      case "set-date":
        controller.setDate(programmaticDate);
        break;
    }
  });
}

function startOfMonth(value: DateValue): DateValue {
  return { day: 1, month: value.month, year: value.year };
}

function setupDaisyClasses(): void {
  for (const tabList of document.querySelectorAll<HTMLElement>(".example-tabs")) {
    tabList.classList.add("tabs", "tabs-border");
  }

  for (const tab of document.querySelectorAll<HTMLElement>(".example-tab")) {
    tab.classList.add("tab");

    if (tab.getAttribute("aria-selected") === "true") {
      tab.classList.add("tab-active");
    }
  }

  for (const action of document.querySelectorAll<HTMLElement>(".demo-action")) {
    action.classList.add("btn", "btn-sm");
  }

  for (const key of document.querySelectorAll<HTMLElement>("kbd")) {
    key.classList.add("kbd", "kbd-sm");
  }

  for (const note of document.querySelectorAll<HTMLElement>(".note-callout")) {
    note.classList.add("alert", "alert-soft");
  }
}

function setupCodeBlocks(): void {
  for (const group of document.querySelectorAll<HTMLElement>(".vp-code-group")) {
    const pre = group.querySelector("pre");
    const code = group.querySelector("code");

    if (!pre || !code) {
      continue;
    }

    pre.tabIndex = 0;

    const button = document.createElement("button");
    button.className = "btn btn-ghost btn-xs copy";
    button.type = "button";
    button.textContent = "Copy";
    button.setAttribute("aria-label", "Copy code");
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(code.textContent ?? "");
        button.textContent = "Copied";
        window.setTimeout(() => {
          button.textContent = "Copy";
        }, 1600);
      } catch {
        button.textContent = "Copy failed";
      }
    });
    group.append(button);
  }
}

function setupScrollableTables(): void {
  for (const table of document.querySelectorAll<HTMLTableElement>(".vp-doc table")) {
    table.classList.add("table", "table-sm");
    const wrapper = document.createElement("div");
    wrapper.className = "table-scroll";
    wrapper.tabIndex = 0;
    table.before(wrapper);
    wrapper.append(table);
  }
}

function setupExampleTabs(): void {
  for (const tabList of document.querySelectorAll<HTMLElement>("[data-example-tabs]")) {
    const tabs = [...tabList.querySelectorAll<HTMLButtonElement>("[role='tab']")];
    const card = tabList.closest<HTMLElement>(".example-card");

    if (!card) {
      continue;
    }

    for (const tab of tabs) {
      tab.addEventListener("click", () => activateExampleTab(card, tabs, tab));
      tab.addEventListener("keydown", (event) => {
        const currentIndex = tabs.indexOf(tab);
        let nextIndex = currentIndex;

        switch (event.key) {
          case "ArrowLeft":
            nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
            break;
          case "ArrowRight":
            nextIndex = (currentIndex + 1) % tabs.length;
            break;
          case "End":
            nextIndex = tabs.length - 1;
            break;
          case "Home":
            nextIndex = 0;
            break;
          default:
            return;
        }

        event.preventDefault();
        const nextTab = tabs[nextIndex];

        if (nextTab) {
          activateExampleTab(card, tabs, nextTab);
          nextTab.focus();
        }
      });
    }
  }
}

function activateExampleTab(
  card: HTMLElement,
  tabs: readonly HTMLButtonElement[],
  activeTab: HTMLButtonElement,
): void {
  for (const tab of tabs) {
    const isActive = tab === activeTab;
    const panelId = tab.getAttribute("aria-controls");
    const panel = panelId ? card.querySelector<HTMLElement>(`#${panelId}`) : null;

    tab.setAttribute("aria-selected", String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
    tab.classList.toggle("tab-active", isActive);

    if (panel) {
      panel.hidden = !isActive;
    }
  }
}

function setupCoreExample(): void {
  const demo = document.querySelector<HTMLElement>("[data-core-example]");

  if (!demo) {
    return;
  }

  let state: CalendarState = createCalendarState({ selected: today, today });
  const output = demo.querySelector<HTMLElement>("[data-core-state]");
  const movements: Record<string, CalendarMove> = {
    day: "next-day",
    month: "next-month",
    week: "next-week",
  };

  const render = (): void => {
    if (!output) {
      return;
    }

    output.textContent = `Focused: ${toIsoDate(state.focusedDate)}\nSelected: ${state.selected ? toIsoDate(state.selected) : "none"}`;
  };

  for (const action of demo.querySelectorAll<HTMLButtonElement>("[data-core-action]")) {
    action.addEventListener("click", () => {
      const movement = movements[action.dataset.coreAction ?? ""];
      state = movement ? moveFocus(state, movement) : selectFocusedDate(state);
      render();
    });
  }

  render();
}

function updateOverviewValue(value: DateValue | null): void {
  const output = document.querySelector<HTMLElement>("[data-overview-value]");

  if (output) {
    output.textContent = value ? `Selected value: ${toIsoDate(value)}` : "No date selected";
  }
}

function updateExampleValue(example: string): (value: DateValue | null) => void {
  return (value) => {
    const output = document.querySelector<HTMLElement>(`[data-example-value="${example}"]`);

    if (output) {
      output.textContent = value ? `Value: ${toIsoDate(value)}` : "Value: none";
    }
  };
}
