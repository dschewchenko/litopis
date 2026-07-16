import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@litopis/core": new URL("./packages/core/src/index.ts", import.meta.url).pathname,
      "@litopis/dom": new URL("./packages/dom/src/index.ts", import.meta.url).pathname,
      "@litopis/elements": new URL("./packages/elements/src/index.ts", import.meta.url).pathname,
    },
  },
  test: {
    environment: "happy-dom",
    include: ["packages/**/*.test.ts"],
  },
});
