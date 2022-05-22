import fs, { PathLike } from "fs";
import path from "path";

import { ConfigObject } from "./lib/configFile";
import { downloadUrl } from "./lib/downloadUrl";
import { parseUrl } from "./lib/parseUrl";
import { verifyDownload } from "./lib/verifyDownload";

export function endProgram(filepath: PathLike) {
  console.log(`Saved to ${filepath}.`);
  process.exit();
}

async function iacheckout(
  url: string,
  options: Record<string, string>,
  config: ConfigObject
) {
  const { chunkCount, skipVerification } = options;

  const shouldSkipVerification = Boolean(skipVerification);
  const parsedUrl = parseUrl(url);
  const { filename } = parsedUrl;
  const { downloadDir } = config;

  const filepath = path.join(downloadDir, filename);
  if (fs.existsSync(filepath)) {
    console.log(`${filename} already exists... replacing.`);
    fs.rmSync(filepath);
  }

  const parsedChunkCount = parseInt(chunkCount ?? "200");
  await downloadUrl(parsedUrl, parsedChunkCount, filepath);

  if (!shouldSkipVerification) {
    await verifyDownload(parsedUrl, filepath);
  } else {
    console.log("File verification skipped.");
    endProgram(filepath);
  }
}

export default iacheckout;
