import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  dts: true,
  deps: {
    neverBundle: ["@litopis/dom", "react"],
  },
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  sourcemap: true,
});
