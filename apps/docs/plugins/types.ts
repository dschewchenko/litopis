import type { ServerResponse } from "node:http";

export type MarkdownEntry = {
  assetPath: string;
  htmlAssetPath: string;
  htmlUrlPath: string;
  markdownUrlPath: string;
  sourcePath: string;
};

export type MarkdownPage = {
  markdown: string;
  summary: string;
  title: string;
};

export type MarkdownIndexEntry = Pick<MarkdownPage, "summary" | "title"> & {
  assetPath: string;
  urlPath: string;
};

export type MarkdownAsset = MarkdownIndexEntry & Pick<MarkdownPage, "markdown">;

export type MarkdownResponse = ServerResponse;
