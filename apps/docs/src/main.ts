import "@litopis/dom/styles/base.css";
import { createDateField, createDatePicker } from "@litopis/dom";
import { getToday } from "@litopis/core";
import type { CalendarGranularity } from "@litopis/core";
import type {
  DateFieldFormat,
  DateFieldController,
  DatePickerOptions,
  DatePickerPanels,
  DatePickerValueAs,
  DateValue,
} from "@litopis/dom";
import "./styles.css";
import type {
  PackageManager,
  PackageManagerDefinition,
  PlaygroundFirstDay,
  PlaygroundPickerController,
  PlaygroundPickerOptions,
  PlaygroundPickerValue,
} from "./types";

const today = getToday();
const playgroundEndLabel = "To";
const playgroundEndName = "to";
const playgroundFieldName = "period";
const playgroundSingleLabel = "Travel date";
const playgroundStartLabel = "From";
const playgroundStartName = "from";
const packageManagerStorageKey = "litopis-package-manager";
const packageManagers: Record<PackageManager, PackageManagerDefinition> = {
  bun: { command: "bun add", label: "Bun" },
  npm: { command: "npm install", label: "npm" },
  pnpm: { command: "pnpm add", label: "pnpm" },
  yarn: { command: "yarn add", label: "yarn" },
};

const pickerOptions: Record<string, DatePickerOptions> = {
  popover: {
    mode: "popover",
    format: "dd.mm.yyyy",
    label: "Departure date",
    outsideDays: false,
    season: true,
    size: "comfortable",
    today,
  },
  styling: {
    label: "Styled date",
    outsideDays: false,
    season: true,
    today,
  },
};

setupDaisyClasses();
void setupThemePlayground();
setupPackageManagerTabs();
setupCodeBlocks();
setupScrollableTables();
setupExampleTabs();
void setupPlayground();
setupMarkdownLink();

function setupMarkdownLink(): void {
  const header = document.querySelector(".topbar");
  const github = header?.querySelector(".topbar-link");
  if (!header || !github) return;

  const link = document.createElement("a");
  const pagePath = window.location.pathname.replace(/\/index\.html$/, "").replace(/\/$/, "");
  link.className = "topbar-link";
  link.href = pagePath === "/litopis" ? "/litopis/index.md" : `${pagePath}.md`;
  link.textContent = "Markdown";
  link.setAttribute("aria-label", "Read page as Markdown");
  const links = document.createElement("div");
  links.className = "topbar-links";
  links.append(link, github);
  header.append(links);

  for (const card of document.querySelectorAll<HTMLElement>("article.example-card[id]")) {
    const recipeLink = document.createElement("a");
    recipeLink.className = "example-markdown";
    recipeLink.href = `/litopis/examples/${card.id}.md`;
    recipeLink.textContent = "Markdown";
    recipeLink.setAttribute(
      "aria-label",
      `Read ${card.querySelector("h2")?.textContent} as Markdown`,
    );
    card.querySelector(".example-card-header")?.append(recipeLink);
  }
}

for (const root of document.querySelectorAll<HTMLElement>("[data-litopis-picker]")) {
  const preset = root.dataset.litopisPicker;
  if (preset && pickerOptions[preset]) createDatePicker(root, pickerOptions[preset]);
}

