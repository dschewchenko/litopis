import type {
  DatePickerMessageOverrides,
  DatePickerMessages,
  DatePickerSeasonMessages,
} from "./types";

const ENGLISH_SEASONS: DatePickerSeasonMessages = {
  autumn: "Autumn",
  spring: "Spring",
  summer: "Summer",
  winter: "Winter",
};

const ENGLISH_MESSAGES: DatePickerMessages = {
  clear: "Clear",
  chooseMonth: "Choose month",
  chooseMonthAndYear: "Choose month and year",
  chooseYear: "Choose year",
  currentYearPage: "Current year page",
  date: "Date",
  dateOnOrAfter: (date) => `Date must be on or after ${date}.`,
  dateOnOrBefore: (date) => `Date must be on or before ${date}.`,
  end: "End",
  enterValidDate: "Enter a valid date.",
  nextMonth: "Next month",
  nextYear: "Next year",
  nextYears: "Next years",
  previousMonth: "Previous month",
  previousYear: "Previous year",
  previousYears: "Previous years",
  seasons: ENGLISH_SEASONS,
  start: "Start",
  today: "Today",
};

export function resolveDatePickerMessages(
  overrides: DatePickerMessageOverrides | undefined,
): DatePickerMessages {
  return {
    clear: resolveValue(overrides?.clear, ENGLISH_MESSAGES.clear),
    chooseMonth: resolveValue(overrides?.chooseMonth, ENGLISH_MESSAGES.chooseMonth),
    chooseMonthAndYear: resolveValue(
      overrides?.chooseMonthAndYear,
      ENGLISH_MESSAGES.chooseMonthAndYear,
    ),
    chooseYear: resolveValue(overrides?.chooseYear, ENGLISH_MESSAGES.chooseYear),
    currentYearPage: resolveValue(overrides?.currentYearPage, ENGLISH_MESSAGES.currentYearPage),
    date: resolveValue(overrides?.date, ENGLISH_MESSAGES.date),
    dateOnOrAfter: resolveValue(overrides?.dateOnOrAfter, ENGLISH_MESSAGES.dateOnOrAfter),
    dateOnOrBefore: resolveValue(overrides?.dateOnOrBefore, ENGLISH_MESSAGES.dateOnOrBefore),
    end: resolveValue(overrides?.end, ENGLISH_MESSAGES.end),
    enterValidDate: resolveValue(overrides?.enterValidDate, ENGLISH_MESSAGES.enterValidDate),
    nextMonth: resolveValue(overrides?.nextMonth, ENGLISH_MESSAGES.nextMonth),
    nextYear: resolveValue(overrides?.nextYear, ENGLISH_MESSAGES.nextYear),
    nextYears: resolveValue(overrides?.nextYears, ENGLISH_MESSAGES.nextYears),
    previousMonth: resolveValue(overrides?.previousMonth, ENGLISH_MESSAGES.previousMonth),
    previousYear: resolveValue(overrides?.previousYear, ENGLISH_MESSAGES.previousYear),
    previousYears: resolveValue(overrides?.previousYears, ENGLISH_MESSAGES.previousYears),
    seasons: {
      autumn: resolveValue(overrides?.seasons?.autumn, ENGLISH_MESSAGES.seasons.autumn),
      spring: resolveValue(overrides?.seasons?.spring, ENGLISH_MESSAGES.seasons.spring),
      summer: resolveValue(overrides?.seasons?.summer, ENGLISH_MESSAGES.seasons.summer),
      winter: resolveValue(overrides?.seasons?.winter, ENGLISH_MESSAGES.seasons.winter),
    },
    start: resolveValue(overrides?.start, ENGLISH_MESSAGES.start),
    today: resolveValue(overrides?.today, ENGLISH_MESSAGES.today),
  };
}

function resolveValue<T>(override: T | undefined, fallback: T): T {
  return override ?? fallback;
}
