import React, { useState } from 'react';
import { useEffect } from 'react';
import TrainingForm from '../components/TrainingForm';
import PhoneCallSimulator from '../components/PhoneCallSimulator';
import SessionSummary from '../components/SessionSummary';
import { useAuth } from '../contexts/AuthContext';
import { AlertTriangle, Play, Gift, Mic, MicOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { phoneCallService } from '../services/phoneCallService';

export interface TrainingConfig {
  target: string;
  difficulty: string;
}

export interface SessionResult {
  score: number;
  feedback: string[];
  recommendations: string[];
  duration: number;
  detailedAnalysis?: string;
  improvements?: string[];
  criteriaScores?: {
    accroche: number;
    ecoute: number;
    objections: number;
    clarte: number;
    conclusion: number;
  };
  recurrentErrors?: string[];
  mainObjective?: string;
}

function Training() {
  const [currentStep, setCurrentStep] = useState<'config' | 'call' | 'summary'>('config');
  const [trainingConfig, setTrainingConfig] = useState<TrainingConfig | null>(null);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [hasMicrophonePermission, setHasMicrophonePermission] = useState<boolean | null>(null);
  const { user, saveSession, useCreditForSimulation, canUseFreeTrial, useFreeTrial, getCreditsInfo } = useAuth();

  const creditsInfo = getCreditsInfo();
  const hasCredits = creditsInfo.simulationsLeft > 0;
  const canUseTrial = canUseFreeTrial();

  // Demander la permission du microphone dès le chargement de la page
  useEffect(() => {
    const requestPermission = async () => {
      if (phoneCallService.isSupported()) {
        const hasPermission = await phoneCallService.requestMicrophonePermission();
        setHasMicrophonePermission(hasPermission);
      } else {
        setHasMicrophonePermission(false);
      }
    };

    requestPermission();
  }, []);

  const handleStartTraining = async (config: TrainingConfig) => {
    if (user) {
      // Utilisateur connecté : vérifier et utiliser un crédit
      const creditUsed = await useCreditForSimulation();
      if (!creditUsed) {
        return; // Empêcher le démarrage si pas de crédit
      }
    } else {
      // Visiteur : vérifier l'essai gratuit
      if (!canUseTrial) {
        return; // Empêcher le démarrage si essai déjà utilisé
      }
      useFreeTrial();
    }

    setTrainingConfig(config);
    setCurrentStep('call');
  };

  const handleCallComplete = (result: SessionResult) => {
    setSessionResult(result);
    setCurrentStep('summary');
    
    // Sauvegarder la session si l'utilisateur est connecté
    if (user && trainingConfig) {
      saveSession(result, trainingConfig);
    }
  };

  const handleRestart = () => {
    setCurrentStep('config');
    setTrainingConfig(null);
    setSessionResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Limitation de crédits */}
      {currentStep === 'config' && user && !hasCredits && (
        <div className="bg-red-50 border-2 border-red-200 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start space-x-4">
              <div className="bg-red-500 p-2 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900 mb-2">
                  {user.organizationRole === 'member' 
                    ? 'Votre organisation n\'a plus de crédits'
                    : 'Plus de simulations disponibles'
                  }
                </h3>
                <p className="text-red-800 mb-4">
                  {user.organizationRole === 'member'
                    ? 'Contactez le propriétaire de votre organisation pour recharger les crédits.'
                    : 'Rechargez vos crédits pour continuer les simulations.'
                  }
                </p>
                {user.organizationRole !== 'member' && (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link to="/credits" className="bg-slate-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-700 transition-colors inline-flex items-center space-x-2"
                    >
                      <Play className="h-5 w-5" />
                      <span>Recharger en crédits</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Essai gratuit pour visiteurs */}
      {currentStep === 'config' && !user && !canUseTrial && (
        <div className="bg-orange-50 border-2 border-orange-200 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start space-x-4">
              <div className="bg-orange-500 p-2 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-orange-900 mb-2">
                  Essai gratuit utilisé
                </h3>
                <p className="text-orange-800 mb-4">
                  Vous avez déjà utilisé votre essai gratuit. Créez un compte pour continuer les simulations.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/register" className="bg-slate-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-700 transition-colors inline-flex items-center space-x-2"
                  >
                    <Play className="h-5 w-5" />
                    <span>Créer mon compte</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message essai gratuit disponible */}
      {currentStep === 'config' && !user && canUseTrial && (
        <div className="bg-green-50 border-2 border-green-200 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start space-x-4">
              <div className="bg-green-500 p-2 rounded-lg">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-900 mb-2">
                  Essai gratuit disponible
                </h3>
                <p className="text-green-800 mb-4">
                  Testez gratuitement notre simulation d'appel ! Après votre essai, créez un compte pour accéder à plus de simulations.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerte permission microphone */}
      {currentStep === 'config' && hasMicrophonePermission === false && (
        <div className="bg-red-50 border-2 border-red-200 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start space-x-4">
              <div className="bg-red-500 p-2 rounded-lg">
                <MicOff className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900 mb-2">
                  Accès au microphone requis
                </h3>
                <p className="text-red-800 mb-4">
                  Pour utiliser les simulations d'appel, vous devez autoriser l'accès au microphone. 
                  Veuillez actualiser la page et autoriser l'accès lorsque votre navigateur vous le demande.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors inline-flex items-center space-x-2"
                  >
                    <Mic className="h-5 w-5" />
                    <span>Actualiser et autoriser</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation permission microphone */}
      {currentStep === 'config' && hasMicrophonePermission === true && (hasCredits || canUseTrial) && (
        <div className="bg-green-50 border-b border-green-200 p-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center space-x-2 text-green-800">
              <Mic className="h-5 w-5" />
              <span className="font-semibold">Microphone autorisé - Prêt pour la simulation</span>
            </div>
          </div>
        </div>
      )}

      {/* Indicateur de crédits restants */}
      {currentStep === 'config' && user && hasCredits && (
        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-blue-800">
              <span className="font-semibold">
                Simulations restantes: {creditsInfo.simulationsLeft}
              </span>
              {creditsInfo.simulationsLeft <= 5 && user.organizationRole !== 'member' && (
                <span className="ml-2 text-orange-700">
                  • <Link to="/credits" className="underline hover:text-orange-900">Rechargez vos crédits</Link> avant qu'ils s'épuisent
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {currentStep === 'config' && (hasCredits || canUseTrial) && hasMicrophonePermission === true && (
        <div className="py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <TrainingForm 
              onStartTraining={handleStartTraining} 
              hasMicrophonePermission={hasMicrophonePermission}
            />
          </div>
        </div>
      )}
      
      {currentStep === 'call' && trainingConfig && (
        <PhoneCallSimulator 
          config={trainingConfig} 
          onCallComplete={handleCallComplete}
        />
      )}
      
      {currentStep === 'summary' && sessionResult && (
        <div className="py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <SessionSummary 
              result={sessionResult} 
              onRestart={handleRestart}
              isAuthenticated={!!user}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Training;