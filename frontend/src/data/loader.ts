export interface ChampionProb {
  team: string;
  prob: number;
}

export interface StageProb {
  roundOf16: number;
  quarter: number;
  semi: number;
  final: number;
  champion: number;
}

export interface MatchPrediction {
  matchId: string;
  round: string;
  teamA: string;
  teamB: string;
  probA: number;
  probDraw: number;
  probB: number;
  keyFactors: string[];
}

export interface TopScorer {
  player: string;
  team: string;
  existingGoals: number;
  predictedGoals: number;
  confidence?: string;
  status?: string;
}

export interface KnockoutMatch {
  id: string;
  teamA: string;
  teamB: string;
  completed: boolean;
  scoreA?: number;
  scoreB?: number;
  winner?: string;
  penaltyScoreA?: number;
  penaltyScoreB?: number;
  probA?: number;
  probB?: number;
  predScoreA?: number;
  predScoreB?: number;
}

export interface KnockoutRound {
  name: string;
  matches: KnockoutMatch[];
}

export interface KnockoutBracket {
  rounds: KnockoutRound[];
}

export interface PredictionsData {
  generatedAt: string;
  championProb: ChampionProb[];
  stageProb: Record<string, StageProb>;
  matches: MatchPrediction[];
  topScorers: TopScorer[];
  knockoutBracket?: KnockoutBracket;
}

export interface AccuracyData {
  modelAccuracy: number;
  groupStageAccuracy: number;
  knockoutAccuracy: number;
  overallAccuracy: number;
  totalMatchesEvaluated: number;
  correctPredictions: number;
  groupMatches: number;
  knockoutMatches: number;
  calibrationNote: string;
}

const API_MODE = import.meta.env.VITE_API_MODE === 'true';
const BASE = import.meta.env.BASE_URL;

export async function loadPredictions(): Promise<PredictionsData> {
  const url = API_MODE ? '/api/predictions' : `${BASE}predictions.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load predictions (${res.status})`);
  return res.json();
}

export async function loadAccuracy(): Promise<AccuracyData> {
  const url = API_MODE ? '/api/accuracy' : `${BASE}accuracy.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load accuracy (${res.status})`);
  return res.json();
}

/** 触发预测重新生成（仅 API 模式可用） */
export async function regeneratePredictions(): Promise<{ message: string }> {
  if (!API_MODE) throw new Error('仅 API 部署模式支持重新生成');
  const res = await fetch('/api/regenerate', { method: 'POST' });
  if (!res.ok) throw new Error(`重新生成失败 (${res.status})`);
  return res.json();
}

/** 获取健康状态（仅 API 模式可用） */
export async function getHealth(): Promise<{ status: string; lastGenerated: string }> {
  if (!API_MODE) throw new Error('仅 API 部署模式支持健康检查');
  const res = await fetch('/api/health');
  if (!res.ok) throw new Error(`健康检查失败 (${res.status})`);
  return res.json();
}
