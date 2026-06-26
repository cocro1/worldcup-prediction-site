import fs from "node:fs";
import path from "node:path";

// During Astro build, process.cwd() is the project root directory
// This is reliable across all environments (Windows, Linux, CI)
const PROJECT_ROOT = process.cwd();
export const PROJECT_DATA_ROOT = path.resolve(PROJECT_ROOT, "src", "data");

// Shared drive root (may not exist on CI)
export const SHARED_ROOT =
  process.env.FWC_SHARED_ROOT || "D:\\我的坚果云\\fwc2026";

/**
 * Resolve a data file path.
 * First tries the project-bundled data directory,
 * then falls back to the shared drive.
 */
export function sharedPath(...parts: string[]) {
  const projectPath = path.join(PROJECT_DATA_ROOT, ...parts);
  if (fs.existsSync(projectPath)) {
    return projectPath;
  }
  return path.join(SHARED_ROOT, ...parts);
}
