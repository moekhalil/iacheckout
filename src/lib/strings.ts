export enum Messages {
  ErrorValidUrl = "Please provide a valid archive.org download URL.",
  DownloadComplete = "Download complete. Verifying file integrity...",
  ErrorVerificationData = "Unable to download verification data. Skipping verification.",
  ErrorVerificationHash = "Unable to verify downloaded file, hashes do not match!",
  VerificationHash = "Downloaded file integrity verified.",
}