async function setupPlayground(): Promise<void> {
  const playground = document.querySelector<HTMLElement>("[data-playground]");
  if (!playground) return;

  await import("@litopis/dom/styles/daisyui.css");

  const dateFields: DateFieldController[] = [];
  for (const root of playground.querySelectorAll<HTMLElement>("[data-playground-date-field]")) {
    const label = root.dataset.label;
    if (!label) continue;
    const field = createDateField(root, { label, format: "yyyy-mm-dd" });
    const input = root.querySelector("input");
    input?.setAttribute(`data-playground-${root.dataset.playgroundDateField}`, "");
    dateFields.push(field);
  }

  const controlsForm = playground.querySelector<HTMLFormElement>("[data-playground-form]");
  const nativeForm = playground.querySelector<HTMLFormElement>("[data-playground-native-form]");
  const pickerRoot = playground.querySelector<HTMLElement>("[data-playground-picker]");
  const valueOutput = playground.querySelector<HTMLElement>("[data-playground-value]");
  const code = playground.querySelector<HTMLElement>("[data-playground-code]");
  const selection = playground.querySelector<HTMLSelectElement>("[data-playground-selection]");
  const granularity = playground.querySelector<HTMLSelectElement>("[data-playground-granularity]");
  const layout = playground.querySelector<HTMLSelectElement>("[data-playground-layout]");
  const panels = playground.querySelector<HTMLSelectElement>("[data-playground-panels]");
  const calendar = playground.querySelector<HTMLSelectElement>("[data-playground-calendar]");
  const format = playground.querySelector<HTMLSelectElement>("[data-playground-format]");
  const size = playground.querySelector<HTMLSelectElement>("[data-playground-size]");
  const locale = playground.querySelector<HTMLSelectElement>("[data-playground-locale]");
  const firstDay = playground.querySelector<HTMLSelectElement>("[data-playground-first-day]");
  const outsideDays = playground.querySelector<HTMLInputElement>("[data-playground-outside-days]");
  const season = playground.querySelector<HTMLInputElement>("[data-playground-season]");
  const valueAs = playground.querySelector<HTMLSelectElement>("[data-playground-value-as]");
  const startValue = playground.querySelector<HTMLInputElement>("[data-playground-start-value]");
  const endValue = playground.querySelector<HTMLInputElement>("[data-playground-end-value]");
  const minimum = playground.querySelector<HTMLInputElement>("[data-playground-min]");
  const maximum = playground.querySelector<HTMLInputElement>("[data-playground-max]");
  const todayReference = playground.querySelector<HTMLInputElement>("[data-playground-today]");
  const closeOnSelect = playground.querySelector<HTMLInputElement>(
    "[data-playground-close-on-select]",
  );
  const clearButton = playground.querySelector<HTMLInputElement>("[data-playground-clear-button]");
  const todayButton = playground.querySelector<HTMLInputElement>("[data-playground-today-button]");

  if (
    !controlsForm ||
    !nativeForm ||
    !pickerRoot ||
    !valueOutput ||
    !code ||
    !selection ||
    !granularity ||
    !layout ||
    !panels ||
    !calendar ||
    !format ||
    !size ||
    !locale ||
    !firstDay ||
    !outsideDays ||
    !season ||
    !valueAs ||
    !startValue ||
    !endValue ||
    !minimum ||
    !maximum ||
    !todayReference ||
    !closeOnSelect ||
    !clearButton ||
    !todayButton
  ) {
    return;
  }

  const playgroundCalendar = calendar;
  const playgroundClearButton = clearButton;
  const playgroundCloseOnSelect = closeOnSelect;
  const playgroundCode = code;
  const playgroundControlsForm = controlsForm;
  const playgroundEndValue = endValue;
  const playgroundFirstDay = firstDay;
  const playgroundFormat = format;
  const playgroundGranularity = granularity;
  const playgroundLayout = layout;
  const playgroundLocale = locale;
  const playgroundMaximum = maximum;
  const playgroundMinimum = minimum;
  const playgroundNativeForm = nativeForm;
  const playgroundOutsideDays = outsideDays;
  const playgroundPanels = panels;
  const playgroundPickerRoot = pickerRoot;
  const playgroundSeason = season;
  const playgroundSelection = selection;
  const playgroundSize = size;
  const playgroundStartValue = startValue;
  const playgroundTodayButton = todayButton;
  const playgroundTodayReference = todayReference;
  const playgroundValueAs = valueAs;
  const playgroundValueOutput = valueOutput;

  let controller: PlaygroundPickerController | null = null;

  function mount(): void {
    const isRange = playgroundSelection.value === "range";
    const isPopover = playgroundCalendar.value === "popover";
    playgroundLayout.disabled = !isRange;
    playgroundPanels.disabled = !isRange;
    playgroundEndValue.disabled = !isRange;
    playgroundCloseOnSelect.disabled = !isPopover;
    playgroundLayout.closest("label")?.toggleAttribute("hidden", !isRange);
    playgroundPanels.closest("label")?.toggleAttribute("hidden", !isRange);
    playgroundEndValue.closest("[data-playground-date-field]")?.toggleAttribute("hidden", !isRange);
    playgroundCloseOnSelect.closest("label")?.toggleAttribute("hidden", !isPopover);

    const initialStart = getPlaygroundDate(playgroundStartValue.value);
    const initialEnd = getPlaygroundDate(playgroundEndValue.value);
    const selectedValueAs = getPlaygroundValueAs(playgroundValueAs.value);
    const initialStartValue = getPlaygroundPickerValue(initialStart, selectedValueAs);
    const initialEndValue = getPlaygroundPickerValue(initialEnd, selectedValueAs);
    const localeValue = getPlaygroundLocale(playgroundLocale.value);
    const firstDayOfWeek = getPlaygroundFirstDayOfWeek(playgroundFirstDay.value);
    const min = getPlaygroundDate(playgroundMinimum.value);
    const max = getPlaygroundDate(playgroundMaximum.value);
    const configuredToday = getPlaygroundDate(playgroundTodayReference.value);
    const pickerOptions: PlaygroundPickerOptions = {
      clearButton: playgroundClearButton.checked,
      closeOnSelect: playgroundCloseOnSelect.checked,
      format: getPlaygroundFormat(playgroundFormat.value),
      granularity: getPlaygroundGranularity(playgroundGranularity.value),
      layout: playgroundLayout.value === "split" ? "split" : "single",
      mode: isPopover ? "popover" : "inline",
      outsideDays: playgroundOutsideDays.checked,
      panels: getPlaygroundPanels(playgroundPanels.value),
      season: playgroundSeason.checked,
      selection: isRange ? "range" : "single",
      size: playgroundSize.value === "comfortable" ? "comfortable" : "compact",
      todayButton: playgroundTodayButton.checked,
      valueAs: selectedValueAs,
      ...(firstDayOfWeek === undefined ? {} : { firstDayOfWeek }),
      ...(localeValue ? { locale: localeValue } : {}),
      ...(max ? { max } : {}),
      ...(min ? { min } : {}),
      ...(isRange ? {} : { selected: initialStartValue }),
      ...(configuredToday ? { today: configuredToday } : {}),
      ...(isRange ? { range: { end: initialEndValue, start: initialStartValue } } : {}),
      label:
        isRange && playgroundLayout.value === "split"
          ? { end: playgroundEndLabel, start: playgroundStartLabel }
          : playgroundSingleLabel,
      name:
        isRange && playgroundLayout.value === "split"
          ? { end: playgroundEndName, start: playgroundStartName }
          : playgroundFieldName,
      onRangeChange() {
        updatePlaygroundFormData();
      },
      onValueChange() {
        updatePlaygroundFormData();
      },
    };

    controller?.destroy();
    controller = createDatePicker(playgroundPickerRoot, pickerOptions);
    updatePlaygroundFormData();
    playgroundCode.textContent = getPlaygroundCode(pickerOptions);
  }

  function updatePlaygroundFormData(): void {
    const values = [...new FormData(playgroundNativeForm).entries()]
      .filter(([, value]) => value !== "")
      .map(([name, value]) => `${name}=${formatFormDataValue(value)}`)
      .join(", ");
    playgroundValueOutput.textContent = values ? `FormData: ${values}` : "No completed form value";
  }

  playgroundControlsForm.addEventListener("input", mount);
  playgroundControlsForm.addEventListener("reset", () => {
    for (const field of dateFields) field.setDate(null);
    window.setTimeout(mount);
  });
  playgroundNativeForm.addEventListener("reset", () => window.setTimeout(updatePlaygroundFormData));
  mount();
}

