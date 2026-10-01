import { defineConfig } from "tsdown";

export default defineConfig([
  {
    clean: true,
    dts: true,
    entry: ["src/index.ts"],
    deps: {
      neverBundle: ["@litopis/core"],
    },
    format: ["esm"],
    sourcemap: true,
    target: "es2020",
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
    minify: true,
    outputOptions: {
      entryFileNames: "[name].global.js",
    },
    sourcemap: true,
    target: "es2020",
  },
]);
