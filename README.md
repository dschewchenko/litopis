# Litopis

Accessible date and calendar primitives.

Litopis is a lightweight package family for building date fields, date pickers
and calendars across plain DOM, Web Components and framework adapters.

## Why Litopis

- Headless core for shared date math, focus and validation.
- DOM, Web Components, React, Vue, Solid, Svelte and static-site bundles.
- Stable classes, `data-*` states and CSS variables for styling.
- Works with plain CSS, Tailwind, daisyUI and Bootstrap.
- Built to follow WCAG and WAI-ARIA patterns out of the box.
- Native Intl localization with English fallback, date masks and configurable week start.
- Mobile picker patterns: bottom sheet, fullscreen dialog, popover and native input.

## Accessibility status

Foundation exists: keyboard navigation, roving focus, labels, disabled states
and live announcements. Stable claims require axe, browser and screen-reader
verification before release.

## Packages

```txt
@litopis/core       Headless date and calendar engine
@litopis/dom        DOM bindings and imperative browser API
@litopis/elements   Web Components
@litopis/react      React component
@litopis/vue        Vue component
@litopis/solid      Solid component
@litopis/svelte     Svelte action
```

Litopis does not ship framework-specific theme packages. It exposes stable
classes and data attributes so libraries like daisyUI can style it in the
consumer app.

## Development

```sh
bun install
bun run dev
bun run check
bun run build
```

## Release model

Packages release together from the monorepo through Changesets. Add a changeset
for user-facing package changes:

```sh
bun run changeset
```

## Static usage target

Litopis publishes normal npm packages and browser bundles for static sites:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@litopis/elements/dist/index.js"></script>
<litopis-date-picker></litopis-date-picker>
```

IIFE bundles target CDN integration without a build step.
