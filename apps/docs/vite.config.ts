import { defineConfig } from "vite";

const root = new URL(".", import.meta.url);

export default defineConfig({
  base: "/litopis/",
  build: {
    rollupOptions: {
      input: {
        accessibility: new URL("accessibility/index.html", root).pathname,
        adapters: new URL("adapters/index.html", root).pathname,
        guides: new URL("guides/index.html", root).pathname,
        index: new URL("index.html", root).pathname,
        styling: new URL("styling/index.html", root).pathname,
      },
    },
  },
  resolve: {
    alias: {
      "@litopis/core": new URL("../../packages/core/src/index.ts", import.meta.url).pathname,
      "@litopis/dom": new URL("../../packages/dom/src/index.ts", import.meta.url).pathname,
      "@litopis/elements": new URL("../../packages/elements/src/index.ts", import.meta.url)
        .pathname,
    },
  },
});
