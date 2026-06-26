import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Project-relative data directory (always available, even on CI)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PROJECT_DATA_ROOT = path.resolve(__dirname, "..", "data");

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
