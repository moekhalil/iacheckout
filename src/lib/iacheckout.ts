import crypto from "crypto";
import fs from "fs";
import fetch from "node-fetch";
import path from "path";

import { downloadUrl } from "./downloadUrl";
import { parseUrl } from "./parseUrl";
import { Messages } from "./strings";

interface ItemFileMetadata {
  name: string;
  source: string;
  size: string;
  sha1: string;
}

async function iacheckout(url: string, options: Record<string, string>) {
  const { chunkcount } = options;

  const parsedUrl = parseUrl(url);
  const { itemname, filename } = parsedUrl;

  const filepath = path.resolve(".", filename);
  if (fs.existsSync(filepath)) {
    console.log(`${filename} already exists... replacing.`);
    fs.rmSync(filepath);
  }

  const parsedChunkCount = parseInt(chunkcount ?? "200");

  await downloadUrl(parsedUrl, parsedChunkCount, filepath);

  const itemFilesMetadataResponse = await fetch(
    `https://archive.org/metadata/${itemname}/files`
  );

  const itemFilesMetadata: { result: ItemFileMetadata[] } =
    await itemFilesMetadataResponse.json();

  if (!itemFilesMetadata || !itemFilesMetadataResponse.ok) {
    console.error(Messages.ErrorVerificationData);
    process.exit();
  }

  const correctFile = itemFilesMetadata.result.find((f) => f.name === filename);

  if (!correctFile) {
    console.error(Messages.ErrorVerificationData);
    process.exit();
  }

  const metadataHash = correctFile.sha1;

  const fileStream = fs.createReadStream(filepath);
  const fileHash = crypto.createHash("sha1");
  fileStream.on("data", (data) => fileHash.update(data));
  fileStream.on("close", () => {
    const isValidHash = metadataHash === fileHash.digest("hex");
    if (isValidHash) {
      console.log(Messages.VerificationHash);
      console.log(`Saved to ${filepath}.`);
    } else {
      console.error(Messages.ErrorVerificationHash);
    }
    process.exit();
  });
}

export default iacheckout;
