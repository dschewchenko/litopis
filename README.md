# Litopis

Accessible date fields, date pickers and calendar primitives for plain DOM, Web Components, React, Vue, Solid and Svelte.

Litopis keeps calendar math, focus movement and selection in a typed headless core, then exposes
thin adapters for each rendering environment. JavaScript imports never load CSS.

## Install

Choose the adapter used by your application:

```sh
npm install @litopis/dom
npm install @litopis/react react
npm install @litopis/vue vue
npm install @litopis/solid solid-js
npm install @litopis/svelte svelte
```

The DOM and framework adapters are intentionally unstyled. Import the optional base stylesheet for
a usable default presentation:

```ts
import "@litopis/dom/styles/base.css";
```

Or import one adapter for the design system already used by the application:

```css
/* daisyUI 5 */
@import "tailwindcss";
@import "@litopis/dom/styles/daisyui.css";
@plugin "daisyui";
```

```css
/* shadcn */
@import "tailwindcss";
@import "shadcn/tailwind.css";
@import "@litopis/dom/styles/shadcn.css";
```

```css
/* Bootstrap 5.3 */
@import "bootstrap/dist/css/bootstrap.css";
@import "@litopis/dom/styles/bootstrap.css";
```

## Plain DOM

```ts
import { createDatePicker } from "@litopis/dom";
import "@litopis/dom/styles/base.css";

const root = document.querySelector<HTMLElement>("#date-picker");

if (root) {
  const picker = createDatePicker(root, {
    mode: "popover",
    format: "dd.mm.yyyy",
    label: "Appointment date",
    locale: "uk-UA",
  });

  picker.getISOValue(); // YYYY-MM-DD
}
```

## Static sites

The Web Component IIFE includes the Litopis engine and defines `<litopis-date-picker>` automatically:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@litopis/dom/styles/base.css" />
<script src="https://cdn.jsdelivr.net/npm/@litopis/elements/dist/index.global.js"></script>

<litopis-date-picker
  mode="popover"
  format="dd.mm.yyyy"
  label="Start date"
  locale="uk-UA"
></litopis-date-picker>
```

Pin an exact package version in production CDN URLs.

## Vue ranges

Bind the complete range when it is one value in application state. When a form keeps endpoints
separately, named models map directly to those fields:

```vue
<LitopisDatePicker v-model:from="from" v-model:to="to" selection="range" layout="split" />
```

## Packages

- `@litopis/core` — DOM-free calendar state, date math, focus movement and localization.
- `@litopis/dom` — unstyled imperative date field and date picker controllers plus optional CSS.
- `@litopis/elements` — Web Components and a browser IIFE.
- `@litopis/react` — React component.
- `@litopis/vue` — Vue component.
- `@litopis/solid` — Solid component.
- `@litopis/svelte` — Svelte action.

All packages are ESM-only and release together from this monorepo.

## Accessibility

Litopis follows the WAI-ARIA grid and combobox interaction patterns where they apply. The release gate covers:

- Arrow keys, Home, End, PageUp and PageDown navigation.
- Shift+PageUp and Shift+PageDown year navigation.
- Roving focus, keyboard selection and Escape focus restoration.
- Selection, current date, disabled state and input validity semantics.
- Automated axe checks in Chromium, Firefox and WebKit.

Manual VoiceOver, NVDA and JAWS verification is tracked separately and is required before a stable accessibility claim. See [ACCESSIBILITY.md](./ACCESSIBILITY.md) and the [manual matrix](./docs/accessibility-manual-matrix.md).

## Styling

Styling is layered so behavior never depends on presentation:

- Import no CSS for a completely unstyled but functional picker.
- Import `styles/foundation.css` and provide `--litopis-*` tokens for a custom design system.
- Import `styles/base.css` for a small native-looking default.
- Import `styles/daisyui.css`, `styles/shadcn.css` or `styles/bootstrap.css` to consume that system's
  existing semantic theme variables.

The foundation exposes stable `.litopis-*` anatomy, `data-*` states and variables for color,
typography, spacing, control sizes, radii, focus treatment, motion and popover geometry. Theme
adapters contain CSS only: no runtime dependency and no third-party calendar DOM contract.

## Development

```sh
bun install
bun run check
bun run test:browser
bun run build
```

`bun run check:release` runs the full unit, adapter, browser, accessibility and build gate.

## Releases

Packages release together through Changesets. Add a changeset for user-facing changes:

```sh
bun run changeset
```

See the [documentation site](https://dschewchenko.github.io/litopis/) for live examples and adapter guides.

## License

Litopis is licensed under the [Apache License 2.0](./LICENSE).
