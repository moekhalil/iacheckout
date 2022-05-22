import { Command } from "commander";

import { configure } from "./configure";
import iacheckout from "./iacheckout";
import { readConfigFile } from "./lib/configFile";

async function main() {
  const program = new Command();
  const config = readConfigFile();

  program
    .command("configure")
    .description("Configure authentication and directories")
    .action(() => configure());

  program
    .name("iacheckout")
    .description("Download archive.org files from the terminal")
    .argument("<url>", "Valid archive.org download URL")
    .option(
      "-chunks, --chunk-count <number>",
      "Number of concurrent downloads that the file is split into",
      "200"
    )
    .option(
      "-skip, --skip-verification",
      "Skip hash verification against archive.org metadata",
      false
    )
    .action((url, options) => {
      iacheckout(url, options, config);
    });

  program.parse();
}

main();
