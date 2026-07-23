# Accessibility

Litopis is built to preserve one keyboard, focus and announcement contract
across `@litopis/dom`, Web Components and framework adapters.

## Target

- WCAG 2.2 AA for supported component scenarios.
- WAI-ARIA Date Picker Dialog and Combobox patterns where those patterns apply.
- Manual typing remains available for date fields.
- Calendar grid uses one active tab stop and returns focus predictably after selection or Escape.
- Selection, focus, disabled dates and current date are exposed through ARIA and
  stable `data-*` attributes.
- Live region announcements cover month changes and focused date changes.

## Automated release matrix

Every release gate includes:

- Chromium, Firefox and WebKit through Playwright.
- Keyboard regression tests through Vitest and real browser automation.
- Axe checks across every documentation page in all three browser engines.
- Package adapter tests and a publish-layout check.

## Manual matrix

VoiceOver, NVDA and JAWS verification is still pending. Record the browser,
screen reader version, scenario, result and any known issue before making a
stable accessibility claim. Automated checks are a release requirement, but
they do not replace assistive-technology testing.

Use the [manual accessibility matrix](./docs/accessibility-manual-matrix.md) to
record the required combinations and scenarios.

## Known scope

This repository does not claim universal accessibility for every browser and
assistive technology combination. It documents supported combinations and tracks
known issues explicitly.
