import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Phone, PhoneOff, Volume2, VolumeX } from 'lucide-react';
import { TrainingConfig, SessionResult } from '../pages/Training';
import { generateAIResponseFast, analyzeCall, ConversationContext, generateOpenAIAudioSync, playOpenAIAudioDirectly } from '../services/openai';
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
  
  const shouldEndCallAfterAudioRef = useRef(false);
  
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    target: config.target,
    difficulty: config.difficulty,
    conversationHistory: []
  });

  // Refs pour éviter les race conditions
  const callStateRef = useRef<CallState>('dialing');
  const processingResponseRef = useRef(false);
  const callStarted = useRef(false);
  
  // REF CRITIQUE: Historique de conversation en temps réel
  const conversationHistoryRef = useRef<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const handleFirstAIResponse = async () => {
    setError(null);
    setIsAISpeaking(true);
    phoneCallService.setAISpeaking(true);
    setAiThinking(true);
    
    // Réinitialiser les états
    shouldEndCallAfterAudioRef.current = false;

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
        async (finalText) => {
          // Callback quand le texte final est prêt
          console.log('✅ Texte IA final reçu:', finalText);
          setAiThinking(false);
          setPartialAIText('');
          
          // Générer et jouer l'audio complet
          if (!isMuted) {
            try {
              console.log('🎵 Génération audio pour la réponse complète...');
              const audioBuffer = await generateOpenAIAudioSync(finalText);
              console.log('🔊 Lecture de la réponse complète...');
              await playOpenAIAudioDirectly(audioBuffer);
              console.log('✅ Lecture audio terminée');
            } catch (error) {
              console.error('❌ Erreur audio:', error);
              // Fallback vers synthèse vocale
              const { playTextImmediately } = await import('../services/openai');
              await playTextImmediately(finalText);
            }
          }
          
          // Libérer le micro après l'audio
          phoneCallService.setAISpeaking(false);
          setIsAISpeaking(false);
          
          // Terminer l'appel si demandé
          if (shouldEndCallAfterAudioRef.current) {
            setTimeout(() => {
              handleEndCall();
            }, 500);
          }
        },
        (partialText) => {
          // Callback pour le texte partiel (feedback visuel)
          setPartialAIText(partialText);
          setAiThinking(false); // Désactiver "L'IA réfléchit" dès le premier texte
        }
      );

      // CRITIQUE: Ajouter à l'historique ET à la ref
      const newHistory = [{ role: 'assistant' as const, content: aiResponse.message }];
      setConversationContext(prev => ({ ...prev, conversationHistory: newHistory }));
      conversationHistoryRef.current = newHistory;

    } catch (error) {
      setAiThinking(false);
      setError('Erreur de connexion avec l\'IA.');
      
      // Fallback ultime
      if (!isMuted) {
        phoneCallService.setAISpeaking(true);
        const { playTextImmediately } = await import('../services/openai');
        await playTextImmediately("Allô ?");
      } else {
        phoneCallService.setAISpeaking(false);
        setIsAISpeaking(false);
      }
      phoneCallService.setAISpeaking(false);
      setIsAISpeaking(false);
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
    
    // Réinitialiser les états
    shouldEndCallAfterAudioRef.current = false;

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
        async (finalText) => {
          // Callback quand le texte final est prêt
          console.log('✅ Texte IA final reçu:', finalText);
          setAiThinking(false);
          setPartialAIText('');
          
          // Générer et jouer l'audio complet
          if (!isMuted) {
            try {
              console.log('🎵 Génération audio pour la réponse complète...');
              const audioBuffer = await generateOpenAIAudioSync(finalText);
              console.log('🔊 Lecture de la réponse complète...');
              await playOpenAIAudioDirectly(audioBuffer);
              console.log('✅ Lecture audio terminée');
            } catch (error) {
              console.error('❌ Erreur audio:', error);
              // Fallback vers synthèse vocale
              const { playTextImmediately } = await import('../services/openai');
              await playTextImmediately(finalText);
            }
          }
          
          // Libérer le micro après l'audio
          phoneCallService.setAISpeaking(false);
          setIsAISpeaking(false);
          
          // Terminer l'appel si demandé
          if (shouldEndCallAfterAudioRef.current) {
            setTimeout(() => {
              handleEndCall();
            }, 500);
          }
        },
        (partialText) => {
          // Callback pour le texte partiel (feedback visuel)
          setPartialAIText(partialText);
          setAiThinking(false); // Désactiver "L'IA réfléchit" dès le premier texte
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
      
      setPartialAIText('');
      processingResponseRef.current = false;

      // Terminer l'appel si demandé par l'IA
      if (aiResponse.shouldEndCall) {
        shouldEndCallAfterAudioRef.current = true;
      }

    } catch (error) {
      console.error('❌ Erreur handleAIResponse:', error);
      setPartialAIText('');
      setError('Erreur de connexion avec l\'IA.');
      
      // Fallback avec synthèse vocale
      const fallbackMessage = "Pardon ?";
      if (!isMuted) {
        const { playTextImmediately } = await import('../services/openai');
        await playTextImmediately(fallbackMessage);
      }
      
      // Libérer le micro
      phoneCallService.setAISpeaking(false);
      setIsAISpeaking(false);
      
      // Ajouter le message de fallback à l'historique
      const fallbackAIMessage = { role: 'assistant' as const, content: fallbackMessage };
      const updatedHistory = [...conversationHistoryRef.current, fallbackAIMessage];
      
      setConversationContext(prev => ({
        ...prev,
        conversationHistory: updatedHistory
      }));
      conversationHistoryRef.current = updatedHistory;
    } finally {
      processingResponseRef.current = false;
      setAiThinking(false);
    }
  };

  // Démarrer l'appel avec la séquence complète
  const startCall = useCallback(async () => {
    console.log('📞 Démarrage de l\'appel...');
    setCallState('ringing');
    callStateRef.current = 'ringing';
    
    try {
      // Jouer la sonnerie
      console.log('🔔 Lecture de la sonnerie...');
      await phoneCallService.playRingtone();
      
      // Passer à l'état connecté
      console.log('📞 Connexion établie');
      setCallState('connected');
      callStateRef.current = 'connected';
    } catch (error) {
      console.error('❌ Erreur lors du démarrage de l\'appel:', error);
      setError('Erreur lors de l\'établissement de la connexion');
      setCallState('ended');
      callStateRef.current = 'ended';
    }
  }
  )
}