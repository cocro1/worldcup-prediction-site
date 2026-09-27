// Daily release: sync reviewed content/data from shared warehouse, strip BOM,
// validate statuses, Astro build, write build log, commit & push main.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const WAREHOUSE = "D:\\我的坚果云\\fwc2026";
const SITE = process.cwd();

const dataMappings = [
  ["data/predictions/reviewed", "src/data/predictions/reviewed", "*.json"],
  ["data/deductions/reviewed", "src/data/deductions/reviewed", "*.json"],
  ["data/results/reviewed", "src/data/results/reviewed", "*.json"],
  ["data/mystic/reviewed", "src/data/mystic/reviewed", "*.json"],
  ["data/topics/reviewed", "src/data/topics/reviewed", "*.json"],
];
const contentMappings = [
  ["content/predictions/reviewed", "src/content/predictions/reviewed", "*.md"],
  ["content/deductions/reviewed", "src/content/deductions/reviewed", "*.md"],
  ["content/mystic/reviewed", "src/content/mystic/reviewed", "*.md"],
  ["content/topics/reviewed", "src/content/topics/reviewed", "*.md"],
];
const seedMappings = [
  ["data/matches", "src/data/matches", "*.json"],
  ["data/teams", "src/data/teams", "*.json"],
];

const log = (msg) => console.log(msg);

function copyDir(relSrc, relDest, pattern) {
  const src = path.join(WAREHOUSE, relSrc);
  const dest = path.join(SITE, relDest);
  if (!fs.existsSync(src)) {
    log(`  [WARN] Source missing: ${src}`);
    return 0;
  }
  fs.mkdirSync(dest, { recursive: true });
  const ext = pattern.replace("*", "");
  const files = fs.readdirSync(src).filter((f) => f.endsWith(ext));
  for (const f of files) {
    fs.copyFileSync(path.join(src, f), path.join(dest, f));
  }
  log(`  ${files.length} ${ext} : ${relSrc} -> ${relDest}`);
  return files.length;
}

// --- Phase 1+2: sync ---
log("=== Phase 1: sync reviewed data ===");
const synced = {};
for (const [s, d, p] of dataMappings) synced[s] = copyDir(s, d, p);
log("=== Phase 2: sync reviewed content ===");
for (const [s, d, p] of contentMappings) synced[s] = copyDir(s, d, p);
log("=== Phase 3: sync seed matches/teams ===");
for (const [s, d, p] of seedMappings) synced[`${s} (seed)`] = copyDir(s, d, p);

// --- Phase 4: strip BOM ---
log("=== Phase 4: strip BOM ===");
const mirrorDirs = [
  ...dataMappings.map((m) => m[1]),
  ...contentMappings.map((m) => m[1]),
  ...seedMappings.map((m) => m[1]),
];
let bomStripped = 0;
let bomScanned = 0;
for (const rel of mirrorDirs) {
  const dir = path.join(SITE, rel);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".json") && !f.endsWith(".md")) continue;
    const fp = path.join(dir, f);
    const buf = fs.readFileSync(fp);
    bomScanned++;
    if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
      fs.writeFileSync(fp, buf.subarray(3));
      log(`  BOM removed: ${rel}/${f}`);
      bomStripped++;
    }
  }
}
log(`  BOM scanned=${bomScanned}, stripped=${bomStripped}`);

// --- Phase 5: validate statuses ---
log("=== Phase 5: validate reviewed statuses ===");
let checked = 0;
const bad = [];
const contentTypes = ["predictions", "deductions", "mystic", "topics"];
for (const t of contentTypes) {
  const dir = path.join(SITE, "src/data", t, "reviewed");
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    try {
      const j = JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8"));
      checked++;
      if (j.status !== "reviewed") bad.push(`data/${t}/reviewed/${f} status=${j.status}`);
    } catch (e) {
      bad.push(`data/${t}/reviewed/${f} parse-error ${e.message}`);
    }
  }
}
{
  const dir = path.join(SITE, "src/data/results/reviewed");
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
      try {
        const j = JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8"));
        checked++;
        if (j.status !== "full_time" && j.status !== "result_verified") {
          bad.push(`data/results/reviewed/${f} status=${j.status}`);
        }
      } catch (e) {
        bad.push(`data/results/reviewed/${f} parse-error ${e.message}`);
      }
    }
  }
}
log(`  checked=${checked}, invalid=${bad.length}`);
if (bad.length) {
  log("  INVALID:");
  for (const b of bad.slice(0, 40)) log("   - " + b);
}

