# Accessibility

Accessibility is package API in Litopis. Visual adapters must not change the
keyboard, focus or announcement contract established by `@litopis/core` and
`@litopis/dom`.

## Target

- WCAG 2.2 AA for supported component scenarios.
- WAI-ARIA Date Picker Dialog and Combobox patterns where those patterns apply.
- Manual typing remains available for date fields.
- Calendar grid uses one active tab stop.
- Selection, focus, disabled dates and current date are exposed through ARIA and
  stable `data-*` attributes.
- Live region announcements cover month changes and focused date changes.

## Test matrix

The release matrix will include:

- Chromium, Firefox and WebKit through Playwright.
- Keyboard regression tests through Vitest and browser automation.
- Accessibility tree and axe checks in CI.
- Manual screen reader notes for VoiceOver, NVDA and JAWS before stable release.

## Known scope

This repository does not claim universal accessibility for every browser and
assistive technology combination. It documents supported combinations and tracks
known issues explicitly.
