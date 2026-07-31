# Litopis

Date fields and calendars for plain DOM, Web Components, React, Vue, Solid and Svelte.

_Litopis_ means “chronicle” in Ukrainian. The package keeps date math, selection and keyboard
interaction in a DOM-free core, with rendering and CSS supplied as separate layers.

[Documentation](https://dschewchenko.github.io/litopis/) ·
[Examples](https://dschewchenko.github.io/litopis/examples/) ·
[API reference](https://dschewchenko.github.io/litopis/api/)

## Features

- Single dates and ranges of days, months or years.
- One range field or separate start and end fields for native forms.
- Inline calendars and popovers built with the browser Popover API.
- `YYYY-MM-DD`, `DD.MM.YYYY` and `MM/DD/YYYY` field formats.
- Browser locale by default, with locale and first-day-of-week overrides.
- `DateValue`, native `Date`, formatted field and ISO values.
- One or two linked calendar panels.
- Dates from `0001-01-01` to `9999-12-31`.
- DOM-free core for custom fields and renderers.
- Optional CSS, including base, daisyUI, shadcn and Bootstrap styles.

## Install

Install the package for your rendering environment:

```sh
npm install @litopis/dom
```

| Environment    | Package                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------ |
| Headless       | [`@litopis/core`](https://dschewchenko.github.io/litopis/api/#core-exports)                |
| Plain DOM      | [`@litopis/dom`](https://dschewchenko.github.io/litopis/integrations/#plain-dom)           |
| Web Components | [`@litopis/elements`](https://dschewchenko.github.io/litopis/integrations/web-components/) |
| React          | [`@litopis/react`](https://dschewchenko.github.io/litopis/integrations/react/)             |
| Vue            | [`@litopis/vue`](https://dschewchenko.github.io/litopis/integrations/vue/)                 |
| Solid          | [`@litopis/solid`](https://dschewchenko.github.io/litopis/integrations/solid/)             |
| Svelte         | [`@litopis/svelte`](https://dschewchenko.github.io/litopis/integrations/svelte/)           |

Framework runtimes are peer dependencies. All packages are ESM-only.

## Quick start

```html
<form>
  <div id="appointment"></div>
  <button>Save</button>
</form>
```

```ts
import { createDatePicker } from "@litopis/dom";
import "@litopis/dom/styles/base.css";

const root = document.querySelector<HTMLElement>("#appointment");

if (root) {
  createDatePicker(root, {
    format: "dd.mm.yyyy",
    label: "Appointment date",
    mode: "popover",
    name: "appointment",
  });
}
```

The generated field participates in native validation and form submission. Its form value is an
ISO date, independent of the visible field format.

## Date ranges

Range selection uses the same picker:

```html
<form id="booking">
  <div id="stay"></div>
  <button>Search</button>
</form>
```

```ts
import { createDatePicker } from "@litopis/dom";
import "@litopis/dom/styles/base.css";

const root = document.querySelector<HTMLElement>("#stay");

if (root) {
  createDatePicker(root, {
    format: "dd.mm.yyyy",
    label: { start: "From", end: "To" },
    layout: "split",
    mode: "inline",
    name: "stay",
    panels: 2,
    selection: "range",
  });
}
```

This creates two fields and submits `stay[start]` and `stay[end]`. Use `layout: "single"` for one
formatted range field. With `granularity: "month"` or `"year"`, returned ranges use the first and
last dates of the selected period.

## Headless core

Use `@litopis/core` when the application owns the input and calendar markup:

```ts
import { createCalendarState, moveFocus, selectFocusedDate } from "@litopis/core";

let state = createCalendarState({ locale: "uk-UA" });

state = moveFocus(state, "next-week");
state = selectFocusedDate(state);
```

The core has no `window` or `document` dependency and can run in browsers, Node.js and workers.

## Styling

JavaScript never imports CSS. Choose one stylesheet or provide your own:

```ts
import "@litopis/dom/styles/base.css";
```

| Stylesheet        | Import                               |
| ----------------- | ------------------------------------ |
| Layout and tokens | `@litopis/dom/styles/foundation.css` |
| Default styles    | `@litopis/dom/styles/base.css`       |
| daisyUI 5         | `@litopis/dom/styles/daisyui.css`    |
| shadcn            | `@litopis/dom/styles/shadcn.css`     |
| Bootstrap 5.3     | `@litopis/dom/styles/bootstrap.css`  |

Theme adapters are CSS-only and use the host design system's variables. See the
[styling guide](https://dschewchenko.github.io/litopis/styling/) for tokens and setup.

## Bundle size

Gzipped production bundles:

| JavaScript                      | Size        |
| ------------------------------- | ----------- |
| Core                            | 3.9 kB      |
| DOM bindings, added to core     | +11.2 kB    |
| Web Components, added to DOM    | +2.0 kB     |
| Framework binding, added to DOM | +0.2–1.2 kB |

| CSS                        | Size        |
| -------------------------- | ----------- |
| Foundation                 | 2.7 kB      |
| Base, added to foundation  | +0.3 kB     |
| Theme, added to foundation | +0.2–0.3 kB |

## Accessibility

Litopis implements the WAI-ARIA grid and combobox interaction patterns used by its rendered
controls. Keyboard support includes arrow keys, Home, End, PageUp, PageDown, year navigation with
Shift, selection and Escape focus restoration.

Automated tests cover keyboard flows and axe checks in Chromium, Firefox and WebKit. Manual
assistive-technology status is documented in [ACCESSIBILITY.md](./ACCESSIBILITY.md).

## Development

```sh
bun install
bun run check
bun run test:browser
```

## License

[Apache License 2.0](./LICENSE)
