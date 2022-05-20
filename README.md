# iacheckout

Download single [archive.org](https://archive.org) files fast from your terminal. Splits downloads into multiple (configurable) parts to speed things up significantly.

## Installation

You can simply run iacheckout with npx, as long as you have Node.js installed.

```console
$ npx iacheckout [options] <url>
```

Or, install globally with

```console
$ npm install -g iacheckout
```

And then run

```console
$ iacheckout [options] <url>
```

## Usage

```console
Usage: iacheckout [options] <url>

Download archive.org files from the terminal

Arguments:
  url                        Valid archive.org download URL

Options:
  -c, --chunkcount <number>  Number of concurrent downloads that the file is split into (default: "200")
  -h, --help                 display help for command
```

## Coming soon

Right now, iacheckout doesn't support downloading files that require logging into archive.org. This will be added in a future update.

I'm also looking into the best way to set it up to download multiple files simulataneously. It will probably be via a list file so you don't have to paste a million URLs into the terminal.
