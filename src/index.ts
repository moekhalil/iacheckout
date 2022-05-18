import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import cliProgress from "cli-progress";
import Progress from "node-fetch-progress";
import crypto from "crypto";

function bToRoundedMB(b: number) {
  return Math.round((b / 1e6) * 100) / 100;
}

interface ProgressValue {
  done: number;
  eta: number;
  complete: boolean;
}

interface ItemFileMetadata {
  name: string;
  source: string;
  size: string;
  sha1: string;
}

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error("Please provide a URL.");
    process.exit();
  }
  let urlObj: URL | undefined;

  try {
    urlObj = new URL(url);
  } catch (err) {
    console.error("Please enter a valid URL.");
    process.exit();
  }

  if (!urlObj) {
    console.error("Please enter a valid URL.");
    process.exit();
  }

  if (urlObj.hostname !== "archive.org") {
    console.error("Please provide a valid archive.org URL.");
    process.exit();
  }

  const paths = urlObj.pathname.split("/");
  const itemname = decodeURI(paths[paths.length - 2]);
  const filename = decodeURI(paths[paths.length - 1]);

  const fileExtensionRegex = /\.[0-9a-z]+$/i;
  const extMatch = filename.match(fileExtensionRegex);

  if (!extMatch) {
    console.error("Please provide a valid archive.org file URL.");
    process.exit();
  }

  const filepath = path.resolve(".", filename);
  if (fs.existsSync(filepath)) {
    console.log(`${filename} already exists... replacing.`);
    fs.rmSync(filepath);
  }

  const initialResponse = await fetch(url);

  if (!initialResponse.ok) {
    console.error(`Unable to download ${filename}.`);
    process.exit();
  }

  const lengthHeader = initialResponse.headers.get("content-length");
  const length = lengthHeader ? parseInt(lengthHeader) : 0;
  const chunkCount = 200;

  let lastByte = -1;
  const rangeValues: string[] = [];
  for (let i = 0; i < chunkCount - 1; i++) {
    const chunkLength = Math.floor(length / (chunkCount - 1));
    const nextTopByte = lastByte + chunkLength;
    rangeValues.push(`bytes=${lastByte + 1}-${nextTopByte}`);
    lastByte = nextTopByte;
  }
  rangeValues.push(
    `bytes=${lastByte + 1}-${lastByte + (length % (chunkCount - 1))}`
  );

  console.log(`Downloading ${filename}...`);

  const progressBar = new cliProgress.SingleBar(
    {
      format:
        "[{bar}] {percentage}% | ETA: {maxEta}s | {value} / {total}MB | {completedChunks}/{chunkCount} parts",
      fps: 5,
      hideCursor: true,
    },
    cliProgress.Presets.shades_classic
  );

  progressBar.start(bToRoundedMB(length), 0, {
    maxEta: "N/A",
    chunkCount,
    completedChunks: 0,
  });

  const chunkResponses = rangeValues.map((range) =>
    fetch(url, { headers: { range } })
  );
  const progressValues: ProgressValue[] = [];
  await (
    await Promise.all(chunkResponses)
  ).map((res, i) =>
    new Progress(res, { throttle: 500 }).on("progress", (p) => {
      progressValues[i] = {
        done: p.done,
        complete: p.done === p.total,
        eta: p.eta,
      };
      const total = progressValues.reduce(
        (prev, current) => prev + current.done,
        0
      );
      const maxEta = Math.round(Math.max(...progressValues.map((v) => v.eta)));
      const completedChunks = progressValues.filter((v) => v.complete).length;
      progressBar.update(bToRoundedMB(total), { maxEta, completedChunks });
    })
  );

  const chunkPromises = await (
    await Promise.all(chunkResponses)
  ).map((res) => res.arrayBuffer());
  const buffers = await Promise.all(chunkPromises);
  progressBar.stop();
  buffers.forEach((buf) => fs.appendFileSync(filepath, Buffer.from(buf)));
  console.log("Download complete. Verifying file integrity...");

  const itemFilesMetadataResponse = await fetch(
    `https://archive.org/metadata/${itemname}/files`
  );

  const itemFilesMetadata: { result: ItemFileMetadata[] } =
    await itemFilesMetadataResponse.json();

  if (!itemFilesMetadata || !itemFilesMetadataResponse.ok) {
    console.error(
      "Unable to download verification data. Skipping verification."
    );
    process.exit();
  }

  const correctFile = itemFilesMetadata.result.find((f) => f.name === filename);

  if (!correctFile) {
    console.error(
      "Unable to download verification data. Skipping verification."
    );
    process.exit();
  }

  const metadataHash = correctFile.sha1;

  const fileStream = fs.createReadStream(filepath);
  const fileHash = crypto.createHash("sha1");
  fileStream.on("data", (data) => fileHash.update(data));
  fileStream.on("close", () => {
    const isValidHash = metadataHash === fileHash.digest("hex");
    if (isValidHash) {
      console.log("SHA-1 checksums match! Complete.");
    } else {
      console.error("Unable to verify downloaded file.");
    }
    process.exit();
  });
}

main();
