# fr-md-format

A custom markdown formatter that formats markdown according to my preferences.
Written as a standalone script in Deno.


## Installation

Make sure you have [Deno][deno-url] installed and copy `fr-md-format.ts` to
somewhere in your `$PATH`.

[deno-url]: https://deno.com/runtime


## Usage

```txt
$ fr-md-format.ts <markdown file>
```

Note due to how Deno works, the `.ts` extension must be present on the file for
Deno to work.


## Development

See [deno.jsonc](./deno.jsonc) for defined tasks and run with,

```
deno task <task name>
```
