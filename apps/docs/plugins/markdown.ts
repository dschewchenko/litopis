import { readFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { Window, type Element as HtmlElement, type Node as HtmlNode } from "happy-dom";
import type { Plugin } from "vite";
import type {
  MarkdownAsset,
  MarkdownEntry,
  MarkdownIndexEntry,
  MarkdownPage,
  MarkdownResponse,
} from "./types.ts";

const sitePath = "/litopis/";
const llmsPath = "/litopis/llms.txt";
const ignoredTags = new Set([
  "BUTTON",
  "FORM",
  "INPUT",
  "NOSCRIPT",
  "OPTION",
  "SCRIPT",
  "SELECT",
  "STYLE",
  "TEXTAREA",
]);

export function docsMarkdown(entries: Record<string, string>): Plugin {
  const pages = createEntries(entries);
  const docsRoot = dirname(resolve(entries.index!));
  const examplesPage = pages.find((page) => page.htmlAssetPath === "examples/index.html");
  const htmlToMarkdown = new Map(pages.map((page) => [page.htmlUrlPath, page.markdownUrlPath]));
  const pageByUrl = new Map(pages.map((page) => [page.markdownUrlPath, page]));

  return {
    name: "litopis-docs-markdown",
    enforce: "post",
    transformIndexHtml(html) {
      return inlineExampleSources(html, docsRoot);
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const path = requestPath(request.url);
        if (!path) {
          next();
          return;
        }

        if (path === llmsPath) {
          void renderAllPages(pages, htmlToMarkdown, docsRoot)
            .then((rendered) => sendMarkdown(response, renderLlmsIndex(rendered)))
            .catch(next);
          return;
        }

        const page = pageByUrl.get(path);
        if (!page) {
          if (examplesPage && path.startsWith(`${sitePath}examples/`) && path.endsWith(".md")) {
            void readDocument(examplesPage.sourcePath, docsRoot)
              .then((html) => {
                const recipe = renderRecipes(html, htmlToMarkdown).find(
                  (item) => item.urlPath === path,
                );
                if (recipe) {
                  sendMarkdown(response, recipe.markdown);
                } else {
                  response.statusCode = 404;
                  response.end("Example not found");
                }
              })
              .catch(next);
            return;
          }
          next();
          return;
        }

        void readDocument(page.sourcePath, docsRoot)
          .then((html) => sendMarkdown(response, renderPage(html, htmlToMarkdown).markdown))
          .catch(next);
      });
    },
    async generateBundle(_options, bundle) {
      const renderedPages = await Promise.all(
        pages.map(async (page) => {
          const asset = bundle[page.htmlAssetPath];
          if (!asset || asset.type !== "asset") {
            throw new Error(`Vite did not emit the HTML entry "${page.htmlAssetPath}".`);
          }

          const html =
            typeof asset.source === "string"
              ? asset.source
              : new TextDecoder().decode(asset.source);
          return { ...page, ...renderPage(html, htmlToMarkdown) };
        }),
      );

      for (const page of renderedPages) {
        this.emitFile({ type: "asset", fileName: page.assetPath, source: page.markdown });
      }
      const examplesAsset = bundle["examples/index.html"];
      const recipes =
        examplesAsset?.type === "asset"
          ? renderRecipes(String(examplesAsset.source), htmlToMarkdown)
          : [];
      for (const recipe of recipes) {
        this.emitFile({ type: "asset", fileName: recipe.assetPath, source: recipe.markdown });
      }
      this.emitFile({
        type: "asset",
        fileName: "llms.txt",
        source: renderLlmsIndex([
          ...renderedPages.map((page) => ({
            assetPath: page.assetPath,
            summary: page.summary,
            title: page.title,
            urlPath: page.markdownUrlPath,
          })),
          ...recipes,
        ]),
      });
    },
  };
}

function createEntries(entries: Record<string, string>): Array<MarkdownEntry> {
  if (!entries.index) {
    throw new Error('docsMarkdown requires the explicit Vite entry named "index".');
  }

  const docsRoot = dirname(resolve(entries.index));
  const assetPaths = new Set<string>();
  const htmlPaths = new Set<string>();
  return Object.entries(entries).map(([name, sourcePath]) => {
    if (!isAbsolute(sourcePath)) {
      throw new Error(`Documentation entry "${name}" must use an absolute HTML path.`);
    }
    const absolutePath = resolve(sourcePath);
    const relativePath = relative(docsRoot, absolutePath);
    if (
      relativePath.startsWith(`..${sep}`) ||
      relativePath === ".." ||
      !relativePath.endsWith(".html")
    ) {
      throw new Error(
        `Documentation entry "${name}" must be an HTML file inside the docs directory.`,
      );
    }

    const htmlAssetPath = posix(relativePath);
    const assetPath = markdownAssetPath(htmlAssetPath);
    const htmlUrlPath = htmlUrl(htmlAssetPath);
    if (assetPaths.has(assetPath) || htmlPaths.has(htmlUrlPath)) {
      throw new Error(`Documentation entry "${name}" duplicates an existing page path.`);
    }
    assetPaths.add(assetPath);
    htmlPaths.add(htmlUrlPath);

    return {
      assetPath,
      htmlAssetPath,
      htmlUrlPath,
      markdownUrlPath: `${sitePath}${assetPath}`,
      sourcePath: absolutePath,
    };
  });
}

