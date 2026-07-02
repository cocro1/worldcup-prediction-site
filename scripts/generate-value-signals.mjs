import fs from "node:fs";
import path from "node:path";

const root = process.env.FWC_DATA_ROOT || path.join(process.cwd(), "src");
const mode = process.argv.includes("--published-research") ? "published_research" : "shadow";
const status = process.argv.includes("--draft") ? "draft" : "reviewed";
const modelVersion = "odds-value-v0.1";
const generatedAt = new Date().toISOString();

function readJson(filePath, fallback) {
  try {
    const text = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function readJsonDir(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .flatMap((name) => {
      const item = readJson(path.join(dirPath, name), null);
      return item ? [{ item, filePath: path.join(dirPath, name) }] : [];
    });
}

function normalizeScore(score) {
  const match = String(score || "").match(/^(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;
  const home = Number(match[1]);
  const away = Number(match[2]);
  if (home > away) return "home";
  if (home < away) return "away";
  return "draw";
}

function normalizeProbability(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(0.01, Math.min(0.99, value));
}

function predictionOutcomeProbabilities(prediction) {
  if (!prediction) return null;
  const main = normalizeScore(prediction.prediction_score);
  const backup = normalizeScore(prediction.backup_score);
  if (!main) return null;

  const base = { home: 0.37, draw: 0.26, away: 0.37 };
  const mainWeightByConfidence = {
    low: 0.22,
    "medium-low": 0.28,
    medium: 0.34,
    "medium-high": 0.42,
    high: 0.50,
  };
  const mainWeight = mainWeightByConfidence[prediction.confidence] ?? 0.32;
  const backupWeight = backup ? 0.16 : 0;
  const baseWeight = Math.max(0.22, 1 - mainWeight - backupWeight);
  const probs = {
    home: base.home * baseWeight,
    draw: base.draw * baseWeight,
    away: base.away * baseWeight,
  };
  probs[main] += mainWeight;
  if (backup) probs[backup] += backupWeight;

  const total = probs.home + probs.draw + probs.away;
  return {
    home: probs.home / total,
    draw: probs.draw / total,
    away: probs.away / total,
  };
}

function marketProbabilities(outcomes) {
  const raw = outcomes.map((outcome) => ({
    ...outcome,
    implied: 1 / outcome.decimal_odds,
  }));
  const total = raw.reduce((sum, outcome) => sum + outcome.implied, 0);
  if (!total) return new Map();
  return new Map(raw.map((outcome) => [outcome.selection, outcome.implied / total]));
}

function signalFor(expectedValue, edge, modelProbability) {
  if (modelProbability < 0.42) {
    if (expectedValue < -0.08 || edge < -0.06) return "avoid";
    return "no_value";
  }
  if (expectedValue >= 0.08 && edge >= 0.04 && modelProbability >= 0.48) return "watch";
  if (expectedValue >= 0.04 && edge >= 0.025) return "thin_value";
  if (expectedValue < -0.08 || edge < -0.06) return "avoid";
  return "no_value";
}

function riskFor(signal, modelProbability, edge) {
  if (signal === "watch" && modelProbability >= 0.55 && edge >= 0.06) return "low";
  if (signal === "avoid" || modelProbability < 0.35) return "high";
  return "medium";
}

function round(value, places = 4) {
  return Number(value.toFixed(places));
}

function slugPart(value) {
  return String(value).replace(/[^a-zA-Z0-9_\-.]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

const matches = readJson(path.join(root, "data", "matches", "matches.seed.json"), []);
const predictions = new Map(readJsonDir(path.join(root, "data", "predictions", "reviewed"))
  .map(({ item }) => [item.match_id, item]));
const deductions = readJsonDir(path.join(root, "data", "deductions", "reviewed"))
  .flatMap(({ item }) => Array.isArray(item.matches) ? item.matches.map((match) => [match.match_id, { report: item, match }]) : []);
const deductionByMatch = new Map(deductions);
const matchById = new Map(matches.map((match) => [match.match_id, match]));
const snapshots = readJsonDir(path.join(root, "data", "odds", "reviewed"))
  .map(({ item }) => item)
  .filter((item) => item.status === "reviewed" && item.content_type === "odds_snapshot");

const signals = [];
for (const snapshot of snapshots) {
  for (const snapshotMatch of snapshot.matches || []) {
    const matchId = snapshotMatch.match_id;
    const prediction = predictions.get(matchId);
    const deduction = deductionByMatch.get(matchId);
    const outcomeProbs = predictionOutcomeProbabilities(prediction);
    const over25 = normalizeProbability(deduction?.match?.over_2_5_probability);

    for (const market of snapshotMatch.markets || []) {
      const marketMap = marketProbabilities(market.outcomes || []);
      for (const outcome of market.outcomes || []) {
        let modelProbability = null;
        if (market.market === "moneyline_1x2" && outcomeProbs) {
          modelProbability = outcomeProbs[outcome.selection];
        }
        if (market.market === "over_under_2_5" && over25 !== null) {
          modelProbability = outcome.selection === "over_2_5" ? over25 : 1 - over25;
        }
        const marketProbability = marketMap.get(outcome.selection);
        if (typeof modelProbability !== "number" || typeof marketProbability !== "number") continue;

        const fairOdds = 1 / modelProbability;
        const edge = modelProbability - marketProbability;
        const expectedValue = modelProbability * outcome.decimal_odds - 1;
        const signal = signalFor(expectedValue, edge, modelProbability);
        const riskLevel = riskFor(signal, modelProbability, edge);
        const signalId = `${matchId}--${market.market}--${outcome.selection}`;
        const sourcePaths = [
          `data/odds/reviewed/${snapshot.snapshot_id}.json`,
        ];
        if (prediction?.article_path) sourcePaths.push(prediction.article_path);
        if (deduction?.report?.article_path) sourcePaths.push(deduction.report.article_path);

        const match = matchById.get(matchId);
        const selectionLabel = outcome.label || outcome.selection;
        const rationale = market.market === "over_under_2_5"
          ? `推演报告给出大球概率 ${(over25 * 100).toFixed(1)}%，与去水市场概率 ${(marketProbability * 100).toFixed(1)}% 对比后形成 ${selectionLabel} 信号。`
          : `预测比分 ${prediction?.prediction_score || "待定"} / ${prediction?.backup_score || "待定"} 与置信度 ${prediction?.confidence || "unknown"} 转换为温和胜平负概率，再与去水市场概率对比。`;

        signals.push({
          schema_version: "1.0",
          content_type: "value_signal",
          signal_id: signalId,
          match_id: matchId,
          market: market.market,
          selection: outcome.selection,
          line: market.line ?? null,
          model_probability: round(modelProbability),
          market_probability: round(marketProbability),
          decimal_odds: round(outcome.decimal_odds, 3),
          fair_odds: round(fairOdds, 3),
          edge: round(edge),
          expected_value: round(expectedValue),
          signal,
          risk_level: riskLevel,
          shadow_stake_units: signal === "watch" ? 0.5 : signal === "thin_value" ? 0.25 : 0,
          mode,
          odds_provider: snapshot.provider,
          odds_snapshot_id: snapshot.snapshot_id,
          rationale,
          source_paths: sourcePaths,
          status,
          model_version: modelVersion,
          generated_by: "value-model-agent-v0",
          reviewed_by: status === "reviewed" ? "value-model-agent-v0" : null,
          generated_at: generatedAt,
          reviewed_at: status === "reviewed" ? generatedAt : null,
          match_label: match ? `${match.home_team.display_name_zh} vs ${match.away_team.display_name_zh}` : null,
        });
      }
    }
  }
}

const outputDir = path.join(root, "data", "value", status);
fs.mkdirSync(outputDir, { recursive: true });
for (const signal of signals) {
  const fileName = `${slugPart(signal.signal_id)}.json`;
  fs.writeFileSync(path.join(outputDir, fileName), `${JSON.stringify(signal, null, 2)}\n`, "utf8");
}

console.log(`Generated ${signals.length} value signals in ${path.relative(process.cwd(), outputDir) || outputDir}`);