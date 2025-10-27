interface SessionRecord {
  id: string;
  userId: string;
  target: string;
  difficulty: string;
  score: number;
  duration: number;
  feedback: string[];
  recommendations: string[];
  improvements: string[];
  detailedAnalysis: string | null;
  date: string;
}

interface DetailedAnalysis {
  accroche_mise_en_confiance?: { score: number; commentaire: string };
  ecoute_adaptation?: { score: number; commentaire: string };
  gestion_objections?: { score: number; commentaire: string };
  clarte_structure?: { score: number; commentaire: string };
  conclusion_engagement?: { score: number; commentaire: string };
  analyse_generale?: string;
}

export interface ProgressionTrend {
  current: number;
  previous: number;
  trend: 'up' | 'down' | 'stable';
  percentage: number;
}

export interface SessionAnalytics {
  totalSessions: number;
  averageScore: number;
  bestScore: number;
  progressionTrend: ProgressionTrend;
  recurringImprovements: string[];
  recurringStrengths: string[];
  topRecommendation: string;
  hasEnoughData: boolean;
}

function parseDetailedAnalysis(detailedAnalysis: string | null): DetailedAnalysis | null {
  if (!detailedAnalysis) return null;

  try {
    return JSON.parse(detailedAnalysis);
  } catch (error) {
    return null;
  }
}

function getLastNSessions(sessions: SessionRecord[], n: number, difficulty?: string): SessionRecord[] {
  let filtered = [...sessions];

  if (difficulty && difficulty !== 'all') {
    filtered = filtered.filter(s => s.difficulty === difficulty);
  }

  return filtered
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, n);
}

function calculateProgressionTrend(sessions: SessionRecord[], difficulty?: string): ProgressionTrend {
  const last5 = getLastNSessions(sessions, 5, difficulty);
  const previous5 = getLastNSessions(sessions, 10, difficulty).slice(5, 10);

  if (last5.length === 0) {
    return { current: 0, previous: 0, trend: 'stable', percentage: 0 };
  }

  const currentAvg = last5.reduce((sum, s) => sum + s.score, 0) / last5.length;
  const previousAvg = previous5.length > 0
    ? previous5.reduce((sum, s) => sum + s.score, 0) / previous5.length
    : currentAvg;

  const diff = currentAvg - previousAvg;
  const percentage = previousAvg > 0 ? Math.abs((diff / previousAvg) * 100) : 0;

  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (diff > 2) trend = 'up';
  else if (diff < -2) trend = 'down';

  return {
    current: Math.round(currentAvg),
    previous: Math.round(previousAvg),
    trend,
    percentage: Math.round(percentage)
  };
}

function extractRecurringItems(items: string[][], minOccurrences: number = 2): string[] {
  const itemCount = new Map<string, number>();

  items.flat().forEach(item => {
    const normalized = item.toLowerCase().trim();
    itemCount.set(normalized, (itemCount.get(normalized) || 0) + 1);
  });

  const recurring = Array.from(itemCount.entries())
    .filter(([, count]) => count >= minOccurrences)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([item]) => {
      const original = items.flat().find(i => i.toLowerCase().trim() === item);
      return original || item;
    });

  return recurring;
}

function getTopRecommendation(sessions: SessionRecord[]): string {
  const recentSessions = getLastNSessions(sessions, 5);

  if (recentSessions.length === 0) {
    return "Commencez par effectuer des simulations pour obtenir des recommandations personnalisées.";
  }

  const allRecommendations = recentSessions
    .flatMap(s => s.recommendations)
    .filter(Boolean);

  if (allRecommendations.length === 0) {
    return "Continuez à pratiquer régulièrement pour identifier vos axes de progression.";
  }

  const recommendationCount = new Map<string, number>();
  allRecommendations.forEach(rec => {
    const normalized = rec.toLowerCase().trim();
    recommendationCount.set(normalized, (recommendationCount.get(normalized) || 0) + 1);
  });

  const topRec = Array.from(recommendationCount.entries())
    .sort((a, b) => b[1] - a[1])[0];

  const original = allRecommendations.find(r => r.toLowerCase().trim() === topRec[0]);
  return original || topRec[0];
}

export function analyzeUserSessions(sessions: SessionRecord[], difficulty: string = 'all'): SessionAnalytics {
  let filteredSessions = [...sessions];

  if (difficulty !== 'all') {
    filteredSessions = filteredSessions.filter(s => s.difficulty === difficulty);
  }

  const hasEnoughData = filteredSessions.length >= 3;

  if (filteredSessions.length === 0) {
    return {
      totalSessions: 0,
      averageScore: 0,
      bestScore: 0,
      progressionTrend: { current: 0, previous: 0, trend: 'stable', percentage: 0 },
      recurringImprovements: [],
      recurringStrengths: [],
      topRecommendation: "Commencez par effectuer des simulations pour obtenir des recommandations personnalisées.",
      hasEnoughData: false
    };
  }

  const totalSessions = filteredSessions.length;
  const averageScore = Math.round(
    filteredSessions.reduce((sum, s) => sum + s.score, 0) / totalSessions
  );
  const bestScore = Math.max(...filteredSessions.map(s => s.score));

  const progressionTrend = calculateProgressionTrend(filteredSessions, difficulty);

  const recurringImprovements = hasEnoughData
    ? extractRecurringItems(
        getLastNSessions(filteredSessions, 5).map(s => s.improvements || [])
      )
    : [];

  const recurringStrengths = hasEnoughData
    ? extractRecurringItems(
        getLastNSessions(filteredSessions, 5).map(s => s.feedback || [])
      )
    : [];

  const topRecommendation = hasEnoughData
    ? getTopRecommendation(filteredSessions)
    : "Effectuez au moins 3 simulations pour obtenir des recommandations personnalisées.";

  return {
    totalSessions,
    averageScore,
    bestScore,
    progressionTrend,
    recurringImprovements,
    recurringStrengths,
    topRecommendation,
    hasEnoughData
  };
}
