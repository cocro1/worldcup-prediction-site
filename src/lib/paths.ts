import fs from "node:fs";
import path from "node:path";

// In the workflow, we export FWC_DATA_ROOT=$(pwd)/src/data
// This is the most reliable way to find the data on CI
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
