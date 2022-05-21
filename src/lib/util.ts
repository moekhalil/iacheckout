export function bToRoundedMB(b: number) {
  return Math.round((b / 1e6) * 100) / 100;
}

export function bToRoundedMb(b: number) {
  return Math.round((b / 125000) * 100) / 100;
}

export function secondsToTimeString(seconds: number) {
  return new Date(seconds * 1000).toISOString().substring(11, 19);
}
