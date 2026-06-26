import fs from "node:fs";
import path from "node:path";

const SHARED_ROOT = "D:\\我的坚果云\\fwc2026";
const HIT_RATE_START_DATE = "2026-06-24";
const OVER_2_5_THRESHOLD = 0.65;

function sharedPath(...parts) {
  return path.join(SHARED_ROOT, ...parts);
}

function readJsonFile(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return fallback;
  }
}

function readJsonDir(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .flatMap((name) => {
      try {
        const item = JSON.parse(fs.readFileSync(path.join(dirPath, name), "utf-8"));
        return [item];
      } catch {
        return [];
      }
    });
}

// Load data
const matches = readJsonFile(sharedPath("data", "matches", "matches.seed.json"), [])
  .sort((a, b) => {
    const time = a.kickoff_beijing.localeCompare(b.kickoff_beijing);
    return time || a.match_no - b.match_no;
  });

const predictions = readJsonDir(sharedPath("data", "predictions", "reviewed"))
  .filter((item) => item.status === "reviewed");

const deductions = readJsonDir(sharedPath("data", "deductions", "reviewed"))
  .filter((item) => item.status === "reviewed");

const aggregate = readJsonFile(sharedPath("data", "results", "results.json"), []);
const aggregateResults = Array.isArray(aggregate) ? aggregate : Array.isArray(aggregate.results) ? aggregate.results : [];
const reviewedResults = readJsonDir(sharedPath("data", "results", "reviewed"));

const resultsByMatch = new Map();
for (const result of [...aggregateResults, ...reviewedResults]) {
  if (
    result?.match_id &&
    (result.status === "full_time" || result.status === "result_verified") &&
    Number.isInteger(result.home_score_90) &&
    Number.isInteger(result.away_score_90)
  ) {
    resultsByMatch.set(result.match_id, result);
  }
}

const predictionsByMatch = new Map(predictions.map((item) => [item.match_id, item]));

const deductionsByMatch = new Map();
for (const report of deductions) {
  for (const match of report.matches || []) {
    deductionsByMatch.set(match.match_id, match);
  }
}

function normalizeScore(score) {
  return (score || "").trim().replace(/\s+/g, "").replace(":", "-");
}

function resultScore(result) {
  return `${result.home_score_90}-${result.away_score_90}`;
}

function resultTotalGoals(result) {
  return typeof result.total_goals_90 === "number"
    ? result.total_goals_90
    : result.home_score_90 + result.away_score_90;
}

function normalizeProbability(probability) {
  if (typeof probability !== "number" || Number.isNaN(probability)) return null;
  return probability > 1 ? probability / 100 : probability;
}

function scoreHit(candidates, result) {
  const actual = resultScore(result);
  return candidates.some((score) => normalizeScore(score) === actual);
}

// Filter matches from 2026-06-24 onwards
const filteredMatches = matches.filter((m) => m.kickoff_beijing_date >= HIT_RATE_START_DATE);

let predictionHit = 0;
let predictionTotal = 0;
let deductionHit = 0;
let deductionTotal = 0;
let over25Hit = 0;
let over25Total = 0;

console.log("=".repeat(80));
console.log("世界杯命中率分析 (统计起始日期: 2026-06-24)");
console.log("=".repeat(80));
console.log();

for (const match of filteredMatches) {
  const result = resultsByMatch.get(match.match_id);
  if (!result) continue;

  const date = match.kickoff_beijing_date;
  const home = match.home_team.display_name_zh || match.home_team.name_zh;
  const away = match.away_team.display_name_zh || match.away_team.name_zh;
  const actualScore = resultScore(result);
  const totalGoals = resultTotalGoals(result);

  console.log(`📅 ${date}  ${home} vs ${away}`);
  console.log(`   实际比分: ${actualScore} (总进球: ${totalGoals})`);

  // Prediction
  const prediction = predictionsByMatch.get(match.match_id);
  let predStatus = "无预测";
  if (prediction) {
    predictionTotal += 1;
    const hit = scoreHit([prediction.prediction_score, prediction.backup_score], result);
    if (hit) {
      predictionHit += 1;
      predStatus = `✅ 命中 (${prediction.prediction_score} / ${prediction.backup_score})`;
    } else {
      predStatus = `❌ 未命中 (${prediction.prediction_score} / ${prediction.backup_score})`;
    }
  }
  console.log(`   预测: ${predStatus}`);

  // Deduction
  const deduction = deductionsByMatch.get(match.match_id);
  let dedStatus = "无推演";
  if (deduction?.deduction_scores?.length) {
    deductionTotal += 1;
    const hit = scoreHit(deduction.deduction_scores, result);
    if (hit) {
      deductionHit += 1;
      dedStatus = `✅ 命中 (${deduction.deduction_scores.join(" / ")})`;
    } else {
      dedStatus = `❌ 未命中 (${deduction.deduction_scores.join(" / ")})`;
    }
  }
  console.log(`   推演: ${dedStatus}`);

  // Over 2.5
  const over25Probability = normalizeProbability(deduction?.over_2_5_probability);
  let over25Status = "无大球概率";
  if (over25Probability !== null && over25Probability >= OVER_2_5_THRESHOLD) {
    over25Total += 1;
    const hit = totalGoals >= 3;
    if (hit) {
      over25Hit += 1;
      over25Status = `✅ 大球命中 (概率 ${(over25Probability * 100).toFixed(1)}%, 实际 ${totalGoals} 球)`;
    } else {
      over25Status = `❌ 大球未命中 (概率 ${(over25Probability * 100).toFixed(1)}%, 实际 ${totalGoals} 球)`;
    }
  } else if (over25Probability !== null) {
    over25Status = `— 未触发 (概率 ${(over25Probability * 100).toFixed(1)}% < 65%)`;
  }
  console.log(`   大球: ${over25Status}`);
  console.log();
}

console.log("=".repeat(80));
console.log("📊 最终统计");
console.log("=".repeat(80));

function formatRate(hit, total) {
  const value = total > 0 ? hit / total : 0;
  return `${Math.round(value * 100)}% (${hit}/${total})`;
}

console.log(`预测命中率: ${formatRate(predictionHit, predictionTotal)}`);
console.log(`推演命中率: ${formatRate(deductionHit, deductionTotal)}`);
console.log(`大球命中率: ${formatRate(over25Hit, over25Total)}`);
console.log("=".repeat(80));
