import { existsSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import path from "path";

export interface ConfigObject {
  email?: string;
  downloadDir: string;
}

export const defaultDownloadDir = "./";

const configPath = path.resolve(homedir(), ".iacheckout.json");

export function setConfigFile(config: ConfigObject) {
  writeFileSync(configPath, JSON.stringify(config));
}

export function readConfigFile(): ConfigObject {
  if (!existsSync(configPath)) {
    setConfigFile({ downloadDir: defaultDownloadDir });
    console.log(`Created config file at ${configPath}.`);
  }
  const configString = readFileSync(configPath, "utf-8");
  return JSON.parse(configString) as ConfigObject;
}