// --- Phase 6: build ---
log("=== Phase 6: astro build ===");
const buildStart = Date.now();
const buildRes = spawnSync("npx", ["astro", "build"], {
  cwd: SITE,
  stdio: "inherit",
  shell: process.platform === "win32",
  env: { ...process.env, FWC_DATA_ROOT: path.join(SITE, "src"), ASTRO_TELEMETRY_DISABLED: "1" },
});
const buildSeconds = Math.round(((Date.now() - buildStart) / 1000) * 100) / 100;
const buildOk = buildRes.status === 0;

// --- stats ---
function countFiles(dir, pred) {
  let n = 0;
  const walk = (d) => {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const fp = path.join(d, e.name);
      if (e.isDirectory()) walk(fp);
      else if (pred(e.name)) n++;
    }
  };
  walk(dir);
  return n;
}
const htmlInDist = countFiles(path.join(SITE, "dist"), (n) => n.endsWith(".html"));
const totalMirrored =
  Object.values(synced).reduce((a, b) => a + b, 0);
const astroPkg = JSON.parse(fs.readFileSync(path.join(SITE, "node_modules/astro/package.json"), "utf-8"));

// --- Phase 7: write build log ---
const now = new Date();
const sv = now.toLocaleString("sv-SE", { timeZone: "Asia/Shanghai" }); // YYYY-MM-DD HH:MM:SS
const [dpart, tpart] = sv.split(" ");
const stamp = `${dpart}T${tpart.replace(/:/g, "-")}+08-00`;
const releaseLog = {
  timestamp: `${dpart}T${tpart}+08:00`,
  status: buildOk ? "success" : "failed",
  source: WAREHOUSE,
  site: SITE,
  branch: "main",
  astro_version: astroPkg.version,
  pages_built: htmlInDist,
  build_time_seconds: buildSeconds,
  build_command: "npx astro build",
  output_dir: path.join(SITE, "dist"),
  bom_stripped: bomStripped,
  bom_scanned: bomScanned,
  synced,
  total_files_mirrored: totalMirrored,
  html_files_in_dist: htmlInDist,
  qa_check: `${checked} reviewed JSON checked, ${bad.length} invalid`,
  invalid_files: bad,
  notes:
    "每日全量同步 reviewed 内容/数据（含 seed matches/teams），strip BOM，npx astro build，push main 触发 GitHub Actions。",
  failure_reason: buildOk ? null : `astro build exited ${buildRes.status}`,
};

const logName = `${stamp}.json`;
const writeTargets = [
  path.join(SITE, "releases", "built", logName),
  path.join(WAREHOUSE, "releases", "built", logName),
];
for (const tp of writeTargets) {
  try {
    fs.mkdirSync(path.dirname(tp), { recursive: true });
    fs.writeFileSync(tp, JSON.stringify(releaseLog, null, 2) + "\n", "utf-8");
    log(`  wrote ${tp}`);
  } catch (e) {
    log(`  [WARN] could not write ${tp}: ${e.message}`);
  }
}

// --- Phase 8: git commit & push ---
log("=== Phase 7: git add/commit/push ===");
let gitResult = "skipped";
if (buildOk) {
  const g = (args) => spawnSync("git", args, { cwd: SITE, encoding: "utf-8", shell: false });
  g(["add", "-A"]);
  const st = g(["status", "--porcelain"]);
  if ((st.stdout || "").trim().length === 0) {
    gitResult = "nothing-to-commit";
    log("  no changes to commit");
  } else {
    const cm = g(["commit", "-m", `${dpart === "" ? "每日发布" : "每日发布 " + dpart}`]);
    log("  commit: " + (cm.stdout || cm.stderr || "").trim().split("\n").slice(0, 4).join(" | "));
    const ph = g(["push", "origin", "main"]);
    const pushed = ph.status === 0;
    log("  push status=" + ph.status);
    if (!pushed) log("  push stderr: " + (ph.stderr || "").trim());
    gitResult = pushed ? "pushed" : "push-failed";
    releaseLog.git = { commit_message: `每日发布 ${dpart}`, result: gitResult };
    for (const tp of writeTargets) {
      try { fs.writeFileSync(tp, JSON.stringify(releaseLog, null, 2) + "\n", "utf-8"); } catch {}
    }
  }
} else {
  log("  build failed, skipping commit/push");
}

log("=== SUMMARY ===");
log(JSON.stringify({ status: releaseLog.status, pages: htmlInDist, bomStripped, checked, invalid: bad.length, git: gitResult, logName }, null, 2));
process.exit(buildOk ? 0 : 1);