function setupPackageManagerTabs(): void {
  const installs = [...document.querySelectorAll<HTMLElement>("[data-package-install]")];
  const initialManager = getStoredPackageManager();

  for (const [index, install] of installs.entries()) {
    const tabs = [...install.querySelectorAll<HTMLButtonElement>("[data-package-manager]")];
    const panel = install.querySelector<HTMLElement>("[data-package-install-panel]");
    const command = panel?.querySelector<HTMLElement>("code");
    const packages = install.dataset.packageInstall;

    if (!panel || !command || !packages || tabs.length === 0) continue;

    const panelId = `package-install-${index}`;
    panel.id = panelId;
    panel.setAttribute("role", "tabpanel");

    for (const tab of tabs) {
      tab.setAttribute("aria-controls", panelId);
      tab.addEventListener("click", () => activatePackageManager(tab, installs));
      tab.addEventListener("keydown", (event) => {
        const nextIndex = getNextTabIndex(event.key, tabs.indexOf(tab), tabs.length);

        if (nextIndex === null) return;

        event.preventDefault();
        const nextTab = tabs[nextIndex]!;
        activatePackageManager(nextTab, installs);
        nextTab.focus();
      });
    }
  }

  activatePackageManagerByName(initialManager, installs);
}

function activatePackageManager(
  activeTab: HTMLButtonElement,
  installs: readonly HTMLElement[],
): void {
  const manager = getPackageManager(activeTab.dataset.packageManager);

  if (!manager) return;

  window.localStorage.setItem(packageManagerStorageKey, manager);
  activatePackageManagerByName(manager, installs);
}

