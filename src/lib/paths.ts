import fs from "node:fs";
import path from "node:path";

// In CI/Publisher builds, point FWC_DATA_ROOT at the root that contains
// both data/ and content/. For the mirrored site files, use $(pwd)/src.
// For local development, the default remains the shared fwc2026 root.
export const PROJECT_DATA_ROOT =
  process.env.FWC_DATA_ROOT ||
  process.env.FWC_SHARED_ROOT ||
  "D:\\我的坚果云\\fwc2026";

export const SHARED_ROOT = PROJECT_DATA_ROOT;

/**
 * Resolve a data file path.
 */
export function sharedPath(...parts: string[]) {
  return path.join(PROJECT_DATA_ROOT, ...parts);
}
