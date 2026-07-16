import { defineConfig } from "tsdown";

export default defineConfig([
  {
    clean: true,
    dts: true,
    entry: ["src/index.ts"],
    deps: {
      neverBundle: ["@litopis/core", "@litopis/dom"],
    },
    format: ["esm"],
    sourcemap: true,
  },
  {
    clean: false,
    deps: {
      alwaysBundle: ["@litopis/core", "@litopis/dom"],
      onlyBundle: false,
    },
    entry: { index: "src/index.ts" },
    format: ["iife"],
    globalName: "LitopisElements",
    minify: true,
    outputOptions: {
      entryFileNames: "[name].global.js",
    },
    sourcemap: true,
  },
]);
