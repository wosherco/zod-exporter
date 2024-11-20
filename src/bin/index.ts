import { Command } from "commander";
import * as path from "path";
import fs from "fs/promises";
import chokidar from "chokidar";
import { createJiti } from "jiti";
import { spawn } from "child_process";
import { LIB_VERSION } from "../version";
import { exportZodSchema } from "../extractor";

const program = new Command();
const jiti = createJiti(import.meta.url, {
  fsCache: false,
  moduleCache: false,
});

program
  .version(LIB_VERSION)
  .requiredOption(
    "-i, --input <path>",
    "input of the file containing the TRPC router"
  )
  .option(
    "-o, --output <path>",
    "output of the TRPC routes json. If empty will print to stdout (useful to pipe to other commands)"
  )
  .option(
    "-s, --schema [name]",
    "name of the exported schema variable. Leave empty for default export",
    "default"
  )
  .option(
    "-w, --watch [directory]",
    "watch for changes on a directory and updates the output. Leave empty to watch the input file"
  )
  .option(
    "-x, --exec <command>",
    "command to execute after each successful output"
  );

program.parse(process.argv);

const options = program.opts<{
  output?: string;
  input: string;
  schema: string;
  watch?: string | boolean;
  exec?: string;
}>();

async function executeCommand(input: string) {
  if (!options.exec) return;

  return new Promise<void>((resolve, reject) => {
    const child = spawn(options.exec!, [], {
      shell: true,
      stdio: ["pipe", "inherit", "inherit"],
    });

    child.stdin.write(input);
    child.stdin.end();

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on("error", (err) => {
      reject(err);
    });
  });
}

async function processRouter() {
  const importedFile: any = await jiti.import(path.resolve(options.input));
  const schema = importedFile[options.schema];
  const extractedSchema = exportZodSchema(schema);
  const stringifiedSchema = JSON.stringify(extractedSchema, null, 2);

  if (options.output === undefined && !options.exec) {
    process.stdout.write(stringifiedSchema + "\n");
  } else if (options.output) {
    await fs.writeFile(options.output, stringifiedSchema);
    process.stderr.write(`Extracted routes saved to ${options.output}\n`);
  }

  try {
    await executeCommand(stringifiedSchema);
  } catch (error) {
    process.stderr.write(`Error executing command: ${error}\n`);
  }
}

async function main() {
  await processRouter();

  if (options.watch !== undefined) {
    const watchPath =
      typeof options.watch === "string"
        ? path.resolve(options.watch)
        : path.resolve(options.input);

    const watcher = chokidar.watch(watchPath, {
      persistent: true,
      ignoreInitial: false,
      usePolling: true,
      interval: 100,
      awaitWriteFinish: true,
    });

    watcher.on("change", async (path) => {
      process.stderr.write(`File ${path} has been changed. Processing...\n`);
      const startTime = Date.now();
      await processRouter();
      const endTime = Date.now();
      const timeTaken = endTime - startTime;
      process.stderr.write(`Update completed in ${timeTaken} ms.\n`);
      process.stderr.write(
        `Watching for changes in ${watchPath} and its dependencies...\n`
      );
    });

    watcher.on("error", (error) => {
      process.stderr.write(`Watcher error: ${error}\n`);
    });

    process.stderr.write(
      `Watching for changes in ${watchPath} and its dependencies...\n`
    );
  }
}

main();
