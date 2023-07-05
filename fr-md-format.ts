#!/bin/env -S deno run -A
// Note `env -S` may not be portable, https://unix.stackexchange.com/a/477651

// vim: ft=typescript

import { unified } from "npm:unified";
import remarkParse from "npm:remark-parse";
import { handle as defaultHandlers } from "npm:mdast-util-to-markdown/lib/handle/index.js";
import remarkGfm from "npm:remark-gfm";
import remarkStringify from "npm:remark-stringify";
import { Command, string } from "https://deno.land/x/clay@v0.2.5/mod.ts";

const main = async () => {
  const cmd = new Command("francium's custom markdown formatter")
    .required(string, "file");

  const args = cmd.run();

  const inputText = Deno.readTextFileSync(args.file);
  const formattedFile = await format(inputText);
  Deno.writeTextFileSync(args.file, formattedFile);
};

export const format = async (src: string): Promise<string> => {
  const resultVFile = await unified()
    .use(remarkParse, {})
    .use(remarkGfm)
    .use(remarkStringify, {
      bullet: "-",
      emphasis: "_",
      fences: true,
      listItemIndent: "one",
      tightDefinitions: true,
      resourceLink: false,
      handlers: {
        link: (node, parent, state, info) => {
          // If the text is just a raw literal link ("https://example.com"),
          // just return it as is without any formatting
          if (node.children.length === 1) {
            const child = node.children[0];
            const cp = child.position;
            const p = node.position;
            if (
              cp.start.line === p.start.line &&
              cp.start.column === p.start.column &&
              cp.start.offset === p.start.offset &&
              cp.end.line === p.end.line &&
              cp.end.column === p.end.column &&
              cp.end.offset === p.end.offset
            ) {
              return node.url;
            }
          }

          // By default the `link` handler will escape `&` in URLs. There does
          // not appear to be a way to remove the `&` unsafe entry from the
          // `unsafe` config this plugin accepts. So instead, this tries to
          // mimic the default handler but does not apply any escaping.
          const defaultOutput = defaultHandlers.link(node, parent, state, info);
          // Just extract the text between the square brackets ("[...]")
          const label = defaultOutput.split("](")[0].slice(1);
          return `[${label}](${node.url})`;
        },

        // The remarkGfm extension doesn't handle indeterminate checkboxes. Not
        // sure if there's a way to override the extension's code, it's not a
        // handler in the state.handlers, nor can it be overriden using the
        // config passed to `remarkStringify`. So for now, this regex, while
        // hacky, does the trick.
        list: (node, parent, state, info) => {
          const result = defaultHandlers.list(node, parent, state, info);
          return result.replaceAll(/^\s*- \\\[-\] /gm, "- [-] ");
        },
      },
      join: [
        (left, right) => {
          if (left.type === "heading" && right.type === "heading") {
            return 2;
          }
          if (right.type === "heading") {
            return 2;
          }

          return undefined;
        },
      ],
    })
    .process(src);

  let result = resultVFile.toString();
  result = processMailtoPrefixes(src, result);

  return result;
};

const processMailtoPrefixes = (src: string, result: string): string => {
  // This is a hacky way of removing the remarkGfm `mailto:` prefix behavior.
  // Not sure if there's a way to configure it or override it to make it stop
  // adding a `mailto:` prefix.
  //
  // If there's a already a 'mailto:' in the source, then don't try to remove
  // the prefix

  // Regex is stateful, can't reuse same instance
  const mailtoPrefixRegex = () => /mailto:(?=[^\s@]*?@)/g;
  if (mailtoPrefixRegex().test(src) && result.includes("mailto:mailto:")) {
    result = result.replaceAll("mailto:mailto:", "mailto:");
  }
  if (!mailtoPrefixRegex().test(src) && mailtoPrefixRegex().test(result)) {
    result = result.replaceAll(mailtoPrefixRegex(), "");
  }

  return result;
};

if (import.meta.main) {
  main();
}
