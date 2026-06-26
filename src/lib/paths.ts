import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Get the actual file system path of this module
// This works reliably in both local dev and CI
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const PROJECT_DATA_ROOT = path.resolve(__dirname, "..", "data");

// Shared drive root (may not exist on CI or non-Windows)
export const SHARED_ROOT =
  process.env.FWC_SHARED_ROOT || "D:\\我的坚果云\\fwc2026";

/**
 * Resolve a data file path.
 * First tries the project-bundled data directory (src/data/),
 * then falls back to the shared drive.
 */
export function sharedPath(...parts: string[]) {
  const projectPath = path.join(PROJECT_DATA_ROOT, ...parts);
  if (fs.existsSync(projectPath)) {
    return projectPath;
  }
  return path.join(SHARED_ROOT, ...parts);
}
