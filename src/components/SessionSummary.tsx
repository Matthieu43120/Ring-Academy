import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, TrendingUp, RotateCcw, Home, Trophy, AlertCircle, Play, Target, Award, CheckCircle, XCircle } from 'lucide-react';
import { SessionResult } from '../pages/Training';
import { cleanAnalyseGenerale } from '../utils/analysisParser';

interface SessionSummaryProps {
  result: SessionResult;
  onRestart: () => void;
  isAuthenticated?: boolean;
}

function SessionSummary({ result, onRestart, isAuthenticated = false }: SessionSummaryProps) {
  // Parse detailedAnalysis if it's a string
  const parseDetailedAnalysis = (analysis: any) => {
    if (!analysis) return null;

    // If it's already an object, return it
    if (typeof analysis === 'object' && !Array.isArray(analysis)) {
      return analysis;
    }

    // If it's a string, try to parse it
    if (typeof analysis === 'string') {
      try {
        return JSON.parse(analysis);
      } catch (e) {
        console.warn('Failed to parse detailedAnalysis:', e);
        return null;
      }
    }

    return null;
  };

  const detailedAnalysis = parseDetailedAnalysis(result.detailedAnalysis);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'from-green-500 to-green-600';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-red-600';
  };

  const getPerformanceMessage = (score: number) => {
    if (score >= 90) return "Exceptionnel ! Performance de maître";
    if (score >= 80) return "Excellent ! Très bonne maîtrise";
    if (score >= 70) return "Bien ! Quelques points à peaufiner";
    if (score >= 60) return "Correct ! Continuez à vous entraîner";
    return "À améliorer ! Ne lâchez rien, vous progressez";
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}min ${remainingSeconds}s`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 animate-fade-in overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r ${getScoreBackground(result.score)} text-white p-10 text-center relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        
        <div className="relative">
          <div className="mb-6">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl inline-block mb-4">
              <Trophy className="h-12 w-12 mx-auto" />
            </div>
            <h1 className="text-4xl font-bold mb-2">Session terminée !</h1>
          </div>
          
          <div className="bg-white/20 backdrop-blur-sm px-8 py-4 rounded-xl inline-flex items-center space-x-3 mb-4 shadow-lg">
            <Award className="h-8 w-8" />
            <span className="text-4xl font-bold">
              {result.score}/100
            </span>
          </div>
          
          <p className="text-xl font-semibold text-white/90">
            {getPerformanceMessage(result.score)}
          </p>
        </div>
      </div>

      <div className="p-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="flex items-center space-x-4 p-6 bg-blue-50 rounded-xl border border-blue-200">
            <div className="bg-blue-500 p-4 rounded-xl">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Durée de l'appel</p>
              <p className="text-3xl font-bold text-blue-900">{formatDuration(result.duration)}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-6 bg-purple-50 rounded-xl border border-purple-200">
            <div className="bg-purple-500 p-4 rounded-xl">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Performance</p>
              <p className="text-3xl font-bold text-purple-900">
                {result.score >= 80 ? 'Excellent' : result.score >= 60 ? 'Bon' : 'À améliorer'}
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Analysis */}
        {detailedAnalysis && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
              <div className="bg-blue-500 p-2 rounded-lg">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <span>Analyse détaillée</span>
            </h2>

            {/* Check if detailedAnalysis is an object with criteria scores */}
            {detailedAnalysis.accroche_mise_en_confiance ? (
              <div className="space-y-6">
                {/* Criterion 1: Accroche et mise en confiance */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-blue-900">Accroche et mise en confiance</h3>
                    <div className={`px-4 py-2 rounded-full font-bold text-lg ${
                      detailedAnalysis.accroche_mise_en_confiance.score >= 80 ? 'bg-green-500 text-white' :
                      detailedAnalysis.accroche_mise_en_confiance.score >= 60 ? 'bg-yellow-500 text-white' :
                      'bg-red-500 text-white'
                    }`}>
                      {detailedAnalysis.accroche_mise_en_confiance.score}/100
                    </div>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2 mb-4">
                    <div
                      className={`h-2 rounded-full ${
                        detailedAnalysis.accroche_mise_en_confiance.score >= 80 ? 'bg-green-500' :
                        detailedAnalysis.accroche_mise_en_confiance.score >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${detailedAnalysis.accroche_mise_en_confiance.score}%` }}
                    ></div>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{detailedAnalysis.accroche_mise_en_confiance.commentaire}</p>
                </div>

                {/* Criterion 2: Écoute et adaptation */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-purple-900">Capacité d'écoute et adaptation</h3>
                    <div className={`px-4 py-2 rounded-full font-bold text-lg ${
                      detailedAnalysis.ecoute_adaptation.score >= 80 ? 'bg-green-500 text-white' :
                      detailedAnalysis.ecoute_adaptation.score >= 60 ? 'bg-yellow-500 text-white' :
                      'bg-red-500 text-white'
                    }`}>
                      {detailedAnalysis.ecoute_adaptation.score}/100
                    </div>
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-2 mb-4">
                    <div
                      className={`h-2 rounded-full ${
                        detailedAnalysis.ecoute_adaptation.score >= 80 ? 'bg-green-500' :
                        detailedAnalysis.ecoute_adaptation.score >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${detailedAnalysis.ecoute_adaptation.score}%` }}
                    ></div>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{detailedAnalysis.ecoute_adaptation.commentaire}</p>
                </div>

                {/* Criterion 3: Gestion des objections */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-orange-900">Gestion des objections</h3>
                    <div className={`px-4 py-2 rounded-full font-bold text-lg ${
                      detailedAnalysis.gestion_objections.score >= 80 ? 'bg-green-500 text-white' :
                      detailedAnalysis.gestion_objections.score >= 60 ? 'bg-yellow-500 text-white' :
                      'bg-red-500 text-white'
                    }`}>
                      {detailedAnalysis.gestion_objections.score}/100
                    </div>
                  </div>
                  <div className="w-full bg-orange-200 rounded-full h-2 mb-4">
                    <div
                      className={`h-2 rounded-full ${
                        detailedAnalysis.gestion_objections.score >= 80 ? 'bg-green-500' :
                        detailedAnalysis.gestion_objections.score >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${detailedAnalysis.gestion_objections.score}%` }}
                    ></div>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{detailedAnalysis.gestion_objections.commentaire}</p>
                </div>

                {/* Criterion 4: Clarté et structure */}
                <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-6 border border-teal-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-teal-900">Clarté du discours et structure</h3>
                    <div className={`px-4 py-2 rounded-full font-bold text-lg ${
                      detailedAnalysis.clarte_structure.score >= 80 ? 'bg-green-500 text-white' :
                      detailedAnalysis.clarte_structure.score >= 60 ? 'bg-yellow-500 text-white' :
                      'bg-red-500 text-white'
                    }`}>
                      {detailedAnalysis.clarte_structure.score}/100
                    </div>
                  </div>
                  <div className="w-full bg-teal-200 rounded-full h-2 mb-4">
                    <div
                      className={`h-2 rounded-full ${
                        detailedAnalysis.clarte_structure.score >= 80 ? 'bg-green-500' :
                        detailedAnalysis.clarte_structure.score >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${detailedAnalysis.clarte_structure.score}%` }}
                    ></div>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{detailedAnalysis.clarte_structure.commentaire}</p>
                </div>

                {/* Criterion 5: Conclusion et engagement */}
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-6 border border-pink-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-pink-900">Conclusion et engagement</h3>
                    <div className={`px-4 py-2 rounded-full font-bold text-lg ${
                      detailedAnalysis.conclusion_engagement.score >= 80 ? 'bg-green-500 text-white' :
                      detailedAnalysis.conclusion_engagement.score >= 60 ? 'bg-yellow-500 text-white' :
                      'bg-red-500 text-white'
                    }`}>
                      {detailedAnalysis.conclusion_engagement.score}/100
                    </div>
                  </div>
                  <div className="w-full bg-pink-200 rounded-full h-2 mb-4">
                    <div
                      className={`h-2 rounded-full ${
                        detailedAnalysis.conclusion_engagement.score >= 80 ? 'bg-green-500' :
                        detailedAnalysis.conclusion_engagement.score >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${detailedAnalysis.conclusion_engagement.score}%` }}
                    ></div>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{detailedAnalysis.conclusion_engagement.commentaire}</p>
                </div>

                {/* General analysis */}
                {detailedAnalysis.analyse_generale && (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-300">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Analyse générale</h3>
                    <div className="text-gray-800 leading-relaxed text-base space-y-3">
                      {cleanAnalyseGenerale(detailedAnalysis.analyse_generale).split('\n\n').map((paragraph, index) => {
                        const lines = paragraph.split('\n');
                        const hasListItems = lines.some(line => line.trim().startsWith('•') || line.trim().startsWith('-'));

                        if (hasListItems) {
                          return (
                            <div key={index} className="mb-3">
                              {lines.map((line, lineIndex) => {
                                const trimmed = line.trim();
                                if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
                                  return (
                                    <div key={lineIndex} className="flex items-start space-x-2 mb-2 ml-4">
                                      <span className="text-blue-600 font-bold mt-1">•</span>
                                      <span className="flex-1">{trimmed.substring(1).trim()}</span>
                                    </div>
                                  );
                                } else if (trimmed) {
                                  return (
                                    <div key={lineIndex} className="font-semibold text-gray-900 mb-2">
                                      {trimmed}
                                    </div>
                                  );
                                }
                                return null;
                              })}
                            </div>
                          );
                        } else {
                          return (
                            <p key={index} className="mb-3">
                              {paragraph}
                            </p>
                          );
                        }
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Fallback for missing criteria */
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <p className="text-gray-800 leading-relaxed text-lg">
                  Analyse détaillée non disponible pour cette session.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Feedback */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
            <div className="bg-green-500 p-2 rounded-lg">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <span>Points positifs</span>
          </h2>
          <div className="space-y-4">
            {result.feedback.map((item, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="bg-green-500 p-2 rounded-full mt-1">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <p className="text-gray-800 font-medium flex-1">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Improvements */}
        {result.improvements && result.improvements.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
              <div className="bg-orange-500 p-2 rounded-lg">
                <XCircle className="h-6 w-6 text-white" />
              </div>
              <span>Axes d'amélioration</span>
            </h2>
            <div className="space-y-4">
              {result.improvements.map((item, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <div className="bg-orange-500 p-2 rounded-full mt-1">
                    <XCircle className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-gray-800 font-medium flex-1">{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
            <div className="bg-primary-500 p-2 rounded-lg">
              <Target className="h-6 w-6 text-white" />
            </div>
            <span>Recommandations</span>
          </h2>
          <div className="space-y-4">
            {result.recommendations.map((item, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="bg-blue-500 p-2 rounded-full mt-1">
                  <Target className="h-4 w-4 text-white" />
                </div>
                <p className="text-gray-800 font-medium flex-1">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Premium Notice for non-authenticated users */}
        {!isAuthenticated && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-8 mb-10 relative overflow-hidden">
            <div className="relative flex items-start space-x-4">
              <div className="bg-yellow-500 p-3 rounded-xl">
                <Star className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-yellow-900 mb-3">
                  Continuez votre progression
                </h3>
                <p className="text-yellow-800 mb-6 text-lg">
                  Vous avez terminé votre session d'essai gratuite ! Découvrez nos formules pour accéder à des sessions illimitées, 
                  des analyses détaillées et un suivi personnalisé de vos progrès.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    to="/credits"
                    className="inline-flex items-center space-x-3 bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                  >
                    <Trophy className="h-5 w-5" />
                    <span>Découvrir les crédits</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onRestart}
            className="bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center space-x-3"
          >
            <RotateCcw className="h-6 w-6" />
            <span>Recommencer</span>
          </button>
          
          {isAuthenticated && (
            <Link
              to="/dashboard"
              className="bg-secondary-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-secondary-700 transition-colors flex items-center justify-center space-x-3"
            >
              <TrendingUp className="h-6 w-6" />
              <span>Voir mes progrès</span>
            </Link>
          )}
          
          <Link
            to="/"
            className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center justify-center space-x-3"
          >
            <Home className="h-6 w-6" />
            <span>Accueil</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SessionSummary;