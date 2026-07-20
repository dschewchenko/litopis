# @litopis/core

DOM-free date math, calendar state, focus movement and selection for Litopis adapters or custom
renderers. The package compiles against ECMAScript libraries only and can run in Node.js, workers
and browsers without a UI layer.

Headless, localized calendar state and date utilities for Litopis.

```sh
npm install @litopis/core
```

```ts
import { createCalendarState, moveFocus } from "@litopis/core";

const calendar = createCalendarState({ locale: "uk-UA" });
const next = moveFocus(calendar, "next-day");
```

See the [Litopis documentation](https://dschewchenko.github.io/litopis/) for the complete API and accessibility contract.
