import inquirer from "inquirer";
import { setPassword } from "keytar";
import { homedir } from "os";
import path from "path";

import { setConfigFile, readConfigFile, ConfigObject } from "./lib/configFile";

async function setAuth(config: ConfigObject) {
  const questions = [
    {
      type: "input",
      name: "email",
      message: "archive.org email: ",
    },
    {
      type: "password",
      mask: true,
      name: "password",
      message: "archive.org password: ",
    },
  ];
  const answers = await inquirer.prompt(questions);
  const { email, password } = answers;
  setConfigFile({ ...config, email });
  await setPassword("iacheckout", email, password);
  console.log("Configuration updated!");
}

async function setCustomDownloadDir(config: ConfigObject) {
  const question = {
    type: "input",
    name: "enteredPath",
    message: "Download path: ",
  };
  const answers = await inquirer.prompt([question]);
  const { enteredPath } = answers;
  let expandedPath = enteredPath;
  if (enteredPath[0] === "~") {
    expandedPath = path.join(homedir(), enteredPath.slice(1));
  }
  setConfigFile({ ...config, downloadDir: expandedPath });
  console.log("Configuration updated!");
}

async function setDownloadDir(config: ConfigObject) {
  const questions = [
    {
      type: "list",
      name: "intent",
      message: "Where do you want iacheckout to download to?",
      choices: [
        {
          name: "Always download to terminal's current directory",
          value: "./",
        },
        {
          name: "Enter a download directory path",
          value: "custom",
        },
      ],
    },
  ];
  const answers = await inquirer.prompt(questions);
  const { intent } = answers;
  if (intent === "custom") {
    setCustomDownloadDir(config);
  } else {
    setConfigFile({ ...config, downloadDir: "./" });
    console.log("Configuration updated!");
  }
}

function configure() {
  const config = readConfigFile();
  const initialQuestion = {
    type: "list",
    name: "intent",
    message: "What do you want to configure?",
    choices: [
      {
        name: "Authenticate iacheckout (set email/password)",
        value: "setAuth",
      },
      {
        name: `Set default download directory (currently ${config.downloadDir})`,
        value: "setDownloadDir",
      },
    ],
  };
  inquirer.prompt([initialQuestion]).then((answer) => {
    const { intent } = answer;
    if (intent === "setAuth") {
      setAuth(config);
    } else if (intent === "setDownloadDir") {
      setDownloadDir(config);
    } else {
      console.error("Something went wrong, please try again.");
    }
  });
}

configure();
