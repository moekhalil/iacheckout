import { Command } from "commander";

import iacheckout from "./lib/iacheckout";

function main() {
  const program = new Command();

  program
    .name("iacheckout")
    .description("Download archive.org files from the terminal")
    .argument("<url>", "Valid archive.org download URL")
    .option(
      "-c, --chunkcount <number>",
      "Number of concurrent downloads that the file is split into",
      "200"
    )
    .option(
      "-sv, --skip-verification",
      "Skip hash verification against archive.org metadata",
      false
    )
    .action((url, options) => {
      iacheckout(url, options);
    });

  program.parse();
}

main();
