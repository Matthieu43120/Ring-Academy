import React from 'react';
import { Brain, TrendingUp, AlertTriangle } from 'lucide-react';

interface CriteriaScores {
  accroche: number;
  ecoute: number;
  objections: number;
  clarte: number;
  conclusion: number;
}

interface SessionData {
  id: string;
  score: number;
  criteria_scores: CriteriaScores | null;
  created_at: string;
}

interface PersonalizedSummaryProps {
  sessions: SessionData[];
}

export function PersonalizedSummary({ sessions }: PersonalizedSummaryProps) {
  if (sessions.length === 0) {
    return null;
  }

  const last5Sessions = sessions.slice(-5);
  const sessionsWithCriteria = last5Sessions.filter(s => s.criteria_scores !== null);

  if (sessionsWithCriteria.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Synthèse personnalisée</h2>
        <p className="text-gray-600">
          Effectuez quelques sessions pour obtenir une synthèse personnalisée de votre progression.
        </p>
      </div>
    );
  }

  const criteriaNames: Record<keyof CriteriaScores, string> = {
    accroche: 'l\'accroche',
    ecoute: 'l\'écoute',
    objections: 'la gestion des objections',
    clarte: 'la clarté du discours',
    conclusion: 'la conclusion'
  };

  const averageCriteria: CriteriaScores = {
    accroche: 0,
    ecoute: 0,
    objections: 0,
    clarte: 0,
    conclusion: 0
  };

  sessionsWithCriteria.forEach(session => {
    if (session.criteria_scores) {
      Object.keys(averageCriteria).forEach(key => {
        averageCriteria[key as keyof CriteriaScores] +=
          session.criteria_scores![key as keyof CriteriaScores];
      });
    }
  });

  Object.keys(averageCriteria).forEach(key => {
    averageCriteria[key as keyof CriteriaScores] =
      averageCriteria[key as keyof CriteriaScores] / sessionsWithCriteria.length;
  });

  const sortedCriteria = Object.entries(averageCriteria).sort((a, b) => a[1] - b[1]);
  const weakestCriterion = sortedCriteria[0];
  const strongestCriterion = sortedCriteria[sortedCriteria.length - 1];

  const scores = last5Sessions.map(s => s.score);
  const isImproving = scores.length >= 3 && scores[scores.length - 1] > scores[0];

  const getMotivationalMessage = () => {
    const lastScore = scores[scores.length - 1];
    if (isImproving) {
      if (lastScore >= 80) {
        return "Excellent travail ! Vous progressez régulièrement et atteignez un niveau d'excellence.";
      }
      return "Bravo ! Vous progressez de manière constante. Continuez sur cette lancée !";
    }
    if (lastScore >= 70) {
      return "Vous maintenez un bon niveau. Concentrez-vous sur vos points faibles pour franchir un nouveau cap.";
    }
    return "Chaque session est une opportunité d'apprendre. Restez motivé, les progrès arrivent !";
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Synthèse personnalisée</h2>

      <div className="space-y-6">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <div className="bg-orange-500 p-3 rounded-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-orange-900 mb-2">Pense-bête du moment</h3>
              <p className="text-orange-800 font-medium">
                Concentre-toi sur <strong>{criteriaNames[weakestCriterion[0] as keyof CriteriaScores]}</strong>
                {' '}(score moyen : {Math.round(weakestCriterion[1])}/100).
              </p>
              <p className="text-orange-700 text-sm mt-2">
                C'est actuellement ton point le plus faible. En y travaillant, tu vas gagner des points rapidement !
              </p>
            </div>
          </div>
        </div>

        <div className={`bg-gradient-to-br ${isImproving ? 'from-green-50 to-green-100 border-green-300' : 'from-blue-50 to-blue-100 border-blue-300'} border-2 rounded-xl p-6`}>
          <div className="flex items-start space-x-4">
            <div className={`${isImproving ? 'bg-green-500' : 'bg-blue-500'} p-3 rounded-lg`}>
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-bold ${isImproving ? 'text-green-900' : 'text-blue-900'} mb-2`}>
                Résumé de progression
              </h3>
              <p className={`${isImproving ? 'text-green-800' : 'text-blue-800'} font-medium`}>
                {getMotivationalMessage()}
              </p>
              <p className={`${isImproving ? 'text-green-700' : 'text-blue-700'} text-sm mt-2`}>
                Ton point fort : <strong>{criteriaNames[strongestCriterion[0] as keyof CriteriaScores]}</strong>
                {' '}({Math.round(strongestCriterion[1])}/100) - Continue à le cultiver !
              </p>
            </div>
          </div>
        </div>

        {averageCriteria.objections < 60 && (
          <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <div className="bg-red-500 p-3 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900 mb-2">Point d'attention</h3>
                <p className="text-red-800 font-medium">
                  La gestion des objections nécessite une attention particulière.
                </p>
                <p className="text-red-700 text-sm mt-2">
                  Conseil : Écoute attentivement l'objection, reformule-la pour montrer ta compréhension,
                  puis réponds de manière ciblée en apportant de la valeur.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
