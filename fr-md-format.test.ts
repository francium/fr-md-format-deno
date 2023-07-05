import { format } from "./fr-md-format.ts";
import { assertEquals } from "https://deno.land/std@0.191.0/testing/asserts.ts";

interface TestCase {
  label: string;
  input: string;
  expected: string;
}

const testCases: TestCase[] = [
  {
    label: "empty file",
    input: ``,
    expected: ``,
  },
  {
    label: "empty file with new line ending",
    input: `\n`,
    expected: ``,
  },

  {
    label: "spacing between things",
    input: `
# Heading
Line of text.
- A list
  - Nested list
    \`\`\`somelanguage
    nested code block
    \`\`\`
# Second Heading
## Sub Heading
Another line of text
`,
    expected: `\
# Heading

Line of text.

- A list
  - Nested list
    \`\`\`somelanguage
    nested code block
    \`\`\`


# Second Heading


## Sub Heading

Another line of text
`,
  },

  {
    label: "urls don't get escaped",
    input: `https://example.com/api?param=value&foo=bar_buzz`,
    expected: `https://example.com/api?param=value&foo=bar_buzz\n`,
  },
  {
    label: "urls in a list don't get escaped",
    input: `- https://example.com/api?param=value&foo=bar`,
    expected: `- https://example.com/api?param=value&foo=bar\n`,
  },

  {
    label: "email does not get prefixed with a 'mailto:' prefix",
    input: `- bob@example.com`,
    expected: `- bob@example.com\n`,
  },
  {
    label: "explicitly included 'mailto:' prefix does not get removed",
    input: `- mailto:bob@example.com`,
    expected: `- mailto:bob@example.com\n`,
  },

  {
    label: "square brackets get escaped when it's not a link",
    input: `
- [something]
- [foo][bar]
`,
    expected: `\
- \\[something]
- \\[foo]\\[bar]
`,
  },
  {
    label: "square brackets do not get escaped when it's a link",
    input: `
- [something](example.com)
- [foo][bar]

[bar]: example.com/bar
`,
    expected: `\
- [something](example.com)
- [foo][bar]

[bar]: example.com/bar
`,
  },

  {
    label: "indeterminate checkboxes",
    input: `
- [ ] foo
- [-] bar
  - [-] bar 2
  - [x] bar 3
- [x] qux
`,
    expected: `\
- [ ] foo
- [-] bar
  - [-] bar 2
  - [x] bar 3
- [x] qux
`,
  },

  {
    label: "code in headings",
    input: "# The quick `brown`/`fox` jumps over `the` lazy dog\n",
    expected: "# The quick `brown`/`fox` jumps over `the` lazy dog\n",
  },

  {
    label: "code in links",
    input: "[the `quick` brown `fox`](https://example.com)\n",
    expected: "[the `quick` brown `fox`](https://example.com)\n",
  }
];

testCases.forEach(({label, input, expected}) => {
  Deno.test(label, async () => {
    const output = await format(input);
    assertEquals(output, expected);
  });
});
