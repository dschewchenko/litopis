import { defineConfig } from "tsdown";

export default defineConfig([
  {
    clean: true,
    dts: true,
    entry: ["src/index.ts"],
    deps: {
      neverBundle: ["@litopis/core"],
    },
    format: ["esm", "cjs"],
    sourcemap: true,
  },
  {
    clean: false,
    deps: {
      alwaysBundle: ["@litopis/core"],
      onlyBundle: false,
    },
    entry: { index: "src/index.ts" },
    format: ["iife"],
    globalName: "LitopisDOM",
    outputOptions: {
      entryFileNames: "[name].global.js",
    },
    sourcemap: true,
  },
]);
