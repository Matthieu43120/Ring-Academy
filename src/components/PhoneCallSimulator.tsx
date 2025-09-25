import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Volume2, VolumeX } from 'lucide-react';
import { TrainingConfig, SessionResult } from '../pages/Training';
import { generateAIResponseFast, analyzeCall, ConversationContext } from '../services/openai';
import { phoneCallService } from '../services/phoneCallService';

interface PhoneCallSimulatorProps {
  config: TrainingConfig;
  onCallComplete: (result: SessionResult) => void;
}

type CallState = 'dialing' | 'ringing' | 'connected' | 'ended';

function PhoneCallSimulator({ config, onCallComplete }: PhoneCallSimulatorProps) {
  const [callState, setCallState] = useState<CallState>('dialing');
  const [callDuration, setCallDuration] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [partialAIText, setPartialAIText] = useState('');
  
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    target: config.target,
    difficulty: config.difficulty,
    conversationHistory: []
  });

  // ULTRA-OPTIMISATION: Refs pour éviter les race conditions
  const callStateRef = useRef<CallState>('dialing');
  const processingResponseRef = useRef(false);
  const callStarted = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // REF CRITIQUE: Historique de conversation en temps réel
  const conversationHistoryRef = useRef<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  // Synchroniser les refs avec les states
  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  useEffect(() => {
    conversationHistoryRef.current = conversationContext.conversationHistory;
  }, [conversationContext.conversationHistory]);

  // Timer de l'appel
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callState === 'connected' && startTime) {
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState, startTime]);

  // Démarrer l'appel
  useEffect(() => {
    if (!callStarted.current) {
      callStarted.current = true;
      initiateCall();
    }
  }, []);

  const initiateCall = async () => {
    try {
      setCallState('ringing');
      callStateRef.current = 'ringing';
      
      // Jouer la sonnerie
      await phoneCallService.playRingtone();
      
      // L'IA décroche - UTILISER LES REFS pour éviter les race conditions
      setCallState('connected');
      callStateRef.current = 'connected'; // CRITIQUE: Mettre à jour la ref immédiatement
      setStartTime(new Date());
      
      // Première réponse de l'IA (obligatoire "Allô ?")
      await handleFirstAIResponse();
      
      // ULTRA-OPTIMISATION: Activation micro immédiate
      setTimeout(async () => {
        if (phoneCallService.isSupported()) {
          await phoneCallService.startContinuousRecording(handleUserSpeech);
        } else {
          setError('Microphone non supporté. Utilisez un navigateur compatible.');
        }
      }, 25); // ULTRA-RÉDUCTION: 50ms → 25ms
      
    } catch (error) {
      setError('Impossible de démarrer l\'appel. Vérifiez vos permissions microphone.');
    }
  };

  const handleFirstAIResponse = async () => {
    setError(null);
    setIsAISpeaking(true);
    setAiThinking(true);

    try {
      // Préparer le contexte pour la première réponse
      const context: ConversationContext = {
        target: config.target,
        difficulty: config.difficulty,
        conversationHistory: []
      };
      
      // Générer la réponse IA
      const aiResponse = await generateAIResponseFast(
        context,
        true, // isFirstMessage
        (finalText) => {
          // Callback quand le texte final est prêt
          console.log('✅ Texte IA final reçu:', finalText);
          setAiThinking(false);
          setPartialAIText('');
        },
        (partialText) => {
          // Callback pour le texte partiel (feedback visuel)
          setPartialAIText(partialText);
          setAiThinking(false); // Désactiver "L'IA réfléchit" dès le premier texte
        },
        (sentence) => {
        // Callback quand une phrase est prête
          console.log('🎵 Phrase IA prête:', sentence);
        }
      );

      // CRITIQUE: Ajouter à l'historique ET à la ref
      const newHistory = [{ role: 'assistant' as const, content: aiResponse.message }];
      setConversationContext(prev => ({
        ...prev,
        conversationHistory: newHistory
      }));
      conversationHistoryRef.current = newHistory;

      // Jouer l'audio avec la meilleure méthode disponible
      if (!isMuted) {
        const { playTextImmediately } = await import('../services/openai');
        playTextImmediately(aiResponse.message).then(() => {
          // CRITIQUE: Informer que l'IA a fini de parler
          phoneCallService.setAISpeaking(false);
          setIsAISpeaking(false);
        }).catch((error) => {
          console.error('❌ Erreur synthèse:', error);
          phoneCallService.setAISpeaking(false);
          setIsAISpeaking(false);
        });
      } else {
        setTimeout(() => {
          phoneCallService.setAISpeaking(false);
          setIsAISpeaking(false);
        }, 1000);
      }

    } catch (error) {
      setAiThinking(false);
      setError('Erreur de connexion avec l\'IA.');
      
      // Fallback ultime
      if (!isMuted) {
        phoneCallService.setAISpeaking(true);
        const { playTextImmediately } = await import('../services/openai');
        playTextImmediately("Allô ?").then(() => {
            phoneCallService.setAISpeaking(false);
            setIsAISpeaking(false);
          }).catch(() => {
            phoneCallService.setAISpeaking(false);
            setIsAISpeaking(false);
          });
      } else {
        setIsAISpeaking(false);
      }
    }
  };

  const handleUserSpeech = async (transcript: string) => {
    // UTILISER LES REFS pour les vérifications d'état
    if (callStateRef.current !== 'connected') {
      return;
    }

    if (processingResponseRef.current) {
      return;
    }

    // CRITIQUE: Ajouter la transcription à l'historique ET à la ref
    const userMessage = { role: 'user' as const, content: transcript };
    const updatedHistory = [...conversationHistoryRef.current, userMessage];
    
    setConversationContext(prev => ({
      ...prev,
      conversationHistory: updatedHistory
    }));
    conversationHistoryRef.current = updatedHistory;
    
    // ULTRA-OPTIMISATION: Réponse IA immédiate
    setTimeout(() => {
      handleAIResponse();
    }, 10); // ULTRA-RÉDUCTION: 15ms → 10ms pour réactivité maximale
  };

  const handleAIResponse = async () => {
    if (callStateRef.current !== 'connected') {
      return;
    }

    if (processingResponseRef.current) {
      return;
    }

    processingResponseRef.current = true;
    setError(null);
    setIsAISpeaking(true);
    phoneCallService.setAISpeaking(true); // CRITIQUE: Informer le service immédiatement
    setAiThinking(true);
    setPartialAIText('');

    try {
      // CRITIQUE: Utiliser l'historique de la ref (le plus à jour)
      const contextForAI: ConversationContext = {
        target: config.target,
        difficulty: config.difficulty,
        conversationHistory: conversationHistoryRef.current
      };
      
      // Générer la réponse IA
      const aiResponse = await generateAIResponseFast(
        contextForAI,
        false,
        (finalText) => {
          // Callback quand le texte final est prêt
          console.log('✅ Texte IA final reçu:', finalText);
          setAiThinking(false);
          setPartialAIText('');
        },
        (partialText) => {
          // Callback pour le texte partiel (feedback visuel)
          setPartialAIText(partialText);
          setAiThinking(false); // Désactiver "L'IA réfléchit" dès le premier texte
        },
        (sentence) => {
          // Callback quand une phrase complète est prête pour l'audio
          console.log('🎵 Phrase IA prête:', sentence);
        }
      );
      

      // CRITIQUE: Ajouter la réponse IA à l'historique ET à la ref
      const aiMessage = { role: 'assistant' as const, content: aiResponse.message };
      const updatedHistory = [...conversationHistoryRef.current, aiMessage];
      
      setConversationContext(prev => ({
        ...prev,
        conversationHistory: updatedHistory
      }));
      conversationHistoryRef.current = updatedHistory;
      
      // NOUVEAU: Attendre que l'audio soit terminé avant de libérer
      setTimeout(() => {
        phoneCallService.setAISpeaking(false);
        setIsAISpeaking(false);
        setPartialAIText('');
        processingResponseRef.current = false;
      }, 2000); // AUGMENTATION: 1000ms → 2000ms pour laisser plus de temps à l'audio

      // Terminer l'appel si demandé par l'IA
      if (aiResponse.shouldEndCall) {
        // CORRECTION: Terminer avec délai pour laisser l'audio finir
        setTimeout(() => {
          handleEndCall();
        }, 3000); // Délai pour que l'audio se termine
      }

    } catch (error) {
      console.error('❌ Erreur handleAIResponse:', error);
      setPartialAIText('');
      setError('Erreur de connexion avec l\'IA.');
      
      // Fallback avec synthèse vocale
      const fallbackMessage = "Pardon ?";
      if (!isMuted) {
        const { playTextImmediately } = await import('../services/openai');
        playTextImmediately(fallbackMessage).then(() => {
          phoneCallService.setAISpeaking(false);
          setIsAISpeaking(false);
        }).catch(() => {
          phoneCallService.setAISpeaking(false);
          setIsAISpeaking(false);
        });
      } else {
        setIsAISpeaking(false);
        phoneCallService.setAISpeaking(false);
      }
      
      // Ajouter le message de fallback à l'historique
      const fallbackAIMessage = { role: 'assistant' as const, content: fallbackMessage };
      const updatedHistory = [...conversationHistoryRef.current, fallbackAIMessage];
      
      setConversationContext(prev => ({
        ...prev,
        conversationHistory: updatedHistory
      }));
      conversationHistoryRef.current = updatedHistory;
    } finally {
      // CRITIQUE : Toujours remettre les états à false
      processingResponseRef.current = false;
      setAiThinking(false);
    }
  };

  const handleEndCall = async () => {
    const callEndTime = new Date();
    setEndTime(callEndTime);
    setCallState('ended');
    callStateRef.current = 'ended';
    phoneCallService.stopRecording();

    // Calculer la durée finale précise
    const finalDuration = startTime ? Math.floor((callEndTime.getTime() - startTime.getTime()) / 1000) : callDuration;
    setCallDuration(finalDuration);

    // Arrêter tout audio en cours
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis.cancel();

    // Analyser l'appel avec l'IA STRICTE
    try {
      const analysis = await analyzeCall(
        conversationHistoryRef.current, // Utiliser la ref pour l'historique le plus récent
        config.target,
        config.difficulty,
        callDuration
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
      // Analyse de fallback STRICTE
      const userMessages = conversationHistoryRef.current.filter(m => m.role === 'user');
      const totalWords = userMessages.reduce((total, msg) => total + msg.content.split(' ').length, 0);
      
      // SCORING STRICT pour fallback
      let fallbackScore = 0;
      if (userMessages.length === 0) fallbackScore = 0;
      else if (userMessages.length === 1 && totalWords < 10) fallbackScore = 15;
      else if (totalWords < 25) fallbackScore = 35;
      else fallbackScore = Math.min(60, 25 + userMessages.length * 5);

      const fallbackResult: SessionResult = {
        score: fallbackScore,
        feedback: fallbackScore > 30 ? [
          'Tu as participé à la conversation',
          'Effort de communication visible'
        ] : [],
        recommendations: [
          'Prépare une accroche de 30 secondes',
          'Structure ton discours commercial',
          'Entraîne-toi quotidiennement'
        ],
        duration: finalDuration,
        detailedAnalysis: `Performance ${fallbackScore < 30 ? 'très insuffisante' : fallbackScore < 50 ? 'insuffisante' : 'correcte'}. ${fallbackScore < 30 ? 'Il faut au minimum te présenter et expliquer l\'objet de l\'appel.' : 'Continue à t\'entraîner pour améliorer ta technique commerciale.'}`,
        improvements: fallbackScore < 40 ? [
          'Conversation trop courte',
          'Manque de structure commerciale',
          'Pas assez d\'engagement'
        ] : [
          'Gestion des objections',
          'Techniques de questionnement',
          'Closing commercial'
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
        color: 'from-blue-500 to-blue-600' 
      },
      hr: { 
        name: 'Pierre Martin', 
        title: 'Directeur RH', 
        company: 'Groupe XYZ',
        avatar: '👨‍💼',
        color: 'from-purple-500 to-purple-600' 
      },
      manager: { 
        name: 'Sophie Laurent', 
        title: 'Directrice', 
        company: 'Innovation Corp',
        avatar: '👩‍💼',
        color: 'from-primary-500 to-primary-600' 
      },
      sales: { 
        name: 'Thomas Durand', 
        title: 'Commercial', 
        company: 'Vente Pro',
        avatar: '👨‍💼',
        color: 'from-accent-500 to-accent-600' 
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm mx-auto">
        {/* Interface d'appel téléphonique */}
        <div className="bg-gray-900 rounded-3xl shadow-2xl border border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-6 py-4 text-center">
            <div className={`text-sm font-medium ${getCallStateColor()}`}>
              {getCallStateText()}
            </div>
            <div className="text-white text-lg font-semibold mt-1">
              {formatTime(callDuration)}
            </div>
          </div>

          {/* Contact Info */}
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

            {/* Status indicators */}
            <div className="mt-8 space-y-3">
              {callState === 'ringing' && (
                <div className="flex items-center justify-center space-x-2 text-blue-400">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              )}

              {aiThinking && callState === 'connected' && (
                <div className="bg-blue-900/50 border border-blue-500 rounded-lg p-3">
                  <div className="flex items-center justify-center space-x-2 text-blue-300">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <span className="ml-2 text-sm">L'IA réfléchit...</span>
                  </div>
                </div>
              )}

              {partialAIText && callState === 'connected' && (
                <div className="bg-green-900/50 border border-green-500 rounded-lg p-3">
                  <p className="text-green-300 text-sm text-center">
                    💬 {partialAIText}...
                  </p>
                </div>
              )}
              {error && (
                <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 mt-4">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
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
                {aiThinking ? 'L\'IA génère sa réponse...' : 'Parlez naturellement, l\'IA vous écoute'}
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
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