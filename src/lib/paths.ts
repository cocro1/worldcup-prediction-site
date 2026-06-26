import path from "node:path";

export const SHARED_ROOT =
  process.env.FWC_SHARED_ROOT || "D:\\我的坚果云\\fwc2026";

export function sharedPath(...parts: string[]) {
  return path.join(SHARED_ROOT, ...parts);
}
