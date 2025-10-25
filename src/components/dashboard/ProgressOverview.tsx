import React, { useState } from 'react';
import { LineChart } from '../charts/LineChart';
import { BarChart3, Award, TrendingUp, Filter } from 'lucide-react';

interface SessionData {
  id: string;
  score: number;
  created_at: string;
  difficulty: string;
}

interface ProgressOverviewProps {
  sessions: SessionData[];
}

type FilterPeriod = '7' | '30' | 'all';
type FilterDifficulty = 'all' | 'easy' | 'medium' | 'hard';

export function ProgressOverview({ sessions }: ProgressOverviewProps) {
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('30');
  const [filterDifficulty, setFilterDifficulty] = useState<FilterDifficulty>('all');

  const filterSessions = (sessions: SessionData[]) => {
    let filtered = [...sessions];

    if (filterPeriod !== 'all') {
      const days = parseInt(filterPeriod);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filtered = filtered.filter(s => new Date(s.created_at) >= cutoffDate);
    }

    if (filterDifficulty !== 'all') {
      filtered = filtered.filter(s => s.difficulty === filterDifficulty);
    }

    return filtered;
  };

  const filteredSessions = filterSessions(sessions);
  const sortedSessions = [...filteredSessions].sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const last10Sessions = sortedSessions.slice(-10);

  const chartData = last10Sessions.map((session, index) => ({
    label: `S${index + 1}`,
    value: session.score
  }));

  const averageScore = filteredSessions.length > 0
    ? Math.round(filteredSessions.reduce((sum, s) => sum + s.score, 0) / filteredSessions.length)
    : 0;

  const bestScore = filteredSessions.length > 0
    ? Math.max(...filteredSessions.map(s => s.score))
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Vue globale de progression</h2>
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value as FilterPeriod)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">7 derniers jours</option>
            <option value="30">30 derniers jours</option>
            <option value="all">Toutes les sessions</option>
          </select>
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value as FilterDifficulty)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Toutes difficultés</option>
            <option value="easy">Facile</option>
            <option value="medium">Moyen</option>
            <option value="hard">Difficile</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center space-x-3 mb-2">
            <div className="bg-blue-500 p-2 rounded-lg">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
              Sessions totales
            </span>
          </div>
          <p className="text-4xl font-bold text-blue-900">{filteredSessions.length}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <div className="flex items-center space-x-3 mb-2">
            <div className="bg-green-500 p-2 rounded-lg">
              <Award className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-semibold text-green-700 uppercase tracking-wide">
              Score moyen
            </span>
          </div>
          <p className="text-4xl font-bold text-green-900">{averageScore}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
          <div className="flex items-center space-x-3 mb-2">
            <div className="bg-purple-500 p-2 rounded-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-semibold text-purple-700 uppercase tracking-wide">
              Meilleur score
            </span>
          </div>
          <p className="text-4xl font-bold text-purple-900">{bestScore}</p>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Évolution du score (10 dernières sessions)
        </h3>
        {chartData.length > 0 ? (
          <LineChart data={chartData} height={250} color="#3b82f6" />
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-400">
            Aucune donnée disponible pour cette période
          </div>
        )}
      </div>
    </div>
  );
}
