# iacheckout

Download single [archive.org](https://archive.org) files fast from your terminal. Splits downloads into multiple (configurable) parts to speed things up significantly. Verifies the hash of the file when complete, against the metadata provided by archive.org.

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

The downloaded file will be saved in your current directory by default.

If you want to download to another directory, or want to allow `iacheckout` to download files from archive.org that require authentication, run:

```console
iacheckout configure
```

`iacheckout` stores your archive.org password in your system's keychain. On requests, it will query for your S3 access keys for archive.org to download authentication-required files.

## Help command

```console
Usage: iacheckout [options] [command] <url>

Download archive.org files from the terminal

Arguments:
  url                              Valid archive.org download URL

Options:
  -chunks, --chunk-count <number>  Number of concurrent downloads that the file is split into (default: "200")
  -skip, --skip-verification       Skip hash verification against archive.org metadata (default: false)
  -h, --help                       display help for command

Commands:
  configure                        Configure authentication and directories
```

## Coming soon

I'm looking into the best way to allow downloading multiple files simultaneously. It will probably be via a list file so you don't have to paste a million URLs into the terminal.