function markdownAssetPath(htmlPath: string): string {
  if (htmlPath === "index.html") {
    return "index.md";
  }
  if (htmlPath.endsWith("/index.html")) {
    return `${htmlPath.slice(0, -11)}.md`;
  }
  return `${htmlPath.slice(0, -5)}.md`;
}

function htmlUrl(htmlPath: string): string {
  if (htmlPath === "index.html") {
    return sitePath;
  }
  if (htmlPath.endsWith("/index.html")) {
    return `${sitePath}${htmlPath.slice(0, -10)}`;
  }
  return `${sitePath}${htmlPath.slice(0, -5)}`;
}

function posix(path: string): string {
  return path.split(sep).join("/");
}

function requestPath(requestUrl: string | undefined): string | null {
  if (!requestUrl) {
    return null;
  }
  try {
    return new URL(requestUrl, "http://litopis.local").pathname;
  } catch {
    return null;
  }
}

async function renderAllPages(
  pages: Array<MarkdownEntry>,
  htmlToMarkdown: Map<string, string>,
  docsRoot: string,
): Promise<Array<MarkdownIndexEntry>> {
  const rendered = await Promise.all(
    pages.map(async (page) => {
      const html = await readDocument(page.sourcePath, docsRoot);
      const rendered = renderPage(html, htmlToMarkdown);
      return {
        assetPath: page.assetPath,
        summary: rendered.summary,
        title: rendered.title,
        urlPath: page.markdownUrlPath,
      };
    }),
  );
  const examples = pages.find((page) => page.htmlAssetPath === "examples/index.html");
  if (examples) {
    rendered.push(
      ...renderRecipes(await readDocument(examples.sourcePath, docsRoot), htmlToMarkdown),
    );
  }
  return rendered;
}

async function readDocument(sourcePath: string, docsRoot: string): Promise<string> {
  return inlineExampleSources(await readFile(sourcePath, "utf8"), docsRoot);
}

async function inlineExampleSources(html: string, docsRoot: string): Promise<string> {
  const markers = [...html.matchAll(/<code\s+data-source-code="([^"]+)"\s*>\s*<\/code>/g)];
  const exampleRoot = `${resolve(docsRoot, "src/examples")}${sep}`;
  for (const [marker, reference] of markers) {
    const sourcePath = resolve(docsRoot, reference!);
    if (!sourcePath.startsWith(exampleRoot) || !sourcePath.endsWith(".ts")) {
      throw new Error(`Example source must be a TypeScript file in src/examples: ${reference}`);
    }
    const code = (await readFile(sourcePath, "utf8")).trimEnd();
    const escaped = code.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    html = html.replace(marker, `<code data-source-code="${reference}">${escaped}</code>`);
  }
  return html;
}

