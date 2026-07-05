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
  remainingMatches: number;
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
  totalMatchesEvaluated: number;
  correctPredictions: number;
  calibrationNote: string;
}

const BASE = import.meta.env.BASE_URL;

export async function loadPredictions(): Promise<PredictionsData> {
  const res = await fetch(`${BASE}predictions.json`);
  if (!res.ok) throw new Error('Failed to load predictions.json');
  return res.json();
}

export async function loadAccuracy(): Promise<AccuracyData> {
  const res = await fetch(`${BASE}accuracy.json`);
  if (!res.ok) throw new Error('Failed to load accuracy.json');
  return res.json();
}
