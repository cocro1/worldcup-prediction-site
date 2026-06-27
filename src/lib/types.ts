export type TeamRef = {
  team_id: string;
  name_en: string;
  name_zh: string;
  display_name_zh: string;
  is_placeholder: boolean;
  placeholder_label: string | null;
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

export type Result = {
  schema_version: "1.0";
  match_id: string;
  status: "full_time" | "result_verified";
  home_score_90: number;
  away_score_90: number;
  total_goals_90?: number;
  handicap?: string;
  verified_at: string;
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

