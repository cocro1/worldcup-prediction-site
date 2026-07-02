export type TeamRef = {
  team_id: string;
  name_en: string;
  name_zh: string;
  display_name_zh: string;
  is_placeholder: boolean;
  placeholder_label: string | null;
  flag_code?: string;
};

export type Match = {
  schema_version: "1.0";
  match_id: string;
  match_no: number;
  stage: string;
  stage_zh: string;
  group: string | null;
  home_team: TeamRef;
  away_team: TeamRef;
  kickoff_beijing: string;
  kickoff_beijing_date: string;
  kickoff_beijing_time: string;
  teams_confirmed: boolean;
};

export type Prediction = {
  schema_version: "1.0";
  content_type: "prediction";
  match_id: string;
  title: string;
  article_path: string;
  prediction_score: string;
  backup_score: string;
  confidence: "low" | "medium-low" | "medium" | "medium-high" | "high";
  confidence_zh?: string;
  status: string;
};

export type DeductionMatch = {
  match_id: string;
  deduction_scores: string[];
  over_2_5_probability: number;
};

export type Deduction = {
  schema_version: "1.0";
  content_type: "deduction";
  deduction_date: string;
  title: string;
  article_path: string;
  matches: DeductionMatch[];
  status: string;
};


export type OddsOutcome = {
  selection: "home" | "draw" | "away" | "over_2_5" | "under_2_5";
  label?: string | null;
  decimal_odds: number;
};

export type OddsMarket = {
  market: "moneyline_1x2" | "over_under_2_5";
  line?: number | null;
  outcomes: OddsOutcome[];
};

export type OddsSnapshot = {
  schema_version: "1.0";
  content_type: "odds_snapshot";
  snapshot_id: string;
  provider: string;
  provider_is_live: boolean;
  fetched_at: string;
  notes?: string | null;
  matches: Array<{
    match_id: string;
    markets: OddsMarket[];
  }>;
  status: string;
  generated_by?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
};

export type ValueSignal = {
  schema_version: "1.0";
  content_type: "value_signal";
  signal_id: string;
  match_id: string;
  market: "moneyline_1x2" | "over_under_2_5";
  selection: "home" | "draw" | "away" | "over_2_5" | "under_2_5";
  line?: number | null;
  model_probability: number;
  market_probability: number;
  decimal_odds: number;
  fair_odds: number;
  edge: number;
  expected_value: number;
  signal: "watch" | "thin_value" | "no_value" | "avoid";
  risk_level: "low" | "medium" | "high";
  shadow_stake_units?: number | null;
  mode: "shadow" | "published_research";
  odds_provider?: string | null;
  odds_snapshot_id?: string | null;
  rationale?: string | null;
  source_paths?: string[];
  status: string;
  model_version: string;
  generated_by: string;
  reviewed_by?: string | null;
  generated_at: string;
  reviewed_at?: string | null;
  match_label?: string | null;
};
export type Result = {
  schema_version: "1.0";
  match_id: string;
  status: "full_time" | "result_verified";
  home_score_90?: number | null;
  away_score_90?: number | null;
  total_goals_90?: number | null;
  handicap?: string | null;
  extra_time_score?: string | null;
  penalty_score?: string | null;
  source?: {
    primary: string;
    checked_sources: string[];
  } | null;
  verified_at?: string | null;
};

export type TopicLike = {
  title: string;
  article_path: string;
  published_date?: string;
  status: string;
  summary?: string | null;
  related?: {
    dates?: string[];
    match_ids?: string[];
    team_ids?: string[];
    groups?: string[];
    stages?: string[];
  };
};

