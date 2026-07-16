import "@litopis/elements";
import { createDatePicker } from "@litopis/dom";
import { addDays, addMonths, getToday, type DateValue } from "@litopis/core";
import type { DatePickerOptions } from "@litopis/dom";
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
  overview: {
    firstDayOfWeek: 1,
    inputFormat: "dd.mm.yyyy",
    label: "Travel date",
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

for (const root of document.querySelectorAll<HTMLElement>("[data-litopis-picker]")) {
  const preset = root.dataset.litopisPicker;

  if (preset && pickerOptions[preset]) {
    controllers.set(preset, createDatePicker(root, pickerOptions[preset]));
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
