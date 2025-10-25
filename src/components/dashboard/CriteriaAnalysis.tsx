import React, { useState } from 'react';
import { RadarChart } from '../charts/RadarChart';
import { HorizontalBarChart } from '../charts/HorizontalBarChart';
import { BarChart3 } from 'lucide-react';

interface CriteriaScores {
  accroche: number;
  ecoute: number;
  objections: number;
  clarte: number;
  conclusion: number;
}

interface SessionData {
  id: string;
  criteria_scores: CriteriaScores | null;
  created_at: string;
}

interface CriteriaAnalysisProps {
  sessions: SessionData[];
}

export function CriteriaAnalysis({ sessions }: CriteriaAnalysisProps) {
  const [viewMode, setViewMode] = useState<'radar' | 'bars'>('radar');

  const sessionsWithCriteria = sessions.filter(s => s.criteria_scores !== null);
  const last5Sessions = sessionsWithCriteria.slice(-5);

  if (last5Sessions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Analyse par critère</h2>
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4" />
            <p>Aucune donnée de critères disponible</p>
            <p className="text-sm mt-2">Effectuez une nouvelle session pour voir vos scores détaillés</p>
          </div>
        </div>
      </div>
    );
  }

  const averageCriteria: CriteriaScores = {
    accroche: 0,
    ecoute: 0,
    objections: 0,
    clarte: 0,
    conclusion: 0
  };

  last5Sessions.forEach(session => {
    if (session.criteria_scores) {
      averageCriteria.accroche += session.criteria_scores.accroche;
      averageCriteria.ecoute += session.criteria_scores.ecoute;
      averageCriteria.objections += session.criteria_scores.objections;
      averageCriteria.clarte += session.criteria_scores.clarte;
      averageCriteria.conclusion += session.criteria_scores.conclusion;
    }
  });

  Object.keys(averageCriteria).forEach(key => {
    averageCriteria[key as keyof CriteriaScores] = Math.round(
      averageCriteria[key as keyof CriteriaScores] / last5Sessions.length
    );
  });

  const barData = [
    { label: 'Accroche et mise en confiance', value: averageCriteria.accroche },
    { label: 'Capacité d\'écoute et de reformulation', value: averageCriteria.ecoute },
    { label: 'Gestion des objections', value: averageCriteria.objections },
    { label: 'Clarté et structure du discours', value: averageCriteria.clarte },
    { label: 'Conclusion et engagement', value: averageCriteria.conclusion }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Analyse par critère</h2>
        <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('radar')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'radar'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Vue Radar
          </button>
          <button
            onClick={() => setViewMode('bars')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'bars'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Vue Barres
          </button>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-4">
        <p className="text-sm text-gray-600 mb-4">
          Moyenne sur les 5 dernières sessions ({last5Sessions.length} session{last5Sessions.length > 1 ? 's' : ''})
        </p>
        {viewMode === 'radar' ? (
          <RadarChart data={averageCriteria} size={350} color="#3b82f6" />
        ) : (
          <HorizontalBarChart data={barData} />
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Comment interpréter ces scores ?</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li><strong>80-100 :</strong> Excellent - Vous maîtrisez ce critère</li>
          <li><strong>60-79 :</strong> Bien - Quelques améliorations possibles</li>
          <li><strong>40-59 :</strong> À travailler - Concentrez vos efforts ici</li>
          <li><strong>0-39 :</strong> Prioritaire - Nécessite une attention particulière</li>
        </ul>
      </div>
    </div>
  );
}
