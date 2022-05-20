import { Messages } from "../strings";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import cliProgress from "cli-progress";
import Progress from "node-fetch-progress";
import crypto from "crypto";

function bToRoundedMB(b: number) {
  return Math.round((b / 1e6) * 100) / 100;
}

function bToRoundedMb(b: number) {
  return Math.round((b / 125000) * 100) / 100;
}

function secondsToTimeString(seconds: number) {
  return new Date(seconds * 1000).toISOString().substring(11, 19);
}

interface ProgressValue {
  total: number;
  done: number;
  eta: number;
  rate: number;
}

interface ItemFileMetadata {
  name: string;
  source: string;
  size: string;
  sha1: string;
}

async function iacheckout(url: string, options: Record<string, string>) {
  const { chunkcount } = options;

  if (!url) {
    console.error(Messages.ErrorValidUrl);
    process.exit();
  }
  let urlObj: URL | undefined;

  try {
    urlObj = new URL(url);
  } catch (err) {
    console.error(Messages.ErrorValidUrl);
    process.exit();
  }

  if (!urlObj) {
    console.error(Messages.ErrorValidUrl);
    process.exit();
  }

  if (urlObj.hostname !== "archive.org") {
    console.error(Messages.ErrorValidUrl);
    process.exit();
  }

  const paths = urlObj.pathname.split("/");
  const itemname = decodeURI(paths[paths.length - 2]);
  const filename = decodeURI(paths[paths.length - 1]);

  const fileExtensionRegex = /\.[0-9a-z]+$/i;
  const extMatch = filename.match(fileExtensionRegex);

  if (!extMatch) {
    console.error(Messages.ErrorValidUrl);
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
  const parsedChunkCount = parseInt(chunkcount);

  let lastByte = -1;
  const rangeValues: string[] = [];
  if (parsedChunkCount > 1) {
    for (let i = 0; i < parsedChunkCount - 1; i++) {
      const chunkLength = Math.floor(length / (parsedChunkCount - 1));
      const nextTopByte = lastByte + chunkLength;
      rangeValues.push(`bytes=${lastByte + 1}-${nextTopByte}`);
      lastByte = nextTopByte;
    }
    rangeValues.push(
      `bytes=${lastByte + 1}-${lastByte + (length % (parsedChunkCount - 1))}`
    );
  } else {
    rangeValues.push(`bytes=0-${length}`);
  }

  console.log(
    `Downloading ${filename} (${bToRoundedMB(
      length
    )} MB) in ${parsedChunkCount} chunk${parsedChunkCount !== 1 ? "s" : ""}...`
  );

  const progressBar = new cliProgress.SingleBar(
    {
      format: "[{bar}] {percentage}% | ETA: {maxEta} | {rate} Mbps",
      fps: 5,
      hideCursor: true,
    },
    cliProgress.Presets.shades_classic
  );

  progressBar.start(bToRoundedMB(length), 0, {
    maxEta: "∞",
    rate: 0,
  });

  const chunkResponses = rangeValues.map((range) =>
    fetch(url, { headers: { range } })
  );
  const progressValues: ProgressValue[] = [];

  try {
    await (
      await Promise.all(chunkResponses)
    ).map((res, i) =>
      new Progress(res, { throttle: 500 }).on("progress", (p) => {
        progressValues[i] = {
          total: p.total,
          done: p.done,
          eta: p.eta,
          rate: p.rate,
        };
        const totalProgress = progressValues.reduce(
          (prev, current) => prev + current.done,
          0
        );
        const totalRate = progressValues
          .filter((pv) => pv.done !== pv.total)
          .reduce((prev, current) => prev + current.rate, 0);
        const maxEta = Math.round(
          Math.max(...progressValues.map((v) => v.eta))
        );
        progressBar.update(bToRoundedMB(totalProgress), {
          maxEta: secondsToTimeString(maxEta),
          rate: bToRoundedMb(totalRate),
        });
      })
    );

    const chunkPromises = await (
      await Promise.all(chunkResponses)
    ).map((res) => res.arrayBuffer());
    const buffers = await Promise.all(chunkPromises);
    progressBar.stop();
    buffers.forEach((buf) => fs.appendFileSync(filepath, Buffer.from(buf)));
    console.log(Messages.DownloadComplete);
  } catch (err) {
    progressBar.stop();
    console.error("Download failed for unknown reason. Please try again.");
    process.exit();
  }

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
