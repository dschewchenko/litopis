# Research Notes

## References

- DayPicker: https://daypicker.dev/
- DayPicker styling: https://daypicker.dev/docs/styling
- Cally: https://wicky.nillia.ms/cally/
- Cally accessibility: https://wicky.nillia.ms/cally/accessibility/
- Cally theming: https://wicky.nillia.ms/cally/guides/theming/
- React Aria DatePicker: https://react-aria.adobe.com/DatePicker
- Zag Date Picker: https://zagjs.com/components/react/date-picker

## Product Direction

Litopis should not be a design-system component kit. It should be a portable
calendar and date-picker engine with thin adapters.

Useful patterns from existing libraries:

- DayPicker: clear guides, selection modes, styling API, localization docs and
  CSS-framework examples.
- Cally: small Web Components, CSS parts, slots, custom properties and explicit
  accessibility notes with known limitations.
- React Aria: strong accessibility and internationalization model, especially
  date-field and calendar composition.
- Zag: framework-agnostic state machines and adapters for multiple frameworks.

## Decisions

- Keep `@litopis/core` as the source of calendar behavior.
- Keep DOM, Web Components and framework adapters thin.
- Use stable anatomy: classes, data attributes, CSS variables, CSS parts and
  later class maps.
- Do not ship separate Tailwind, daisyUI or Bootstrap packages first.
- Make the docs a working playground with static HTML pages for guides, styling,
  adapters and accessibility.

## Quality Bar

Litopis should be better than the references in the combined surface:

- Smaller and more portable than framework-only date pickers.
- More explicit about accessibility limits and test coverage than most
  component docs.
- Easier to style with plain CSS and UI libraries than Web Components that only
  expose closed styling hooks.
- Clearer about typed values, min/max rules and out-of-range input behavior.
