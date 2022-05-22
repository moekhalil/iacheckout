import crypto from "crypto";
import { PathLike } from "fs";
import fs from "fs";
import fetch from "node-fetch";

import { endProgram } from "../iacheckout";
import { ParsedUrl } from "./parseUrl";
import { Messages } from "./strings";

interface ItemFileMetadata {
  name: string;
  source: string;
  size: string;
  sha1: string;
}

async function verifyDownload(parsedUrl: ParsedUrl, filepath: PathLike) {
  console.log(Messages.Verifying);
  const { itemname, filename } = parsedUrl;
  const itemFilesMetadataResponse = await fetch(
    `https://archive.org/metadata/${itemname}/files`
  );

  const itemFilesMetadata: { result: ItemFileMetadata[] } =
    await itemFilesMetadataResponse.json();

  if (!itemFilesMetadata || !itemFilesMetadataResponse.ok) {
    console.error(Messages.ErrorVerificationData);
    return endProgram(filepath);
  }

  const correctFile = itemFilesMetadata.result.find((f) => f.name === filename);

  if (!correctFile) {
    console.error(Messages.ErrorVerificationData);
    return endProgram(filepath);
  }

  const metadataHash = correctFile.sha1;

  const fileStream = fs.createReadStream(filepath);
  const fileHash = crypto.createHash("sha1");
  fileStream.on("data", (data) => {
    fileHash.update(data);
  });
  fileStream.on("close", () => {
    const isValidHash = metadataHash === fileHash.digest("hex");
    if (isValidHash) {
      console.log(Messages.VerificationHash);
      return endProgram(filepath);
    } else {
      console.error(Messages.ErrorVerificationHash);
      return endProgram(filepath);
    }
  });
}

export { verifyDownload };
