import fs, { PathLike } from "fs";
import path from "path";

import { downloadUrl } from "./downloadUrl";
import { parseUrl } from "./parseUrl";
import { verifyDownload } from "./verifyDownload";

export function endProgram(filepath: PathLike) {
  console.log(`Saved to ${filepath}.`);
  process.exit();
}

async function iacheckout(url: string, options: Record<string, string>) {
  const { chunkcount, skipVerification } = options;

  const shouldSkipVerification = Boolean(skipVerification);
  const parsedUrl = parseUrl(url);
  const { filename } = parsedUrl;

  const filepath = path.resolve(".", filename);
  if (fs.existsSync(filepath)) {
    console.log(`${filename} already exists... replacing.`);
    fs.rmSync(filepath);
  }

  const parsedChunkCount = parseInt(chunkcount ?? "200");
  await downloadUrl(parsedUrl, parsedChunkCount, filepath);

  if (!shouldSkipVerification) {
    await verifyDownload(parsedUrl, filepath);
  } else {
    console.log("File verification skipped.");
    endProgram(filepath);
  }
}

export default iacheckout;
