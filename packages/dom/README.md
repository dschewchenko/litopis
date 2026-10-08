# @litopis/dom

Imperative DOM date fields and date pickers for Litopis.

```sh
npm install @litopis/dom
```

```ts
import { createDatePicker } from "@litopis/dom";
import "@litopis/dom/styles/base.css";

const picker = createDatePicker(document.querySelector("#picker")!, {
  clearButton: true,
  closeOnSelect: false,
  mode: "popover",
  label: "Appointment date",
});
```

The controller returns an ISO `YYYY-MM-DD` value through `picker.getISOValue()`.

## Locale messages and date formats

Pass a BCP 47 locale to use its native month names and weekday order. Control messages use English
defaults and can be overridden per caller with the typed `messages` option. Partial overrides are
merged with the defaults, including the seasonal labels.

```ts
createDatePicker(document.querySelector("#picker")!, {
  format: "dd/mm/yyyy",
  locale: navigator.language,
  messages: {
    chooseMonthAndYear: "Select month and year",
  },
});
```

Supported input formats are `yyyy-mm-dd`, `dd.mm.yyyy`, `dd/mm/yyyy`, and `mm/dd/yyyy`.

## Unavailable dates and availability loading

Pass `disabledDates` for a reactive availability snapshot, `isDateDisabled` for a synchronous
predicate or both. Disabled days cannot be selected by the calendar, typed input or controller
selection methods. A complete range is rejected when any day inside it is unavailable. Controller
selection methods leave the current value unchanged when a requested day or range is unavailable.
`onVisibleMonthChange` receives the first day whenever the displayed month changes, including after
navigation or selection; it does not fire on initial render.

```ts
import type { DateValue } from "@litopis/core";
import { createDatePicker } from "@litopis/dom";

const root = document.querySelector("#picker")!;
let unavailableDates: readonly DateValue[] = [];
const options = {
  disabledDates: unavailableDates,
  onVisibleMonthChange(month) {
    void loadAvailability(month);
  },
};
const picker = createDatePicker(root, options);

async function loadAvailability(month: DateValue): Promise<void> {
  const dates = await fetchUnavailableDates(month); // Your availability request.
  unavailableDates = dates;
  // Replace the list after loading; the visible grid updates in place.
  picker.setOptions({ ...options, disabledDates: unavailableDates });
}
```

## Custom input

Place an input directly inside the picker root with `slot="input"`. Litopis keeps the same element,
adds its behavior and accessibility attributes, and preserves your classes and placeholder.

```html
<div id="picker">
  <input slot="input" class="my-input" placeholder="Choose a date" />
</div>
```

For a split range, add a second input with `slot="end-input"`.

## Date ranges and forms

Range selection stays on `createDatePicker`. Use `selection: "range"` with `name` for two native
endpoint values, or `layout: "single"` with `name` for one
serialized range value.

The JavaScript package is unstyled and does not import CSS. Choose one styling layer:

- No stylesheet: fully unstyled, with all behavior and accessibility intact.
- `@litopis/dom/styles/foundation.css`: stable anatomy and layout driven by your own
  `--litopis-*` tokens.
- `@litopis/dom/styles/base.css`: minimal native-looking defaults.
- `@litopis/dom/styles/daisyui.css`: maps to daisyUI 5 theme variables.
- `@litopis/dom/styles/shadcn.css`: maps to shadcn semantic theme variables.
- `@litopis/dom/styles/bootstrap.css`: maps to Bootstrap 5.3 root and color-mode variables.

Adapters are CSS-only and do not install or import the corresponding UI library. The host
application remains responsible for loading its daisyUI, shadcn or Bootstrap theme.

For a custom system, start with the foundation:

```css
@import "@litopis/dom/styles/foundation.css";

.litopis,
.litopis-field {
  --litopis-accent: var(--brand);
  --litopis-accent-foreground: var(--on-brand);
  --litopis-background: var(--surface);
  --litopis-border: var(--outline);
  --litopis-border-width: 1px;
  --litopis-calendar-radius: 20px;
  --litopis-danger: var(--danger);
  --litopis-disabled: var(--text-disabled);
  --litopis-focus-ring: color-mix(in oklab, var(--brand) 24%, transparent);
  --litopis-foreground: var(--text);
  --litopis-muted: var(--surface-muted);
  --litopis-muted-foreground: var(--text-muted);
  --litopis-popover-shadow: 0 18px 48px rgb(0 0 0 / 12%);
  --litopis-radius: 8px;
}
```

Advanced tokens include `--litopis-width`, `--litopis-control-size`, `--litopis-day-size`,
`--litopis-calendar-padding`, `--litopis-field-gap`, `--litopis-font-family`,
`--litopis-transition-duration`, `--litopis-focus-width`, `--litopis-input-background`,
`--litopis-calendar-background`, `--litopis-hover-background` and
`--litopis-selected-background`.

See the [Litopis documentation](https://dschewchenko.github.io/litopis/) for keyboard behavior, styling variables and the complete API.
