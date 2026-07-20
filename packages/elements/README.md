# @litopis/elements

Web Components backed by the Litopis DOM controller.

```sh
npm install @litopis/elements @litopis/dom
```

```ts
import "@litopis/elements";
import "@litopis/dom/styles/base.css";
```

```html
<litopis-date-picker calendar-mode="popover" label="Start date"></litopis-date-picker>
```

For static sites, use `dist/index.global.js` from the package together with `@litopis/dom/styles/base.css`.

See the [Web Components integration guide](https://dschewchenko.github.io/litopis/integrations/web-components/) for attributes, the value property and CDN usage.
