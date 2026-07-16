import type { FirstDayOfWeek } from "./types";

export const DEFAULT_LOCALE = "en-US";

interface LocaleWeekInfo {
  readonly firstDay?: number;
}

interface LocaleWithWeekInfo {
  readonly region?: string;
  readonly weekInfo?: LocaleWeekInfo;
  getWeekInfo?: () => LocaleWeekInfo;
  maximize?: () => LocaleWithWeekInfo;
}

interface LocaleConstructor {
  new (locale: string): LocaleWithWeekInfo;
}

interface IntlWithLocale {
  readonly Locale?: LocaleConstructor;
}

const SUNDAY_FIRST_REGIONS =
  "|AG|AS|BD|BR|BS|BT|BW|BZ|CA|CO|DM|DO|ET|GT|GU|HK|HN|ID|IL|IN|IS|JM|JP|KE|KH|KR|LA|MH|MM|MO|MT|MZ|NI|NP|PA|PE|PH|PK|PR|PT|PY|SA|SG|SV|TH|TT|TW|UM|US|VE|VI|WS|YE|ZA|ZW|";
const SATURDAY_FIRST_REGIONS = "|AF|BH|DJ|DZ|EG|IQ|IR|JO|KW|LY|OM|QA|SD|SY|";
const FRIDAY_FIRST_REGIONS = "|MV|";

export function resolveLocale(locale: string | undefined): string {
  if (!locale) {
    return DEFAULT_LOCALE;
  }

  try {
    return Intl.DateTimeFormat.supportedLocalesOf([locale])[0] ?? DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function getLocaleFirstDayOfWeek(locale: string): FirstDayOfWeek {
  const resolvedLocale = resolveLocale(locale);
  const nativeFirstDay = getNativeFirstDayOfWeek(resolvedLocale);

  if (nativeFirstDay !== null) {
    return nativeFirstDay;
  }

  return getRegionFirstDayOfWeek(getLocaleRegion(resolvedLocale));
}

function getNativeFirstDayOfWeek(locale: string): FirstDayOfWeek | null {
  const localeInfo = createLocale(locale);
  const weekInfo = localeInfo?.getWeekInfo?.() ?? localeInfo?.weekInfo;
  const firstDay = weekInfo?.firstDay;

  if (typeof firstDay === "number" && firstDay >= 1 && firstDay <= 7) {
    return (firstDay % 7) as FirstDayOfWeek;
  }

  return null;
}

function getLocaleRegion(locale: string): string | null {
  const localeInfo = createLocale(locale);
  const region = localeInfo?.region ?? localeInfo?.maximize?.().region;

  if (region) {
    return region.toUpperCase();
  }

  return parseLocaleRegion(locale);
}

function createLocale(locale: string): LocaleWithWeekInfo | null {
  const Locale = (Intl as IntlWithLocale).Locale;

  if (!Locale) {
    return null;
  }

  try {
    return new Locale(locale);
  } catch {
    return null;
  }
}

function parseLocaleRegion(locale: string): string | null {
  const parts = locale.replaceAll("_", "-").split("-");

  for (const part of parts.slice(1)) {
    if (part.length === 1) {
      return null;
    }

    if (/^[a-z]{2}$/i.test(part) || /^\d{3}$/.test(part)) {
      return part.toUpperCase();
    }
  }

  return null;
}

function getRegionFirstDayOfWeek(region: string | null): FirstDayOfWeek {
  if (region && SUNDAY_FIRST_REGIONS.includes(`|${region}|`)) {
    return 0;
  }

  if (region && SATURDAY_FIRST_REGIONS.includes(`|${region}|`)) {
    return 6;
  }

  if (region && FRIDAY_FIRST_REGIONS.includes(`|${region}|`)) {
    return 5;
  }

  return 1;
}
