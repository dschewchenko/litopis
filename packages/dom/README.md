# @litopis/dom

Imperative DOM date fields and date pickers for Litopis.

```sh
npm install @litopis/dom
```

```ts
import { createDatePicker } from "@litopis/dom";
import "@litopis/dom/styles/base.css";

const picker = createDatePicker(document.querySelector("#picker")!, {
  calendarMode: "popover",
  label: "Appointment date",
});
```

The controller returns an ISO `YYYY-MM-DD` value through `picker.getValue()`.

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