function renderRecipes(html: string, links: Map<string, string>): Array<MarkdownAsset> {
  const window = createWindow();
  try {
    const document = new window.DOMParser().parseFromString(html, "text/html");
    return [...document.querySelectorAll("article.example-card[id]")].map((article) => {
      const heading = article.querySelector("h2")!;
      const title = document.createElement("h1");
      title.textContent = heading.textContent;
      heading.replaceWith(title);
      const rendered = renderPage(`<main class="vp-doc">${article.innerHTML}</main>`, links);
      const packages = article.getAttribute("data-example-packages");
      const install = packages ? `\n\`\`\`sh\nnpm install ${packages}\n\`\`\`\n` : "";
      return {
        ...rendered,
        markdown: rendered.markdown.replace(/^(# .+\n)/m, `$1${install}`),
        assetPath: `examples/${article.id}.md`,
        urlPath: `${sitePath}examples/${article.id}.md`,
      };
    });
  } finally {
    void window.happyDOM.close();
  }
}

function createWindow(): Window {
  return new Window({
    settings: {
      disableCSSFileLoading: true,
      disableComputedStyleRendering: true,
      disableIframePageLoading: true,
      disableJavaScriptEvaluation: true,
      disableJavaScriptFileLoading: true,
    },
  });
}

function renderPage(html: string, htmlToMarkdown: Map<string, string>): MarkdownPage {
  const window = createWindow();

  try {
    const document = new window.DOMParser().parseFromString(html, "text/html");
    const main = document.querySelector("main.vp-doc");
    if (!main) {
      throw new Error('Documentation HTML must include a "main.vp-doc" element.');
    }

    const markdown = renderBlocks([...main.childNodes], htmlToMarkdown)
      .join("\n\n")
      .trim();
    const title = cleanText(main.querySelector("h1")?.textContent ?? "Litopis");
    let summary = "";
    for (const paragraph of main.querySelectorAll("p")) {
      if (paragraph.closest(".eyebrow")) {
        continue;
      }
      summary = cleanText(paragraph.textContent ?? "");
      if (summary) {
        break;
      }
    }
    return { markdown: `${markdown}\n`, summary, title };
  } finally {
    void window.happyDOM.close();
  }
}

function renderBlocks(nodes: Array<HtmlNode>, links: Map<string, string>): Array<string> {
  const result: Array<string> = [];
  for (const node of nodes) {
    if (node.nodeType !== 1) {
      continue;
    }
    const element = node as HtmlElement;
    const block = renderBlock(element, links);
    if (block) {
      result.push(block);
    }
  }
  return result;
}

function renderBlock(element: HtmlElement, links: Map<string, string>): string {
  const content = renderElement(element, links);
  const id = element.getAttribute("id");
  if (!content) {
    return element.tagName === "A" && id ? `<a id="${id}"></a>` : "";
  }
  return id ? `<a id="${id}"></a>\n\n${content}` : content;
}

function renderElement(element: HtmlElement, links: Map<string, string>): string {
  if (ignoredTags.has(element.tagName) || element.getAttribute("aria-hidden") === "true") {
    return "";
  }
  if (
    element.hasAttribute("data-playground") ||
    element.hasAttribute("data-daisyui-demo") ||
    element.classList.contains("integration-demo") ||
    element.classList.contains("theme-playground-preview")
  ) {
    return "";
  }
  if (element.classList.contains("vp-code-group")) {
    return renderCode(element);
  }

  if (/^H[1-6]$/.test(element.tagName)) {
    const level = Number(element.tagName.slice(1));
    return `${"#".repeat(level)} ${renderInline(element, links).trim()}`;
  }
  if (element.tagName === "P") {
    return renderInline(element, links).trim();
  }
  if (element.tagName === "PRE") {
    return renderPre(element, "");
  }
  if (element.tagName === "UL" || element.tagName === "OL") {
    return renderList(element, links, 0);
  }
  if (element.tagName === "TABLE") {
    return renderTable(element, links);
  }
  if (element.tagName === "BLOCKQUOTE") {
    return renderBlocks([...element.childNodes], links)
      .join("\n\n")
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n");
  }
  if (element.tagName === "HR") {
    return "---";
  }
  return renderBlocks([...element.childNodes], links).join("\n\n");
}

function renderCode(group: HtmlElement): string {
  const pre = group.querySelector("pre");
  return pre ? renderPre(pre, cleanText(group.querySelector(".lang")?.textContent ?? "")) : "";
}

function renderPre(pre: HtmlElement, language: string): string {
  const code = pre.querySelector("code") ?? pre;
  const content = (code.textContent ?? "").replaceAll(/\r\n?/g, "\n").replace(/\n+$/, "");
  if (!content.trim()) {
    return "";
  }
  const longestTicks = Math.max(0, ...(content.match(/`+/g) ?? []).map((run) => run.length));
  const fence = "`".repeat(Math.max(3, longestTicks + 1));
  return `${fence}${language}\n${content}\n${fence}`;
}

function renderList(list: HtmlElement, links: Map<string, string>, depth: number): string {
  const items = [...list.children].filter((child) => child.tagName === "LI");
  const ordered = list.tagName === "OL";
  const startValue = Number(list.getAttribute("start"));
  let number = Number.isInteger(startValue) && startValue > 0 ? startValue : 1;

  return items
    .map((item) => {
      const indent = "  ".repeat(depth);
      const marker = ordered ? `${number++}.` : "-";
      const blocks: Array<string> = [];
      let text = "";
      const flush = () => {
        if (text.trim()) {
          blocks.push(text.trim());
        }
        text = "";
      };

      for (const child of item.childNodes) {
        if (child.nodeType === 3) {
          text += inlineText(child.textContent ?? "");
        } else if (child.nodeType === 1) {
          const nested = child as HtmlElement;
          if (nested.tagName === "UL" || nested.tagName === "OL") {
            flush();
            blocks.push(renderList(nested, links, depth + 1));
          } else if (nested.tagName === "P") {
            flush();
            text = renderInline(nested, links).trim();
            flush();
          } else {
            text += renderInline(nested, links);
          }
        }
      }
      flush();

      const first = blocks.shift() ?? "";
      const lines = [`${indent}${marker} ${first}`];
      for (const block of blocks) {
        lines.push(block.includes("\n") ? block : `${indent}  ${block}`);
      }
      return lines.join("\n");
    })
    .join("\n");
}

function renderTable(table: HtmlElement, links: Map<string, string>): string {
  const rows = [...table.querySelectorAll("tr")].map((row) => {
    const cells: Array<string> = [];
    for (const cell of row.children) {
      if (cell.tagName === "TH" || cell.tagName === "TD") {
        cells.push(
          renderInline(cell, links)
            .trim()
            .replaceAll("|", String.raw`\|`),
        );
      }
    }
    return cells;
  });
  if (!rows.length) {
    return "";
  }

  const headers = rows.shift() ?? [];
  const columns = Math.max(1, headers.length, ...rows.map((row) => row.length));
  const pad = (cells: Array<string>) =>
    Array.from({ length: columns }, (_, index) => cells[index] ?? "");
  const lines = [
    `| ${pad(headers).join(" | ")} |`,
    `| ${Array.from({ length: columns }, () => "---").join(" | ")} |`,
  ];
  for (const row of rows) {
    lines.push(`| ${pad(row).join(" | ")} |`);
  }
  return lines.join("\n");
}

function renderInline(node: HtmlNode, links: Map<string, string>): string {
  if (node.nodeType === 3) {
    return inlineText(node.textContent ?? "");
  }
  if (node.nodeType !== 1) {
    return "";
  }
  const element = node as HtmlElement;
  if (ignoredTags.has(element.tagName) || element.getAttribute("aria-hidden") === "true") {
    return "";
  }

  const content = [...element.childNodes].map((child) => renderInline(child, links)).join("");
  if (element.tagName === "BR") {
    return "  \n";
  }
  if (element.tagName === "CODE" || element.tagName === "KBD") {
    return inlineCode(content);
  }
  if (element.tagName === "STRONG" || element.tagName === "B") {
    return `**${content}**`;
  }
  if (element.tagName === "EM" || element.tagName === "I") {
    return `*${content}*`;
  }
  if (element.tagName === "A") {
    const href = element.getAttribute("href");
    return href && content.trim() ? `[${content.trim()}](${markdownUrl(href, links)})` : content;
  }
  if (element.tagName === "IMG") {
    const alt = cleanText(element.getAttribute("alt") ?? "");
    const src = element.getAttribute("src");
    return src ? `![${alt}](${src})` : alt;
  }
  return content;
}

function inlineCode(content: string): string {
  const longestTicks = Math.max(0, ...(content.match(/`+/g) ?? []).map((run) => run.length));
  const fence = "`".repeat(longestTicks + 1);
  const padding = content.startsWith("`") || content.endsWith("`") ? " " : "";
  return `${fence}${padding}${content}${padding}${fence}`;
}

function inlineText(text: string): string {
  return text.replaceAll(/\s+/g, " ");
}

function cleanText(text: string): string {
  return inlineText(text).trim();
}

function markdownUrl(href: string, links: Map<string, string>): string {
  if (href.startsWith("#")) {
    return href;
  }
  try {
    const url = new URL(href, "http://litopis.local");
    if (url.origin !== "http://litopis.local") {
      return href;
    }
    const mapped = links.get(url.pathname);
    return mapped ? `${mapped}${url.hash}` : href;
  } catch {
    return href;
  }
}

function renderLlmsIndex(pages: Array<MarkdownIndexEntry>): string {
  const sorted = [...pages].sort((left, right) => {
    if (left.assetPath === "index.md") {
      return -1;
    }
    if (right.assetPath === "index.md") {
      return 1;
    }
    return left.assetPath.localeCompare(right.assetPath);
  });
  const lines = [
    "# Litopis documentation",
    "",
    "Start with the integration page for your framework. Open the API or guides for details.",
    "",
    ...sorted.map(
      (page) => `- [${page.title}](${page.urlPath})${page.summary ? `: ${page.summary}` : ""}`,
    ),
    "",
  ];
  return lines.join("\n");
}

function sendMarkdown(response: MarkdownResponse, content: string): void {
  response.statusCode = 200;
  response.setHeader("Content-Type", "text/markdown; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(content);
}
