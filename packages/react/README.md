# @litopis/react

React adapter for the Litopis date picker.

```sh
npm install @litopis/react react
```

```tsx
import { LitopisDatePicker } from "@litopis/react";
import "@litopis/dom/styles/base.css";

<LitopisDatePicker value={date} onValueChange={setDate} />;
```

See the [React integration guide](https://dschewchenko.github.io/litopis/integrations/react/) for controlled values and controller access.

Pass `selection: "range"` and `name` to `LitopisDatePicker` options for a
synchronized native form range.
