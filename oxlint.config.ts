import nkzw from "@nkzw/oxlint-config";
import { defineConfig, type OxlintConfig, type Oxlintrc } from "oxlint";
import projectConfigJson from "./oxlint.project.json" with { type: "json" };

const projectConfig: Oxlintrc = projectConfigJson;

const {
  $schema: _schema,
  extends: _projectExtends,
  plugins: projectPlugins,
  rules: projectRules,
  overrides: projectOverrides,
  ...projectOptions
} = projectConfig;
const rules: NonNullable<Oxlintrc["rules"]> = {
  ...(nkzw.rules ?? {}),
  ...(projectRules ?? {}),
  "@typescript-eslint/await-thenable": "error",
};

const config: OxlintConfig = defineConfig({
  extends: [nkzw],
  ...projectOptions,
  plugins: [...new Set([...(nkzw.plugins ?? []), ...(projectPlugins ?? [])])],
  rules,
  overrides: [...(nkzw.overrides ?? []), ...(projectOverrides ?? [])],
});

export default config;