function activatePackageManagerByName(
  manager: PackageManager,
  installs: readonly HTMLElement[],
): void {
  const definition = packageManagers[manager];

  for (const install of installs) {
    const packages = install.dataset.packageInstall;
    const command = install.querySelector<HTMLElement>("[data-package-install-panel] code");

    if (!packages || !command) continue;

    command.textContent = `${definition.command} ${packages}`;

    for (const tab of install.querySelectorAll<HTMLButtonElement>("[data-package-manager]")) {
      const isActive = tab.dataset.packageManager === manager;
      tab.setAttribute("aria-selected", String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
    }
  }
}

function getStoredPackageManager(): PackageManager {
  return getPackageManager(window.localStorage.getItem(packageManagerStorageKey)) ?? "npm";
}

function getPackageManager(value: string | undefined | null): PackageManager | null {
  return value && value in packageManagers ? (value as PackageManager) : null;
}

function getNextTabIndex(key: string, currentIndex: number, count: number): number | null {
  switch (key) {
    case "ArrowLeft":
      return (currentIndex - 1 + count) % count;
    case "ArrowRight":
      return (currentIndex + 1) % count;
    case "End":
      return count - 1;
    case "Home":
      return 0;
    default:
      return null;
  }
}

async function setupThemePlayground(): Promise<void> {
  if (!document.querySelector("[data-theme-playground]")) return;

  const themePreview = await import("./theme-preview");
  themePreview.setupThemePlayground(today);
}

function getPlaygroundCode(options: PlaygroundPickerOptions): string {
  const lines = [
    `label: ${JSON.stringify(options.label)},`,
    `name: ${JSON.stringify(options.name)},`,
    `mode: "${options.mode}",`,
    `selection: "${options.selection}",`,
    `granularity: "${options.granularity}",`,
    `format: "${options.format}",`,
    `size: "${options.size}",`,
    `outsideDays: ${options.outsideDays},`,
    `season: ${options.season},`,
    `clearButton: ${options.clearButton},`,
    `todayButton: ${options.todayButton},`,
    `valueAs: "${options.valueAs}",`,
  ];

  addOptionalPlaygroundCodeLine(lines, "locale", options.locale);
  addOptionalPlaygroundCodeLine(lines, "firstDayOfWeek", options.firstDayOfWeek);
  addOptionalPlaygroundDateCodeLine(lines, "min", options.min);
  addOptionalPlaygroundDateCodeLine(lines, "max", options.max);
  addOptionalPlaygroundDateCodeLine(lines, "today", options.today);

  if (options.selection === "range") {
    lines.push(
      `layout: "${options.layout}",`,
      `panels: ${JSON.stringify(options.panels)},`,
      `range: { start: ${formatPlaygroundDate(options.range?.start) ?? "null"}, end: ${formatPlaygroundDate(options.range?.end) ?? "null"} },`,
    );
  } else {
    lines.push(`selected: ${formatPlaygroundDate(options.selected) ?? "null"},`);
  }

  if (options.mode === "popover") {
    lines.push(`closeOnSelect: ${options.closeOnSelect},`);
  }

  return `import { createDatePicker } from "@litopis/dom";
import "@litopis/dom/styles/daisyui.css";

const form = document.querySelector<HTMLFormElement>("#travel-form")!;
const root = document.querySelector<HTMLElement>("#travel-date")!;
const output = document.querySelector<HTMLOutputElement>("#travel-value")!;

createDatePicker(root, {
  ${lines.join("\n  ")}
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(form));
  output.textContent = JSON.stringify(values, null, 2);
});`;
}

function addOptionalPlaygroundCodeLine(
  lines: string[],
  name: string,
  value: number | string | undefined,
): void {
  if (value === undefined) return;
  const formattedValue = typeof value === "string" ? `"${value}"` : String(value);
  lines.push(`${name}: ${formattedValue},`);
}

function formatPlaygroundDate(value: PlaygroundPickerValue | null | undefined): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) {
    return `new Date(${value.getFullYear()}, ${value.getMonth()}, ${value.getDate()})`;
  }
  return `{ year: ${value.year}, month: ${value.month}, day: ${value.day} }`;
}

