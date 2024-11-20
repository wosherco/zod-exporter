# Zod Exporter

Export zod types from a zod schema, and convert them to json schemas from the CLI. From there, you can use other projects, like [quicktype](https://github.com/glideapps/quicktype), to convert to other languages.

## Usage

You don't need to install this package, just run the following command:

On npm:

```bash
(npx | pnpx | bunx) zod-exporter -i <path-to-schema>
```

Help command:

```
Options:
  -V, --version            output the version number
  -i, --input <path>       input of the file containing the TRPC router
  -o, --output <path>      output of the TRPC routes json. If empty will print to stdout (useful to pipe to other commands)
  -s, --schema [name]      name of the exported schema variable. Leave empty for default export (default: "default")
  -w, --watch [directory]  watch for changes on a directory and updates the output. Leave empty to watch the input file
  -x, --exec <command>     command to execute after each successful output
  -h, --help               display help for command
```

## Example with quicktype

```bash
bunx zod-exporter -i ./test/schema.ts -w -x "bunx quicktype --src-lang schema --out test.py"
```
