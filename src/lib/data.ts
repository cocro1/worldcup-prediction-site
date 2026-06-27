import fs from "node:fs";
import path from "node:path";
import { sharedPath, SHARED_ROOT } from "./paths";
import type { Deduction, Match, Prediction, Result, TopicLike } from "./types";

export const HIT_RATE_START_DATE = "2026-06-24";
export const OVER_2_5_THRESHOLD = 0.65;

type ResultsFile = Result[] | { results?: Result[] };

type RateMetric = {
  value: number;
  hit: number;
  total: number;
  displayValue: string;
  note: string;
};

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    return JSON.parse(stripBom(fs.readFileSync(filePath, "utf-8"))) as T;
  } catch {
    return fallback;
  }
}

function readJsonDir<T>(dirPath: string): T[] {
  if (!fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .flatMap((name) => {
      try {
        const item = JSON.parse(
          stripBom(fs.readFileSync(path.join(dirPath, name), "utf-8")),
        ) as T;
        return [item];
      } catch {
        return [];
      }
    });
}

export function getSharedRoot() {
  return SHARED_ROOT;
}

export function getTeams() {
  return readJsonFile<Array<{ team_id: string; flag_code: string }>>(
    sharedPath("data", "teams", "teams.seed.json"),
    [],
  );
}

export function getTeamsByFlag() {
  return new Map(
    getTeams()
      .filter((t) => t.flag_code)
      .map((t) => [t.team_id, t.flag_code]),
  );
}

export function getMatches() {
  const flagMap = getTeamsByFlag();
  return readJsonFile<Match[]>(
    sharedPath("data", "matches", "matches.seed.json"),
    [],
  )
    .sort((a, b) => {
      const time = a.kickoff_beijing.localeCompare(b.kickoff_beijing);
      return time || a.match_no - b.match_no;
    })
    .map((match) => ({
      ...match,
      home_team: {
        ...match.home_team,
        flag_code: flagMap.get(match.home_team.team_id) || undefined,
      },
      away_team: {
        ...match.away_team,
        flag_code: flagMap.get(match.away_team.team_id) || undefined,
      },
    }));
}

export function flagEmoji(code?: string) {
  if (!code || code === "zz") return "⚑";
  // Convert ISO 3166-1 alpha-2 to regional indicator symbols
  const chars = [...code.toLowerCase()];
  if (chars.length !== 2) return "⚑";
  const offset = 0x1f1e6 - 97; // 'a' → 🇦
  return String.fromCodePoint(chars[0].charCodeAt(0) + offset, chars[1].charCodeAt(0) + offset);
}

export function getReviewedPredictions() {
  return readJsonDir<Prediction>(
    sharedPath("data", "predictions", "reviewed"),
  ).filter((item) => item.status === "reviewed");
}

export function getReviewedDeductions() {
  return readJsonDir<Deduction>(
    sharedPath("data", "deductions", "reviewed"),
  ).filter((item) => item.status === "reviewed");
}

export function getReviewedMystic() {
  return readJsonDir<TopicLike>(sharedPath("data", "mystic", "reviewed")).filter(
    (item) => item.status === "reviewed",
  );
}

export function getReviewedTopics() {
  return readJsonDir<TopicLike>(sharedPath("data", "topics", "reviewed")).filter(
    (item) => item.status === "reviewed",
  );
}

export function getReviewedResults() {
  const aggregate = readJsonFile<ResultsFile>(
    sharedPath("data", "results", "results.json"),
    [],
  );
  const aggregateResults = Array.isArray(aggregate)
    ? aggregate
    : Array.isArray(aggregate.results)
      ? aggregate.results
      : [];
  const reviewedResults = readJsonDir<Result>(
    sharedPath("data", "results", "reviewed"),
  );

  const byMatch = new Map<string, Result>();
  for (const result of [...aggregateResults, ...reviewedResults]) {
    if (
      result?.match_id &&
      (result.status === "full_time" || result.status === "result_verified") &&
      (
        // have actual scores OR pre-match handicap
        (Number.isInteger(result.home_score_90) && Number.isInteger(result.away_score_90))
        || (typeof result.handicap === "string" && result.handicap.length > 0)
      )
    ) {
      byMatch.set(result.match_id, result);
    }
  }
  return [...byMatch.values()];
}

export function getPredictionsByMatch() {
  return new Map(getReviewedPredictions().map((item) => [item.match_id, item]));
}

export function getDeductionsByMatch() {
  const map = new Map<string, Deduction["matches"][number]>();
  for (const report of getReviewedDeductions()) {
    for (const match of report.matches || []) {
      map.set(match.match_id, match);
    }
  }
  return map;
}

export function getResultsByMatch() {
  return new Map(getReviewedResults().map((item) => [item.match_id, item]));
}

export function getDatesWithMatches(matches = getMatches()) {
  return [...new Set(matches.map((match) => match.kickoff_beijing_date))].sort();
}

function beijingDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function getCenterDate(matches = getMatches()) {
  const dates = getDatesWithMatches(matches);
  if (dates.length === 0) return beijingDateString();

  const today = beijingDateString();
  if (dates.includes(today)) return today;

  return dates.find((date) => date > today) || dates.at(-1) || today;
}

export function getVisibleDates(matches = getMatches()) {
  return getVisibleDatesAround(getCenterDate(matches), matches);
}

export function getVisibleDatesAround(selectedDate: string, matches = getMatches()) {
  const dates = getDatesWithMatches(matches);
  const center = selectedDate || getCenterDate(matches);
  const index = Math.max(0, dates.indexOf(center));
  if (dates.length <= 3) return dates;
  if (index === 0) return dates.slice(0, 3);
  if (index === dates.length - 1) return dates.slice(-3);
  return dates.slice(index - 1, index + 2);
}

export function formatScore(score?: string) {
  if (!score) return "\u5f85\u751f\u6210";
  return score.replace("-", ":");
}

export function confidenceLabel(confidence?: string, fallback?: string) {
  if (fallback) return fallback;
  if (confidence === "low") return "\u4f4e\u7f6e\u4fe1";
  if (confidence === "medium-low") return "\u4e2d\u4f4e\u7f6e\u4fe1";
  if (confidence === "medium") return "\u4e2d\u7f6e\u4fe1";
  if (confidence === "medium-high") return "\u4e2d\u9ad8\u7f6e\u4fe1";
  if (confidence === "high") return "\u9ad8\u7f6e\u4fe1";
  return "\u5f85\u751f\u6210";
}

export function dateLabel(date: string) {
  const parsed = new Date(`${date}T00:00:00+08:00`);
  const cnFmt = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });
  const parts = cnFmt.formatToParts(parsed);
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  const weekday = parts.find((p) => p.type === "weekday")?.value;
  return `${month}.${day} ${weekday}`;
}

