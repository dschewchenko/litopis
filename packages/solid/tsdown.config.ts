import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  dts: true,
  deps: {
    neverBundle: ["@litopis/dom", "solid-js"],
  },
  entry: ["src/index.ts"],
  format: ["esm"],
  sourcemap: true,
});
