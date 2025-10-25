import React from 'react';
import { AlertCircle, XCircle } from 'lucide-react';

interface SessionData {
  id: string;
  recurrent_errors: string[] | null;
  created_at: string;
}

interface RecurrentErrorsProps {
  sessions: SessionData[];
}

export function RecurrentErrors({ sessions }: RecurrentErrorsProps) {
  const last5Sessions = sessions.slice(-5);
  const sessionsWithErrors = last5Sessions.filter(s => s.recurrent_errors && s.recurrent_errors.length > 0);

  if (sessionsWithErrors.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Évolution des axes de progrès</h2>
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <p className="text-green-800 font-medium">
            Aucune erreur récurrente détectée sur vos dernières sessions !
          </p>
          <p className="text-green-600 text-sm mt-2">
            Continuez à vous entraîner pour maintenir ce niveau.
          </p>
        </div>
      </div>
    );
  }

  const errorCounts: Record<string, number> = {};

  sessionsWithErrors.forEach(session => {
    session.recurrent_errors?.forEach(error => {
      errorCounts[error] = (errorCounts[error] || 0) + 1;
    });
  });

  const sortedErrors = Object.entries(errorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Évolution des axes de progrès</h2>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-amber-800">
          <strong>Top {sortedErrors.length} erreurs récurrentes</strong> sur les 5 dernières sessions.
          Ces points nécessitent votre attention pour progresser.
        </p>
      </div>

      <div className="space-y-4">
        {sortedErrors.map(([error, count], index) => {
          const percentage = (count / sessionsWithErrors.length) * 100;
          const isFrequent = percentage >= 60;

          return (
            <div
              key={index}
              className={`p-5 rounded-xl border-2 transition-all ${
                isFrequent
                  ? 'bg-red-50 border-red-300'
                  : 'bg-orange-50 border-orange-200'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`${isFrequent ? 'bg-red-500' : 'bg-orange-500'} p-2 rounded-lg mt-1`}>
                  <XCircle className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className={`font-semibold ${isFrequent ? 'text-red-900' : 'text-orange-900'}`}>
                      {error}
                    </p>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      isFrequent
                        ? 'bg-red-200 text-red-800'
                        : 'bg-orange-200 text-orange-800'
                    }`}>
                      {count}/{sessionsWithErrors.length} sessions
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        isFrequent ? 'bg-red-500' : 'bg-orange-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  {isFrequent && (
                    <p className="text-sm text-red-700 mt-2">
                      <strong>Priorité haute :</strong> Cette erreur apparaît très fréquemment. Travaillez-la en priorité lors de votre prochaine session.
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Conseil pratique</h3>
        <p className="text-sm text-blue-800">
          Concentrez-vous sur une seule erreur à la fois. Lors de votre prochaine session,
          gardez en tête votre erreur prioritaire et travaillez consciemment à l'éviter.
        </p>
      </div>
    </div>
  );
}
