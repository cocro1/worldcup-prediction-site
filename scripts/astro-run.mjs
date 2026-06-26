import { spawnSync } from "node:child_process";
import path from "node:path";

const astroBin = path.join(
  process.cwd(),
  "node_modules",
  ".bin",
  process.platform === "win32" ? "astro.cmd" : "astro",
);

const result = spawnSync(astroBin, process.argv.slice(2), {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: {
    ...process.env,
    ASTRO_TELEMETRY_DISABLED: "1",
  },
});

process.exit(result.status ?? 1);
