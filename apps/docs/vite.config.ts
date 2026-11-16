import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { docsMarkdown } from "./plugins/markdown.ts";

const root = new URL(".", import.meta.url);

const documentationEntries = {
  accessibility: new URL("accessibility/index.html", root).pathname,
  api: new URL("api/index.html", root).pathname,
  examples: new URL("examples/index.html", root).pathname,
  guides: new URL("guides/index.html", root).pathname,
  index: new URL("index.html", root).pathname,
  integrations: new URL("integrations/index.html", root).pathname,
  "integrations-daisyui": new URL("integrations/daisyui/index.html", root).pathname,
  "integrations-react": new URL("integrations/react/index.html", root).pathname,
  "integrations-solid": new URL("integrations/solid/index.html", root).pathname,
  "integrations-svelte": new URL("integrations/svelte/index.html", root).pathname,
  "integrations-vue": new URL("integrations/vue/index.html", root).pathname,
  "integrations-web-components": new URL("integrations/web-components/index.html", root).pathname,
  styling: new URL("styling/index.html", root).pathname,
};

export default defineConfig({
  base: "/litopis/",
  plugins: [tailwindcss(), docsMarkdown(documentationEntries)],
  build: {
    target: ["chrome107", "edge107", "firefox104", "safari16.0"],
    rolldownOptions: {
      input: documentationEntries,
    },
  },
  resolve: {
    alias: {
      "@litopis/core": new URL("../../packages/core/src/index.ts", import.meta.url).pathname,
      "@litopis/dom/styles": new URL("../../packages/dom/styles", import.meta.url).pathname,
      "@litopis/dom": new URL("../../packages/dom/src/index.ts", import.meta.url).pathname,
      "@litopis/elements": new URL("../../packages/elements/src/index.ts", import.meta.url)
        .pathname,
      "@litopis/react": new URL("../../packages/react/src/index.ts", import.meta.url).pathname,
      "@litopis/solid": new URL("../../packages/solid/src/index.ts", import.meta.url).pathname,
      "@litopis/svelte": new URL("../../packages/svelte/src/index.ts", import.meta.url).pathname,
      "@litopis/vue": new URL("../../packages/vue/src/index.ts", import.meta.url).pathname,
    },
  },
});
