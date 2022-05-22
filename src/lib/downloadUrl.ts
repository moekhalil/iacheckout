import cliProgress from "cli-progress";
import fs, { PathLike } from "fs";
import fetch from "node-fetch";
import Progress from "node-fetch-progress";

import { getAuth } from "./getAuth";
import { ParsedUrl } from "./parseUrl";
import { bToRoundedMB, secondsToTimeString, bToRoundedMb } from "./util";

interface ProgressValue {
  total: number;
  done: number;
  eta: number;
  rate: number;
}

async function downloadUrl(
  parsedUrl: ParsedUrl,
  chunkCount: number,
  filepath: PathLike
) {
  const { url, filename } = parsedUrl;
  const auth = await getAuth();
  const authHeader = auth ? `LOW ${auth.access}:${auth.secret}` : "";

  const initialResponse = await fetch(url, {
    headers: { authorization: authHeader },
  });

  if (!initialResponse.ok) {
    console.error(`Unable to download ${filename}.`);
    process.exit();
  }

  const lengthHeader = initialResponse.headers.get("content-length");
  const length = lengthHeader ? parseInt(lengthHeader) : 0;

  let lastByte = -1;
  const rangeValues: string[] = [];
  if (chunkCount > 1) {
    for (let i = 0; i < chunkCount - 1; i++) {
      const chunkLength = Math.floor(length / (chunkCount - 1));
      const nextTopByte = lastByte + chunkLength;
      rangeValues.push(`bytes=${lastByte + 1}-${nextTopByte}`);
      lastByte = nextTopByte;
    }
    rangeValues.push(
      `bytes=${lastByte + 1}-${lastByte + (length % (chunkCount - 1))}`
    );
  } else {
    rangeValues.push(`bytes=0-${length}`);
  }

  console.log(
    `Downloading ${filename} (${bToRoundedMB(
      length
    )} MB) in ${chunkCount} chunk${chunkCount !== 1 ? "s" : ""}...`
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

  const chunkResponsePromises = rangeValues.map((range) =>
    fetch(url, { headers: { range, authorization: authHeader } })
  );
  const progressValues: ProgressValue[] = [];

  try {
    const chunkResponses = await Promise.all(chunkResponsePromises);
    chunkResponses.forEach((res, i) =>
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
          Math.max(
            ...progressValues
              .map((v) => v.eta)
              .filter((v) => typeof v === "number")
          )
        );
        progressBar.update(bToRoundedMB(totalProgress), {
          maxEta: secondsToTimeString(maxEta),
          rate: bToRoundedMb(totalRate),
        });
      })
    );

    const chunkPromises = chunkResponses.map((res) => res.arrayBuffer());
    const buffers = await Promise.all(chunkPromises);
    progressBar.stop();
    buffers.forEach((buf) => fs.appendFileSync(filepath, Buffer.from(buf)));
  } catch (err) {
    progressBar.stop();
    console.error("Download failed for unknown reason. Please try again.");
    process.exit();
  }
}

export { downloadUrl };