export function matchStageLabel(match: Match) {
  if (match.stage === "group_stage" && match.group) {
    return `${match.group}\u7ec4 \u00b7 ${match.stage_zh}`;
  }
  return match.stage_zh;
}

function normalizeScore(score?: string) {
  return (score || "").trim().replace(/\s+/g, "").replace(":", "-");
}

function resultScore(result: Result) {
  return `${result.home_score_90}-${result.away_score_90}`;
}

function resultTotalGoals(result: Result) {
  return typeof result.total_goals_90 === "number"
    ? result.total_goals_90
    : result.home_score_90 + result.away_score_90;
}

function normalizeProbability(probability?: number) {
  if (typeof probability !== "number" || Number.isNaN(probability)) return null;
  return probability > 1 ? probability / 100 : probability;
}

function scoreHit(candidates: Array<string | undefined>, result: Result) {
  const actual = resultScore(result);
  return candidates.some((score) => normalizeScore(score) === actual);
}

function rateMetric(hit: number, total: number): RateMetric {
  const value = total > 0 ? hit / total : 0;
  return {
    value,
    hit,
    total,
    displayValue: `${Math.round(value * 100)}%`,
    note: `(${hit}/${total})`,
  };
}

export function getDashboardMetrics() {
  const matches = getMatches().filter(
    (match) => match.kickoff_beijing_date >= HIT_RATE_START_DATE,
  );
  const predictions = getPredictionsByMatch();
  const deductions = getDeductionsByMatch();
  const results = getResultsByMatch();

  let predictionHit = 0;
  let predictionTotal = 0;
  let deductionHit = 0;
  let deductionTotal = 0;
  let over25Hit = 0;
  let over25Total = 0;

  for (const match of matches) {
    const result = results.get(match.match_id);
    if (!result) continue;

    const prediction = predictions.get(match.match_id);
    if (prediction) {
      predictionTotal += 1;
      if (scoreHit([prediction.prediction_score, prediction.backup_score], result)) {
        predictionHit += 1;
      }
    }

    const deduction = deductions.get(match.match_id);
    if (deduction?.deduction_scores?.length) {
      deductionTotal += 1;
      if (scoreHit(deduction.deduction_scores, result)) {
        deductionHit += 1;
      }
    }

    const over25Probability = normalizeProbability(deduction?.over_2_5_probability);
    if (over25Probability !== null && over25Probability >= OVER_2_5_THRESHOLD) {
      over25Total += 1;
      if (resultTotalGoals(result) >= 3) {
        over25Hit += 1;
      }
    }
  }

  return {
    predictionScore: rateMetric(predictionHit, predictionTotal),
    deductionScore: rateMetric(deductionHit, deductionTotal),
    over25: rateMetric(over25Hit, over25Total),
  };
}

