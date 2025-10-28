import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader, Mic, Wifi, Key } from 'lucide-react';

interface DiagnosticResult {
  name: string;
  status: 'checking' | 'success' | 'warning' | 'error';
  message: string;
  details?: string;
}

function DiagnosticPanel() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([
    {
      name: 'Permissions Microphone',
      status: 'checking',
      message: 'Vérification en cours...'
    },
    {
      name: 'Configuration API',
      status: 'checking',
      message: 'Vérification en cours...'
    },
    {
      name: 'Connexion Réseau',
      status: 'checking',
      message: 'Vérification en cours...'
    }
  ]);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    await checkMicrophonePermissions();
    await checkAPIConfiguration();
    await checkNetworkConnection();
  };

  const checkMicrophonePermissions = async () => {
    try {
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });

      if (permissionStatus.state === 'denied') {
        updateDiagnostic('Permissions Microphone', {
          status: 'error',
          message: 'Permissions refusées',
          details: 'Cliquez sur l\'icône de cadenas dans la barre d\'adresse pour autoriser le microphone'
        });
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());

        updateDiagnostic('Permissions Microphone', {
          status: 'success',
          message: 'Microphone accessible',
          details: 'Permissions accordées et microphone détecté'
        });
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          updateDiagnostic('Permissions Microphone', {
            status: 'error',
            message: 'Permissions refusées',
            details: 'Veuillez autoriser l\'accès au microphone'
          });
        } else if (err.name === 'NotFoundError') {
          updateDiagnostic('Permissions Microphone', {
            status: 'error',
            message: 'Aucun microphone détecté',
            details: 'Veuillez brancher un microphone'
          });
        } else {
          updateDiagnostic('Permissions Microphone', {
            status: 'error',
            message: 'Erreur inconnue',
            details: err.message
          });
        }
      }
    } catch (err: any) {
      updateDiagnostic('Permissions Microphone', {
        status: 'warning',
        message: 'Impossible de vérifier',
        details: 'Votre navigateur ne supporte pas cette fonctionnalité'
      });
    }
  };

  const checkAPIConfiguration = async () => {
    try {
      const response = await fetch('/.netlify/functions/openai-realtime-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: 'secretary',
          difficulty: 'easy',
          voice: 'nova'
        }),
      });

      if (response.status === 500) {
        const data = await response.json();
        if (data.error?.includes('API key') || data.details?.includes('API')) {
          updateDiagnostic('Configuration API', {
            status: 'error',
            message: 'Clé API non configurée',
            details: 'La variable OPENAI_API_KEY doit être configurée dans Netlify'
          });
          return;
        }
      }

      if (response.ok) {
        updateDiagnostic('Configuration API', {
          status: 'success',
          message: 'Configuration correcte',
          details: 'L\'API OpenAI est accessible'
        });
      } else if (response.status === 401 || response.status === 403) {
        updateDiagnostic('Configuration API', {
          status: 'error',
          message: 'Clé API invalide',
          details: 'Vérifiez la clé OPENAI_API_KEY dans les variables d\'environnement Netlify'
        });
      } else {
        updateDiagnostic('Configuration API', {
          status: 'warning',
          message: `Erreur HTTP ${response.status}`,
          details: 'Vérifiez la configuration de l\'API'
        });
      }
    } catch (err: any) {
      updateDiagnostic('Configuration API', {
        status: 'error',
        message: 'Impossible de vérifier',
        details: err.message
      });
    }
  };

  const checkNetworkConnection = async () => {
    try {
      const startTime = Date.now();
      const response = await fetch('https://api.openai.com/', { method: 'HEAD' });
      const latency = Date.now() - startTime;

      if (response.ok || response.status === 404) {
        updateDiagnostic('Connexion Réseau', {
          status: 'success',
          message: 'Connexion stable',
          details: `Latence: ${latency}ms`
        });
      } else {
        updateDiagnostic('Connexion Réseau', {
          status: 'warning',
          message: 'Connexion lente',
          details: `Latence élevée: ${latency}ms`
        });
      }
    } catch (err: any) {
      updateDiagnostic('Connexion Réseau', {
        status: 'error',
        message: 'Pas de connexion',
        details: 'Impossible de contacter OpenAI'
      });
    }
  };

  const updateDiagnostic = (name: string, update: Partial<DiagnosticResult>) => {
    setDiagnostics(prev =>
      prev.map(d => (d.name === name ? { ...d, ...update } : d))
    );
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'checking':
        return <Loader className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getIcon = (name: string) => {
    if (name.includes('Microphone')) return <Mic className="h-5 w-5" />;
    if (name.includes('API')) return <Key className="h-5 w-5" />;
    if (name.includes('Réseau')) return <Wifi className="h-5 w-5" />;
    return null;
  };

  const allSuccess = diagnostics.every(d => d.status === 'success');
  const hasError = diagnostics.some(d => d.status === 'error');

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Diagnostic du Système
      </h2>

      <div className="space-y-4 mb-6">
        {diagnostics.map((diagnostic) => (
          <div
            key={diagnostic.name}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="text-gray-600 mt-1">
                  {getIcon(diagnostic.name)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {diagnostic.name}
                  </h3>
                  <p className="text-sm text-gray-700">{diagnostic.message}</p>
                  {diagnostic.details && (
                    <p className="text-xs text-gray-500 mt-1">
                      {diagnostic.details}
                    </p>
                  )}
                </div>
              </div>
              <div className="ml-4">
                {getStatusIcon(diagnostic.status)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button
          onClick={runDiagnostics}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors duration-300 flex items-center space-x-2"
        >
          <Loader className="h-4 w-4" />
          <span>Relancer le diagnostic</span>
        </button>

        {allSuccess && (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="font-semibold">Tout est prêt!</span>
          </div>
        )}

        {hasError && (
          <div className="flex items-center space-x-2 text-red-600">
            <XCircle className="h-5 w-5" />
            <span className="font-semibold">Problèmes détectés</span>
          </div>
        )}
      </div>

      {hasError && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">
            Actions recommandées:
          </h4>
          <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
            {diagnostics
              .filter(d => d.status === 'error')
              .map(d => (
                <li key={d.name}>
                  {d.name}: {d.details || d.message}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default DiagnosticPanel;
