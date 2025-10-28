import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Volume2, VolumeX, RefreshCw } from 'lucide-react';
import { TrainingConfig, SessionResult } from '../pages/Training';
import { RealtimeService, DetailedError } from '../services/realtimeService';
import { analyzeCall } from '../services/openai';

interface PhoneCallSimulatorProps {
  config: TrainingConfig;
  onCallComplete: (result: SessionResult) => void;
}

type CallState = 'dialing' | 'ringing' | 'connected' | 'ended';
type AIState = 'listening' | 'thinking' | 'speaking';

function PhoneCallSimulator({ config, onCallComplete }: PhoneCallSimulatorProps) {
  const [callState, setCallState] = useState<CallState>('dialing');
  const [aiState, setAIState] = useState<AIState>('speaking');
  const [callDuration, setCallDuration] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<DetailedError | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const realtimeService = useRef<RealtimeService | null>(null);
  const callStarted = useRef(false);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!callStarted.current) {
      callStarted.current = true;
      initiateCall();
    }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
      if (realtimeService.current) {
        realtimeService.current.endSession();
      }
    };
  }, []);

  useEffect(() => {
    if (callState === 'connected' && startTime) {
      timerInterval.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [callState, startTime]);

  const initiateCall = async () => {
    try {
      setCallState('ringing');

      await playRingtone();

      const contact = getContactInfo();
      realtimeService.current = new RealtimeService();

      realtimeService.current.onStateChange((state) => {
        console.log('📡 Connection state:', state);

        if (state === 'connected') {
          setCallState('connected');
          setStartTime(new Date());
          setError(null);
        } else if (state === 'disconnected' && callState !== 'ended') {
          const detailedError: DetailedError = {
            type: 'network_error',
            message: 'Connexion perdue',
            details: 'La connexion avec le serveur a été interrompue'
          };
          setError(detailedError);
        }
      });

      realtimeService.current.onError((detailedError) => {
        console.error('🚨 Detailed error:', detailedError);
        setError(detailedError);
      });

      realtimeService.current.onAIStateChange((state) => {
        setAIState(state);
      });

      realtimeService.current.onConversationUpdate((history) => {
        console.log('💬 Conversation updated:', history.length, 'messages');
      });

      await realtimeService.current.startSession({
        target: config.target,
        difficulty: config.difficulty,
        voice: contact.voice,
      });

    } catch (error: any) {
      console.error('❌ Error initiating call:', error);

      const lastError = realtimeService.current?.getLastError();
      if (lastError) {
        setError(lastError);
      } else {
        setError({
          type: 'unknown_error',
          message: 'Erreur inconnue',
          details: error.message || 'Une erreur inattendue s\'est produite'
        });
      }
      setCallState('ended');
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    setError(null);
    setCallState('dialing');
    callStarted.current = false;

    if (realtimeService.current) {
      await realtimeService.current.endSession();
    }

    await initiateCall();
    setIsRetrying(false);
  };

  const playRingtone = (): Promise<void> => {
    return new Promise((resolve) => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      const playTone = () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.15);

        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.3);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      };

      playTone();
      setTimeout(() => playTone(), 1000);
      setTimeout(() => playTone(), 2000);
      setTimeout(() => resolve(), 3000);
    });
  };

  const handleEndCall = async () => {
    const callEndTime = new Date();
    setCallState('ended');

    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }

    const finalDuration = startTime ? Math.floor((callEndTime.getTime() - startTime.getTime()) / 1000) : callDuration;
    setCallDuration(finalDuration);

    let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    if (realtimeService.current) {
      conversationHistory = realtimeService.current.getConversationHistory();
      await realtimeService.current.endSession();
    }

    try {
      const analysis = await analyzeCall(
        conversationHistory,
        config.target,
        config.difficulty,
        finalDuration
      );

      const result: SessionResult = {
        score: analysis.score,
        feedback: analysis.strengths,
        recommendations: analysis.recommendations,
        duration: finalDuration,
        detailedAnalysis: analysis.detailedFeedback,
        improvements: analysis.improvements
      };

      onCallComplete(result);
    } catch (error) {
      console.error('❌ Error analyzing call:', error);

      const userMessages = conversationHistory.filter(m => m.role === 'user');
      const totalWords = userMessages.reduce((total, msg) => total + msg.content.split(' ').length, 0);

      let fallbackScore = 0;
      if (userMessages.length === 0) fallbackScore = 0;
      else if (userMessages.length === 1 && totalWords < 10) fallbackScore = 15;
      else if (totalWords < 25) fallbackScore = 35;
      else fallbackScore = Math.min(60, 25 + userMessages.length * 5);

      const fallbackResult: SessionResult = {
        score: fallbackScore,
        feedback: fallbackScore > 30 ? [
          'Tu as participé à la conversation et montré de l\'engagement',
          'Effort de communication visible tout au long de l\'échange',
          'Tentative d\'interaction avec le prospect'
        ] : [
          'Participation minimale observée',
          'Présence dans la simulation'
        ],
        recommendations: [
          'Prépare une accroche percutante de 30 secondes avant chaque appel',
          'Structure ton discours commercial avec une trame claire (intro, découverte, proposition, conclusion)',
          'Entraîne-toi quotidiennement 15 minutes pour automatiser les réflexes commerciaux'
        ],
        duration: finalDuration,
        detailedAnalysis: {
          accroche_mise_en_confiance: {
            score: fallbackScore,
            commentaire: fallbackScore < 30 ? 'Accroche absente ou très insuffisante. Il est essentiel de se présenter clairement.' : 'Accroche présente mais nécessite plus de travail pour être percutante.'
          },
          ecoute_adaptation: {
            score: fallbackScore,
            commentaire: fallbackScore < 30 ? 'Pas d\'écoute active observable dans cet échange.' : 'Quelques signes d\'adaptation mais à renforcer.'
          },
          gestion_objections: {
            score: fallbackScore,
            commentaire: fallbackScore < 30 ? 'Aucune objection traitée dans cet appel.' : 'Traitement des objections à améliorer significativement.'
          },
          clarte_structure: {
            score: fallbackScore,
            commentaire: fallbackScore < 30 ? 'Structure commerciale inexistante ou très confuse.' : 'Structure présente mais manque de fluidité et de cohérence.'
          },
          conclusion_engagement: {
            score: fallbackScore,
            commentaire: fallbackScore < 30 ? 'Aucune tentative de conclusion ou de prise de rendez-vous.' : 'Conclusion faible, manque d\'engagement pour obtenir le rendez-vous.'
          },
          analyse_generale: fallbackScore < 30
            ? 'Performance très insuffisante pour un appel de prospection B2B. Il est impératif de travailler les fondamentaux : se présenter clairement, expliquer l\'objet de l\'appel, poser des questions de qualification et proposer un rendez-vous. Un appel de prospection doit durer au minimum 1 à 2 minutes pour être considéré comme complet. Prenez le temps de préparer votre discours et de vous entraîner régulièrement.'
            : fallbackScore < 50
              ? 'Performance insuffisante mais des bases sont présentes. Vous avez tenté d\'engager la conversation, ce qui est positif. Concentrez-vous maintenant sur la structure de votre discours commercial, la gestion des objections et surtout sur la conclusion avec proposition de rendez-vous. Continuez à vous entraîner pour gagner en aisance et en confiance.'
              : 'Performance correcte avec une marge de progression intéressante. Vous avez montré de bonnes bases en prospection téléphonique. Pour passer au niveau supérieur, travaillez sur la personnalisation de votre discours, l\'écoute active et la gestion fine des objections. Continuez à pratiquer régulièrement pour automatiser ces compétences.'
        },
        improvements: fallbackScore < 40 ? [
          'Conversation beaucoup trop courte pour être efficace en prospection B2B',
          'Manque total de structure commerciale (présentation, découverte, proposition)',
          'Engagement insuffisant et absence de tentative de prise de rendez-vous'
        ] : [
          'Améliorer significativement la gestion des objections avec des techniques d\'empathie et de rebond',
          'Développer les techniques de questionnement pour qualifier efficacement le prospect',
          'Renforcer le closing commercial en proposant systématiquement 2 créneaux de rendez-vous'
        ]
      };

      onCallComplete(fallbackResult);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getContactInfo = () => {
    const contactMap = {
      secretary: {
        name: 'Marie Dubois',
        title: 'Secrétaire',
        company: 'Entreprise ABC',
        avatar: '👩‍💼',
        color: 'from-blue-500 to-blue-600',
        voice: 'nova'
      },
      hr: {
        name: 'Pierre Martin',
        title: 'Directeur RH',
        company: 'Groupe XYZ',
        avatar: '👨‍💼',
        color: 'from-purple-500 to-purple-600',
        voice: 'onyx'
      },
      manager: {
        name: 'Sophie Laurent',
        title: 'Directrice',
        company: 'Innovation Corp',
        avatar: '👩‍💼',
        color: 'from-primary-500 to-primary-600',
        voice: 'shimmer'
      },
      sales: {
        name: 'Thomas Durand',
        title: 'Commercial',
        company: 'Vente Pro',
        avatar: '👨‍💼',
        color: 'from-accent-500 to-accent-600',
        voice: 'echo'
      }
    };
    return contactMap[config.target as keyof typeof contactMap] || contactMap.secretary;
  };

  const contact = getContactInfo();

  const getCallStateText = () => {
    switch (callState) {
      case 'dialing': return 'Composition...';
      case 'ringing': return 'Sonnerie...';
      case 'connected': return 'En cours';
      case 'ended': return 'Terminé';
    }
  };

  const getCallStateColor = () => {
    switch (callState) {
      case 'dialing': return 'text-yellow-400';
      case 'ringing': return 'text-blue-400';
      case 'connected': return 'text-green-400';
      case 'ended': return 'text-red-400';
    }
  };

  const getAIStateText = () => {
    switch (aiState) {
      case 'listening': return 'L\'IA vous écoute...';
      case 'thinking': return 'L\'IA réfléchit...';
      case 'speaking': return 'L\'IA parle...';
    }
  };

  const getAIStateColor = () => {
    switch (aiState) {
      case 'listening': return 'bg-green-900/50 border-green-500';
      case 'thinking': return 'bg-blue-900/50 border-blue-500';
      case 'speaking': return 'bg-purple-900/50 border-purple-500';
    }
  };

  const getAIStateTextColor = () => {
    switch (aiState) {
      case 'listening': return 'text-green-300';
      case 'thinking': return 'text-blue-300';
      case 'speaking': return 'text-purple-300';
    }
  };

  const getAIStateDotColor = () => {
    switch (aiState) {
      case 'listening': return 'bg-green-400';
      case 'thinking': return 'bg-blue-400';
      case 'speaking': return 'bg-purple-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm mx-auto">
        <div className="bg-gray-900 rounded-3xl shadow-2xl border border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-6 py-4 text-center">
            <div className={`text-sm font-medium ${getCallStateColor()}`}>
              {getCallStateText()}
            </div>
            <div className="text-white text-lg font-semibold mt-1">
              {formatTime(callDuration)}
            </div>
          </div>

          <div className="px-8 py-12 text-center">
            <div className="mb-6">
              <div className={`w-32 h-32 mx-auto rounded-full bg-gradient-to-br ${contact.color} flex items-center justify-center text-6xl shadow-2xl transition-all duration-300`}>
                {contact.avatar}
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
              {contact.name}
            </h2>
            <p className="text-gray-300 text-lg mb-1">
              {contact.title}
            </p>
            <p className="text-gray-400">
              {contact.company}
            </p>

            <div className="mt-8 space-y-3">
              {callState === 'ringing' && (
                <div className="flex items-center justify-center space-x-2 text-blue-400">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              )}

              {callState === 'connected' && (
                <div className={`rounded-lg p-3 border ${getAIStateColor()}`}>
                  <div className={`flex items-center justify-center space-x-2 ${getAIStateTextColor()}`}>
                    <div className={`w-2 h-2 rounded-full animate-bounce ${getAIStateDotColor()}`}></div>
                    <div className={`w-2 h-2 rounded-full animate-bounce ${getAIStateDotColor()}`} style={{ animationDelay: '0.1s' }}></div>
                    <div className={`w-2 h-2 rounded-full animate-bounce ${getAIStateDotColor()}`} style={{ animationDelay: '0.2s' }}></div>
                    <span className="ml-2 text-sm">
                      {getAIStateText()}
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 space-y-2">
                  <p className="text-red-200 font-semibold text-sm">{error.message}</p>
                  {error.details && (
                    <p className="text-red-300 text-xs">{error.details}</p>
                  )}
                  {callState === 'ended' && (
                    <button
                      onClick={handleRetry}
                      disabled={isRetrying}
                      className="mt-2 w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                      <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
                      <span>{isRetrying ? 'Reconnexion...' : 'Réessayer'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="px-8 pb-8">
            <div className="flex justify-center space-x-6">
              {callState === 'connected' && (
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-4 rounded-full transition-all duration-300 ${
                    isMuted
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {isMuted ? (
                    <VolumeX className="h-6 w-6 text-white" />
                  ) : (
                    <Volume2 className="h-6 w-6 text-white" />
                  )}
                </button>
              )}

              <button
                onClick={handleEndCall}
                disabled={callState === 'ended'}
                className="bg-red-500 hover:bg-red-600 disabled:bg-gray-600 p-4 rounded-full transition-all duration-300 hover:scale-110 disabled:scale-100"
              >
                <PhoneOff className="h-8 w-8 text-white" />
              </button>
            </div>

            <div className="text-center mt-6">
              <p className="text-gray-400 text-sm">
                {aiState === 'thinking'
                  ? 'Patientez pendant que l\'IA prépare sa réponse'
                  : aiState === 'speaking'
                    ? 'Écoutez attentivement la réponse de l\'IA'
                    : 'À votre tour ! Parlez naturellement'
                }
              </p>
            </div>
          </div>
        </div>

        {callState === 'dialing' && (
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Préparation de l'appel en cours...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PhoneCallSimulator;