function addOptionalPlaygroundDateCodeLine(
  lines: string[],
  name: string,
  value: DateValue | null | undefined,
): void {
  const formattedValue = formatPlaygroundDate(value);
  if (formattedValue) lines.push(`${name}: ${formattedValue},`);
}

function getPlaygroundDate(value: string): DateValue | undefined {
  const [yearText, monthText, dayText] = value.split("-");
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return undefined;
  }

  return { day, month, year };
}

function getPlaygroundValueAs(value: string): DatePickerValueAs {
  return value === "date" ? "date" : "date-value";
}

function getPlaygroundPickerValue(
  value: DateValue | undefined,
  valueAs: DatePickerValueAs,
): PlaygroundPickerValue | null {
  if (!value) return null;
  if (valueAs === "date") return new Date(value.year, value.month - 1, value.day, 12);
  return value;
}

function getPlaygroundFirstDayOfWeek(value: string): PlaygroundFirstDay | undefined {
  if (value === "0") return 0;
  if (value === "1") return 1;
  if (value === "2") return 2;
  if (value === "3") return 3;
  if (value === "4") return 4;
  if (value === "5") return 5;
  if (value === "6") return 6;
  return undefined;
}

function getPlaygroundFormat(value: string): DateFieldFormat {
  if (value === "yyyy-mm-dd" || value === "mm/dd/yyyy") return value;
  return "dd.mm.yyyy";
}

function getPlaygroundLocale(value: string): string | undefined {
  const locale = value.trim();
  return locale && locale.toLowerCase() !== "auto" ? locale : undefined;
}

function getPlaygroundGranularity(value: string): CalendarGranularity {
  if (value === "month" || value === "year") return value;
  return "day";
}

function getPlaygroundPanels(value: string): DatePickerPanels {
  if (value === "2") return 2;
  if (value === "auto") return "auto";
  return 1;
}

function formatFormDataValue(value: FormDataEntryValue): string {
  return value instanceof File ? value.name : value;
}

function setupDaisyClasses(): void {
  for (const select of document.querySelectorAll("select")) {
    select.classList.add("select", "select-sm");
  }

  for (const checkbox of document.querySelectorAll("input[type='checkbox']")) {
    checkbox.classList.add("checkbox", "checkbox-sm");
  }

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