// In Astro/Vite build context, BASE_URL is available via import.meta.env
// During static build, this returns the configured base path
export function articleHref(articlePath?: string) {
  if (!articlePath) return "#";
  const normalized = articlePath.replace(/\\/g, "/");
  const slug = path.posix.basename(normalized, ".md");
  // Use BASE_URL from Astro config; fallback to empty string for portability
  const base = typeof import.meta !== "undefined" && import.meta.env?.BASE_URL
    ? (import.meta.env.BASE_URL).replace(/\/$/, "")
    : "";
  if (normalized.includes("/predictions/")) return `${base}/predictions/${slug}/`;
  if (normalized.includes("/deductions/")) return `${base}/deductions/${slug}/`;
  if (normalized.includes("/mystic/")) return `${base}/mystic/${slug}/`;
  if (normalized.includes("/topics/")) return `${base}/topics/${slug}/`;
  return "#";
}

export function resolveArticlePath(articlePath?: string) {
  if (!articlePath) return "";

  const normalized = articlePath.replace(/\\/g, "/");
  const directPath = sharedPath(...normalized.split("/"));
  if (fs.existsSync(directPath)) return directPath;

  const reviewedPath = sharedPath(
    ...normalized.replace("/draft/", "/reviewed/").split("/"),
  );
  if (fs.existsSync(reviewedPath)) return reviewedPath;

  const parts = normalized.split("/");
  const contentIndex = parts.indexOf("content");
  const section = contentIndex >= 0 ? parts[contentIndex + 1] : "";
  const fileName = path.posix.basename(normalized);
  if (section && fileName) {
    const sectionReviewedPath = sharedPath(
      "content",
      section,
      "reviewed",
      fileName,
    );
    if (fs.existsSync(sectionReviewedPath)) return sectionReviewedPath;
  }

  return "";
}

export function articleFileExists(articlePath?: string) {
  return Boolean(resolveArticlePath(articlePath));
}

export function readArticleMarkdown(articlePath?: string) {
  const resolvedPath = resolveArticlePath(articlePath);
  if (!resolvedPath) return "";
  try {
    return fs.readFileSync(resolvedPath, "utf-8");
  } catch {
    return "";
  }
}

