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

Pass your own input as a child with `slot="input"`:

```tsx
<LitopisDatePicker value={date} onValueChange={setDate}>
  <input slot="input" className="my-input" placeholder="Choose a date" />
</LitopisDatePicker>
```

See the [React integration guide](https://dschewchenko.github.io/litopis/integrations/react/) for controlled values and controller access.

Pass `selection: "range"` and `name` to `LitopisDatePicker` options for a
synchronized native form range.
