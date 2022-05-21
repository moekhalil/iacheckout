import { Messages } from "./strings";

export type ParsedUrl = {
  url: string;
  itemname: string;
  filename: string;
};

function parseUrl(url: string): ParsedUrl {
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

  return {
    url,
    itemname,
    filename,
  };
}

export { parseUrl };
