import React from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle, Target, Filter } from 'lucide-react';
import { SessionAnalytics } from '../services/sessionAnalytics';

interface DashboardInsightsProps {
  analytics: SessionAnalytics;
  selectedDifficulty: string;
  onDifficultyChange: (difficulty: string) => void;
}

function DashboardInsights({ analytics, selectedDifficulty, onDifficultyChange }: DashboardInsightsProps) {
  const getTrendIcon = () => {
    if (analytics.progressionTrend.trend === 'up') {
      return <TrendingUp className="h-8 w-8 text-green-600" />;
    } else if (analytics.progressionTrend.trend === 'down') {
      return <TrendingDown className="h-8 w-8 text-red-600" />;
    }
    return <Minus className="h-8 w-8 text-blue-600" />;
  };

  const getTrendColor = () => {
    if (analytics.progressionTrend.trend === 'up') return 'from-green-500 to-green-600';
    if (analytics.progressionTrend.trend === 'down') return 'from-red-500 to-red-600';
    return 'from-blue-500 to-blue-600';
  };

  const getTrendText = () => {
    if (analytics.progressionTrend.trend === 'up') {
      return `+${analytics.progressionTrend.percentage}% par rapport aux 5 sessions précédentes`;
    } else if (analytics.progressionTrend.trend === 'down') {
      return `-${analytics.progressionTrend.percentage}% par rapport aux 5 sessions précédentes`;
    }
    return 'Stable par rapport aux 5 sessions précédentes';
  };

  return (
    <div className="space-y-6">
      {/* Filtre de difficulté - TOUJOURS VISIBLE */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-slate-100 p-2 rounded-lg">
              <Filter className="h-5 w-5 text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Filtrer par difficulté</h3>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onDifficultyChange('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedDifficulty === 'all'
                  ? 'bg-slate-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => onDifficultyChange('easy')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedDifficulty === 'easy'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Facile
            </button>
            <button
              onClick={() => onDifficultyChange('medium')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedDifficulty === 'medium'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Moyen
            </button>
            <button
              onClick={() => onDifficultyChange('hard')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedDifficulty === 'hard'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Difficile
            </button>
          </div>
        </div>
      </div>

      {/* Message si données insuffisantes */}
      {!analytics.hasEnoughData && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="text-center">
            <div className="bg-blue-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Données insuffisantes</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {selectedDifficulty === 'all'
                ? 'Effectuez au moins 3 simulations pour débloquer l\'analyse détaillée de votre progression, vos points forts récurrents et vos axes d\'amélioration prioritaires.'
                : `Vous avez ${analytics.totalSessions} session${analytics.totalSessions > 1 ? 's' : ''} en difficulté ${selectedDifficulty === 'easy' ? 'facile' : selectedDifficulty === 'medium' ? 'moyenne' : 'difficile'}. Effectuez au moins 3 simulations de ce niveau pour débloquer l'analyse détaillée, ou passez au filtre "Toutes" pour voir la synthèse globale.`
              }
            </p>
            <div className="inline-flex items-center space-x-2 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">
              <span className="font-semibold">{analytics.totalSessions}/3</span>
              <span>simulations effectuées</span>
              {selectedDifficulty !== 'all' && (
                <span className="text-gray-400">
                  ({selectedDifficulty === 'easy' ? 'facile' : selectedDifficulty === 'medium' ? 'moyen' : 'difficile'})
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Analyse détaillée - visible uniquement si assez de données */}
      {analytics.hasEnoughData && (
        <>
          {/* Progression avec tendance */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className={`bg-gradient-to-r ${getTrendColor()} text-white p-6`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                    {getTrendIcon()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Progression générale</h3>
                    <p className="text-white/90 text-sm">Moyenne des 5 derniers appels</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold mb-1">
                    {analytics.progressionTrend.current}
                    <span className="text-2xl text-white/80">/100</span>
                  </div>
                  <p className="text-sm text-white/90">
                    {getTrendText()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Points positifs récurrents */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-green-100 p-2 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Points forts récurrents</h3>
              </div>
              {analytics.recurringStrengths.length > 0 ? (
                <div className="space-y-3">
                  {analytics.recurringStrengths.map((strength, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-100">
                      <div className="bg-green-500 p-1 rounded-full mt-0.5">
                        <CheckCircle className="h-3 w-3 text-white" />
                      </div>
                      <p className="text-sm text-gray-800 flex-1 leading-relaxed">{strength}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm">
                    Continuez à pratiquer pour identifier vos points forts récurrents.
                  </p>
                </div>
              )}
            </div>

            {/* Axes d'amélioration récurrents */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Axes d'amélioration prioritaires</h3>
              </div>
              {analytics.recurringImprovements.length > 0 ? (
                <div className="space-y-3">
                  {analytics.recurringImprovements.map((improvement, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                      <div className="bg-orange-500 p-1 rounded-full mt-0.5">
                        <AlertCircle className="h-3 w-3 text-white" />
                      </div>
                      <p className="text-sm text-gray-800 flex-1 leading-relaxed">{improvement}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm">
                    Aucun axe d'amélioration récurrent identifié. Excellent travail !
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recommandation prioritaire */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg border-2 border-blue-200 p-6">
            <div className="flex items-start space-x-4">
              <div className="bg-blue-500 p-3 rounded-xl flex-shrink-0">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-blue-900 mb-2">Recommandation prioritaire</h3>
                <p className="text-gray-800 leading-relaxed">{analytics.topRecommendation}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default DashboardInsights;
