import { getPassword } from "keytar";
import fetch from "node-fetch";

import { readConfigFile } from "./configFile";

export interface S3AuthObject {
  access: string;
  secret: string;
}

export async function getAuth(): Promise<S3AuthObject | null> {
  const { email } = readConfigFile();
  if (!email) {
    // auth not required
    return null;
  }
  const archiveOrgPassword = await getPassword("iacheckout", email);
  if (!archiveOrgPassword) {
    console.error(
      "No archive.org credentials found. Please run 'iacheckout configure'."
    );
  }

  const authUrl = "https://archive.org/services/xauthn?op=login";

  const authResponse = await fetch(authUrl, {
    method: "POST",
    body: JSON.stringify({ email, password: archiveOrgPassword }),
  });

  if (!authResponse.ok) {
    console.error(
      'Unable to retrieve archive.org authentication data. Check your email and password in "iacheckout configure" and try again.'
    );
    return null;
  }

  const authObject = await authResponse.json();
  return authObject.values.s3;
}
