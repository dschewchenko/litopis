/// <reference types="vite/client" />

import { createDatePicker } from "@litopis/dom";
import type { DateValue } from "@litopis/dom";
import baseStyles from "@litopis/dom/styles/base.css?inline";
import bootstrapStyles from "@litopis/dom/styles/bootstrap.css?inline";
import daisyuiStyles from "@litopis/dom/styles/daisyui.css?inline";
import foundationStyles from "@litopis/dom/styles/foundation.css?inline";
import shadcnStyles from "@litopis/dom/styles/shadcn.css?inline";
import type { ThemePlaygroundContent, ThemePlaygroundStyle } from "./types";

const themePlaygroundContent: Record<ThemePlaygroundStyle, ThemePlaygroundContent> = {
  base: {
    code: `@import "@litopis/dom/styles/base.css";`,
    description: "Neutral Litopis styles.",
  },
  bootstrap: {
    code: `@import "bootstrap/dist/css/bootstrap.css";
@import "@litopis/dom/styles/bootstrap.css";`,
    description: "Calendar colours, radius and focus ring from Bootstrap variables.",
  },
  daisyui: {
    code: `@import "tailwindcss";
@import "@litopis/dom/styles/daisyui.css";
@plugin "daisyui";`,
    description: "The active daisyUI theme controls the calendar colours, border and radius.",
  },
  foundation: {
    code: `@import "@litopis/dom/styles/foundation.css";

.litopis {
  --litopis-accent: var(--brand);
  --litopis-background: var(--surface);
}`,
    description: "Set --litopis-* variables for your colours, spacing and type scale.",
  },
  shadcn: {
    code: `@import "tailwindcss";
@import "shadcn/tailwind.css";
@import "@litopis/dom/styles/shadcn.css";`,
    description: "Uses shadcn --primary, --popover and --ring tokens. Import it after the theme.",
  },
};

const themeStyles: Record<ThemePlaygroundStyle, string> = {
  base: baseStyles,
  bootstrap: bootstrapStyles,
  daisyui: daisyuiStyles,
  foundation: foundationStyles,
  shadcn: shadcnStyles,
};

const foundationVariables = `
.litopis,
.litopis-field {
  --litopis-accent: var(--theme-preview-accent);
  --litopis-accent-foreground: var(--theme-preview-accent-foreground);
  --litopis-background: var(--theme-preview-background);
  --litopis-border: var(--theme-preview-border);
  --litopis-border-width: 1px;
  --litopis-calendar-radius: var(--theme-preview-calendar-radius, 16px);
  --litopis-calendar-shadow:
    inset 0 0 0 var(--litopis-border-width) var(--theme-preview-border),
    0 12px 28px color-mix(in srgb, var(--theme-preview-foreground) 8%, transparent);
  --litopis-danger: #b42318;
  --litopis-disabled: color-mix(in srgb, var(--theme-preview-foreground) 38%, transparent);
  --litopis-focus-color: var(--theme-preview-accent);
  --litopis-focus-ring: color-mix(in srgb, var(--theme-preview-accent) 24%, transparent);
  --litopis-foreground: var(--theme-preview-foreground);
  --litopis-muted: var(--theme-preview-muted);
  --litopis-muted-foreground: var(--theme-preview-muted-foreground);
  --litopis-radius: var(--theme-preview-radius, 8px);
}`;

export function setupThemePlayground(today: DateValue): void {
  const playground = document.querySelector<HTMLElement>("[data-theme-playground]");
  if (!playground) return;

  const pickerRoot = playground.querySelector<HTMLElement>("[data-theme-picker]");
  const description = playground.querySelector<HTMLElement>("[data-theme-description]");
  const code = playground.querySelector<HTMLElement>("[data-theme-code]");
  const panel = playground.querySelector<HTMLElement>("[role='tabpanel']");
  const tabs = [...playground.querySelectorAll<HTMLButtonElement>("[data-style-theme-tab]")];

  if (!pickerRoot || !description || !code || !panel || tabs.length === 0) return;

  const preview = playground;
  const previewPanel = panel;
  const previewDescription = description;
  const previewCode = code;

  const adapterStyle = document.createElement("style");
  adapterStyle.dataset.themePreviewAdapter = "";
  document.head.append(adapterStyle);

  function activateThemeTab(activeTab: HTMLButtonElement): void {
    const theme = getThemePlaygroundStyle(activeTab.dataset.styleThemeTab);
    const content = themePlaygroundContent[theme];
    const additionalStyles = theme === "foundation" ? foundationVariables : "";

    preview.dataset.styleTheme = theme;
    adapterStyle.textContent = `@scope ([data-theme-playground]) {\n${themeStyles[theme]}\n${additionalStyles}\n}`;
    previewPanel.setAttribute("aria-labelledby", activeTab.id);
    previewDescription.textContent = content.description;
    previewCode.textContent = content.code;

    for (const tab of tabs) {
      const isActive = tab === activeTab;
      tab.setAttribute("aria-selected", String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
    }
  }

  createDatePicker(pickerRoot, {
    clearButton: true,
    label: "Inline calendar preview",
    selected: today,
    today,
  });

  for (const tab of tabs) {
    tab.addEventListener("click", () => activateThemeTab(tab));
    tab.addEventListener("keydown", (event) => {
      const currentIndex = tabs.indexOf(tab);
      const nextIndex = getNextTabIndex(event.key, currentIndex, tabs.length);

      if (nextIndex === null) return;

      event.preventDefault();
      const nextTab = tabs[nextIndex]!;
      activateThemeTab(nextTab);
      nextTab.focus();
    });
  }

  const selectedTab = tabs.find((tab) => tab.getAttribute("aria-selected") === "true")!;
  activateThemeTab(selectedTab);
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

function getThemePlaygroundStyle(value: string | undefined): ThemePlaygroundStyle {
  if (
    value === "base" ||
    value === "bootstrap" ||
    value === "daisyui" ||
    value === "foundation" ||
    value === "shadcn"
  ) {
    return value;
  }

  return "foundation";
}
