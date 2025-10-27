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

  // Calculer le score moyen récent
  const avgScore = recentSessions.reduce((sum, s) => sum + s.score, 0) / recentSessions.length;

  // Analyser les axes d'amélioration récurrents
  const allImprovements = recentSessions
    .flatMap(s => s.improvements || [])
    .filter(Boolean);

  const improvementCount = new Map<string, number>();
  allImprovements.forEach(imp => {
    const normalized = imp.toLowerCase().trim();
    improvementCount.set(normalized, (improvementCount.get(normalized) || 0) + 1);
  });

  // Trouver les 2 axes d'amélioration les plus fréquents
  const topImprovements = Array.from(improvementCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([item]) => {
      const original = allImprovements.find(i => i.toLowerCase().trim() === item);
      return original || item;
    });

  // Analyser les détails des 3 dernières sessions
  const last3 = getLastNSessions(sessions, 3);
  const criteriaScores: { [key: string]: number[] } = {
    accroche: [],
    ecoute: [],
    objections: [],
    clarte: [],
    conclusion: []
  };

  last3.forEach(session => {
    const analysis = parseDetailedAnalysis(session.detailedAnalysis);
    if (analysis) {
      if (analysis.accroche_mise_en_confiance) criteriaScores.accroche.push(analysis.accroche_mise_en_confiance.score);
      if (analysis.ecoute_adaptation) criteriaScores.ecoute.push(analysis.ecoute_adaptation.score);
      if (analysis.gestion_objections) criteriaScores.objections.push(analysis.gestion_objections.score);
      if (analysis.clarte_structure) criteriaScores.clarte.push(analysis.clarte_structure.score);
      if (analysis.conclusion_engagement) criteriaScores.conclusion.push(analysis.conclusion_engagement.score);
    }
  });

  // Trouver le critère le plus faible
  let weakestCriteria = '';
  let weakestScore = 100;
  const criteriaNames: { [key: string]: string } = {
    accroche: 'votre accroche et mise en confiance',
    ecoute: 'votre capacité d\'écoute et d\'adaptation',
    objections: 'votre gestion des objections',
    clarte: 'la clarté de votre discours',
    conclusion: 'votre conclusion et engagement'
  };

  Object.entries(criteriaScores).forEach(([key, scores]) => {
    if (scores.length > 0) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg < weakestScore) {
        weakestScore = avg;
        weakestCriteria = criteriaNames[key];
      }
    }
  });

  // Générer une recommandation intelligente basée sur les données
  if (avgScore >= 80) {
    if (weakestCriteria && weakestScore < 85) {
      return `Excellente performance globale ! Pour atteindre l'excellence, concentrez-vous sur ${weakestCriteria} qui reste votre point d'amélioration principal.`;
    }
    return "Performance exceptionnelle ! Maintenez votre niveau en continuant à pratiquer régulièrement, et challengez-vous avec des niveaux de difficulté plus élevés.";
  } else if (avgScore >= 60) {
    if (weakestCriteria) {
      return `Bonne progression ! Votre priorité : travailler ${weakestCriteria}. ${topImprovements.length > 0 ? 'Focus également sur : ' + topImprovements[0].toLowerCase() + '.' : ''}`;
    }
    if (topImprovements.length > 0) {
      return `Bonne progression ! Concentrez-vous en priorité sur : ${topImprovements[0].toLowerCase()}${topImprovements.length > 1 ? ', puis ' + topImprovements[1].toLowerCase() : ''}.`;
    }
    return "Performance correcte. Continuez à vous entraîner quotidiennement pour automatiser vos réflexes commerciaux et gagner en aisance.";
  } else {
    if (weakestCriteria) {
      return `Point d'attention urgent : ${weakestCriteria}. ${topImprovements.length > 0 ? 'Travaillez également sur : ' + topImprovements[0].toLowerCase() : 'Pratiquez régulièrement pour progresser.'}.`;
    }
    if (topImprovements.length > 0) {
      return `Axes prioritaires à travailler : ${topImprovements[0].toLowerCase()}${topImprovements.length > 1 ? ' et ' + topImprovements[1].toLowerCase() : ''}. Pratiquez quotidiennement pour voir des progrès rapides.`;
    }
    return "Continuez à vous entraîner ! La pratique régulière est la clé pour améliorer rapidement votre technique de prospection téléphonique.";
  }
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
