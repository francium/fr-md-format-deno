#!/bin/env -S deno run -A
// Note `env -S` may not be portable, https://unix.stackexchange.com/a/477651

// vim: ft=typescript

import { unified } from "npm:unified";
import remarkParse from "npm:remark-parse";
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
  const result = await unified()
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
        // By default the `link` handler will escape `&` in URLs. There does
        // not appear to be a way to remove the `&` unsafe entry from the
        // `unsafe` config this plugin accepts. So instead, this tries to mimic
        // the default handler but does not apply any escaping.
        link: (node, _parent, _state, _info) => {
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

          const child = node.children[0];
          return `[${child.value}](${node.url})`;
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
  return result.toString();
}

if (import.meta.main) {
  main();
}