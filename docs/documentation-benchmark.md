# Documentation benchmark

Reviewed on 2026-07-16 with current production documentation, Playwright DOM inspection, real
interaction snapshots, desktop/mobile rendering and light/dark checks.

## Reference set

| Documentation                                                              | Strongest pattern                                                                           | Measured content signal                                                         |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [React DayPicker](https://daypicker.dev/)                                  | Short landing path into focused customization and accessibility guides                      | Dedicated API, appearance, input, accessibility, selection and component guides |
| [React Aria DatePicker](https://react-aria.adobe.com/DatePicker)           | Configurable live examples beside copyable code                                             | 6 code/copy blocks, 14 live inputs and API tables on the component page         |
| [Ark UI Date Picker](https://ark-ui.com/docs/components/date-picker)       | Anatomy, curated recipes, API and keyboard support in one component journey                 | 24 show-code examples plus per-part prop and data-attribute tables              |
| [Cally](https://wicky.nillia.ms/cally/)                                    | Framework-neutral markup and working examples with very little ceremony                     | 8 code blocks covering single, range, multiple and multi-month use              |
| [MUI X Date Picker](https://mui.com/x/react-date-pickers/date-picker/)     | Broad task-oriented demos with separate validation, localization and customization branches | 10 demo/code sections and 20 copy actions on the main page                      |
| [shadcn/ui Calendar](https://ui.shadcn.com/docs/components/radix/calendar) | Preview/code pairs and direct copy/install workflow                                         | 12 example sections and 28 copyable code blocks                                 |
| [flatpickr examples](https://flatpickr.js.org/examples/)                   | Dense cookbook where every option is demonstrated live                                      | 29 code blocks and 30 live inputs on one examples page                          |
| [daisyUI Calendar](https://daisyui.com/components/calendar/)               | Honest integration layer over third-party calendar implementations                          | 3 supported calendar libraries with 10 code blocks and 11 copy actions          |

Counts describe the rendered pages at review time. They are comparison signals, not quality scores.

## Litopis decisions

- Put a real working picker and the smallest install path above the fold.
- Keep narrative guides, API reference and recipes separate but connected through shared navigation.
- Maintain one Examples page with an index, real previews, accessible Preview/Code tabs and copy
  actions.
- Pair every documented option group with a runnable example when the current public API supports it.
- Keep the Integrations index framework-neutral. Give React, Vue, Solid, Svelte and Web Components
  independent pages that mount only the package and runtime documented by that page.
- Write integration pages as Installation, Example and API tasks. Remove copy that narrates the
  documentation UI or restates internal architecture without changing how the package is used.
- Include the DOM-free core as a first-class interactive example rather than describing headless use
  only in prose.
- Keep accessibility claims tied to automated browser evidence and the separate manual assistive
  technology matrix.
- Keep public documentation free of internal benchmark language; this file records the rationale.

## Deliberately not copied

- Range, multiple selection and time-picker recipes remain absent until those interaction contracts
  exist in the public API and test suite.
- A framework switcher and comparative runtime matrix are not used. Integration-specific setup,
  live previews and lifecycle guidance stay on independent pages.
- Documentation search and version switching add complexity without enough pages or released
  versions to justify them yet.
- AI-chat launch buttons are not part of the core learning path.
