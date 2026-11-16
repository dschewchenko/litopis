import type {
  DatePickerController,
  DatePickerOptions,
  DatePickerValue,
  DatePickerValueAs,
} from "@litopis/dom";

export type ThemePlaygroundStyle = "base" | "bootstrap" | "daisyui" | "foundation" | "shadcn";
export type PackageManager = "bun" | "npm" | "pnpm" | "yarn";
export type PlaygroundFirstDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type PlaygroundPickerController = DatePickerController<DatePickerValueAs>;
export type PlaygroundPickerOptions = DatePickerOptions<DatePickerValueAs>;
export type PlaygroundPickerValue = DatePickerValue<DatePickerValueAs>;

export interface ThemePlaygroundContent {
  readonly code: string;
  readonly description: string;
}

export interface PackageManagerDefinition {
  readonly command: string;
  readonly label: string;
}
