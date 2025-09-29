// Configuration de l'API OpenAI
// Dernière mise à jour: correction du paramètre isFirstMessage
const OPENAI_PROXY_URL = '/.netlify/functions/openai-proxy';
// Version: 1.2.1 - Optimisations de performance et stabilité
const OPENAI_AUDIO_URL = '/.netlify/functions/openai-audio';

// Interface pour le contexte de conversation
export interface ConversationContext {
  target: string;
  difficulty: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

// Fonction pour générer une réponse IA rapide avec streaming
export async function generateAIResponseFast(
  context: ConversationContext,
  isFirstMessage: boolean,
  onTextReady?: (text: string) => void,
  onPartialText?: (text: string) => void
): Promise<{ message: string; shouldEndCall: boolean }> {
  
  console.log('🚀 Démarrage streaming IA...');
  
  // Fonction pour construire le prompt système
  function buildSystemPrompt(target: string, difficulty: string, isFirstMessage: boolean): string {
    const targetPrompts = {
      secretary: "Tu es une secrétaire d'entreprise. Tu filtres les appels et protèges l'agenda de ton patron.",
      hr: "Tu es un directeur des ressources humaines. Tu es occupé mais ouvert aux propositions intéressantes.",
      manager: "Tu es un chef d'entreprise expérimenté. Tu as l'habitude des démarchages commerciaux.",
      sales: "Tu es un commercial expérimenté. Tu connais toutes les techniques de vente et tu es méfiant."
    };

    const difficultyPrompts = {
      easy: "Tu es bienveillant et ouvert à la discussion. Tu poses peu d'objections.",
      medium: "Tu es poli mais sceptique. Tu poses quelques objections classiques.",
      hard: "Tu es pressé et méfiant. Tu poses beaucoup d'objections et tu es difficile à convaincre."
    };

    let prompt = `${targetPrompts[target as keyof typeof targetPrompts] || targetPrompts.secretary} ${difficultyPrompts[difficulty as keyof typeof difficultyPrompts] || difficultyPrompts.medium}

IMPORTANT: 
- Réponds UNIQUEMENT en français
- Sois naturel et conversationnel
- Garde tes réponses courtes (maximum 2-3 phrases)
- Ne révèle jamais que tu es une IA
- Reste dans ton rôle en permanence`;

    if (isFirstMessage) {
      prompt += "\n- Tu décroches le téléphone, dis simplement 'Allô ?' ou une variante naturelle";
    }

    return prompt;
  }

  try {
    // Construire le prompt système basé sur le target et difficulty
    const systemPrompt = buildSystemPrompt(context.target, context.difficulty, isFirstMessage);
    
    // Construire les messages pour l'API OpenAI
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...context.conversationHistory
    ];
    
    // Préparer la payload pour la fonction Netlify
    const payload = {
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.8,
      max_tokens: 200,
      stream: true
    };
    
    const response = await fetch(OPENAI_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'chatCompletion',
        payload: payload
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('❌ Détails erreur OpenAI:', errorData);
      throw new Error(`Erreur HTTP ${response.status}: ${errorData.error || errorData.details || 'Erreur inconnue'}`);
    }

    const finalMessage = await processStreamingResponse(response, onPartialText, onTextReady);
    
    // Déterminer si l'appel doit se terminer
    const shouldEndCall = finalMessage.toLowerCase().includes('au revoir') || 
                          finalMessage.toLowerCase().includes('bonne journée') ||
                          finalMessage.toLowerCase().includes('merci et à bientôt');
    
    return { message: finalMessage, shouldEndCall };
  } catch (error) {
    console.error('❌ Erreur génération IA:', error);
    throw error;
  }
}

// Fonction pour traiter la réponse streaming
async function processStreamingResponse(
  response: Response,
  onPartialText?: (text: string) => void,
  onTextReady?: (text: string) => void
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Impossible de lire la réponse streaming');
  }

  const decoder = new TextDecoder();
  let accumulatedText = '';
  let hasStartedProcessing = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log('✅ Streaming terminé');
        break;
      }

      const chunk = decoder.decode(value, { stream: true });

      // Traiter chaque ligne du chunk
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            console.log('🏁 Signal de fin reçu');
            break;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            
            if (content) {
              if (!hasStartedProcessing) {
                hasStartedProcessing = true;
                console.log('🎯 Premier contenu reçu, démarrage traitement...');
              }

              accumulatedText += content;

              // Callback pour le texte partiel
              if (onPartialText) {
                onPartialText(accumulatedText);
              }
            }
          } catch (parseError) {
            console.warn('⚠️ Erreur parsing JSON:', parseError);
          }
        }
      }
    }


    const cleanMessage = accumulatedText.trim();
    console.log('✅ Message IA final:', cleanMessage);
    
    // Callback final avec le texte complet
    if (onTextReady && cleanMessage) {
      onTextReady(cleanMessage);
    }

    return cleanMessage;
  } finally {
    reader.releaseLock();
  }
}

// Fonction pour générer l'AudioBuffer d'une phrase (sans la jouer)
export async function getAudioBufferForSentence(text: string): Promise<AudioBuffer> {
  console.log('🎵 Génération AudioBuffer pour:', text.substring(0, 30) + '...');
  
  try {
    const response = await fetch(OPENAI_AUDIO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'speech',
        payload: {
          input: text,
          voice: 'nova',
          model: 'tts-1'
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Erreur génération audio: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.audioBase64) {
      throw new Error('Pas de données audio reçues');
    }

    // Décoder le Base64 en ArrayBuffer
    const audioData = Uint8Array.from(atob(result.audioBase64), c => c.charCodeAt(0));
    
    // Créer un AudioContext pour décoder
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Décoder l'audio en AudioBuffer
    const audioBuffer = await audioContext.decodeAudioData(audioData.buffer);
    
    console.log('✅ AudioBuffer généré avec succès');
    return audioBuffer;
    
  } catch (error) {
    console.error('❌ Erreur génération AudioBuffer:', error);
    throw error;
  }
}

// Fonction pour jouer un AudioBuffer
export async function playAudioBuffer(audioBuffer: AudioBuffer): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      console.log('🔊 Début lecture AudioBuffer');
      
      // Créer un AudioContext pour la lecture
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Créer une source audio
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      // Gérer la fin de lecture
      source.onended = () => {
        console.log('🔊 Lecture AudioBuffer terminée');
        resolve();
      };
      
      // Démarrer la lecture
      source.start(0);
      
    } catch (error) {
      console.error('❌ Erreur lecture AudioBuffer:', error);
      reject(error);
    }
  });
}


// Fonction pour générer et jouer un segment audio (conservée pour compatibilité)
export async function generateAndPlaySegmentAudio(text: string): Promise<void> {
  try {
    console.log('🎵 Génération et lecture pour:', text.substring(0, 30) + '...');
    const audioBuffer = await getAudioBufferForSentence(text);
    await playAudioBuffer(audioBuffer);
  } catch (error) {
    console.error('❌ Erreur génération/lecture segment:', error);
    // Fallback vers la synthèse vocale du navigateur
    await playTextImmediately(text);
  }
}

// Fonction fallback pour jouer le texte immédiatement avec la synthèse vocale
export async function playTextImmediately(text: string): Promise<void> {
  return new Promise((resolve) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 1.1;
      utterance.pitch = 1.0;
      
      utterance.onend = () => {
        console.log('🔊 Synthèse vocale terminée');
        resolve();
      };
      
      utterance.onerror = () => {
        console.warn('⚠️ Erreur synthèse vocale');
        resolve();
      };
      
      speechSynthesis.speak(utterance);
      console.log('🔊 Début synthèse vocale');
    } else {
      console.warn('⚠️ Synthèse vocale non supportée');
      resolve();
    }
  });
}

// Fonction pour transcrire l'audio (utilisée par phoneCallService)
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');

    const response = await fetch(OPENAI_AUDIO_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Erreur transcription: ${response.status}`);
    }

    const result = await response.json();
    return result.text || '';
  } catch (error) {
    console.error('❌ Erreur transcription:', error);
    return '';
  }
}

// Fonction pour analyser un appel et générer un rapport
export async function analyzeCall(
  conversationHistory: Array<{ role: string; content: string }>,
  target: string,
  difficulty: string,
  duration: number
): Promise<{
  score: number;
  strengths: string[];
  recommendations: string[];
  detailedFeedback: string;
  improvements: string[];
}> {
  try {
    console.log('🔍 Analyse de l\'appel en cours...');
    
    // Préparer les messages pour l'analyse
    const analysisMessages = [
      {
        role: 'system' as const,
        content: `Tu es un expert en prospection téléphonique. Analyse cette conversation et fournis un rapport détaillé.
        
        Critères d'évaluation :
        - Qualité de l'approche et de l'accroche
        - Gestion des objections
        - Capacité d'écoute et d'adaptation
        - Clarté du discours
        - Atteinte de l'objectif (prise de rendez-vous)
        
        Fournis une réponse JSON avec :
        - score (sur 100)
        - strengths (array de points forts)
        - recommendations (array de recommandations)
        - detailedFeedback (analyse détaillée)
        - improvements (array d'axes d'amélioration)`
      },
      {
        role: 'user' as const,
        content: `Analyse cette conversation de prospection :
        
        Cible : ${target}
        Difficulté : ${difficulty}
        Durée : ${Math.round(duration / 1000)}s
        
        Conversation :
        ${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}`
      }
    ];

    // Préparer la payload pour la fonction Netlify
    const payload = {
      model: 'gpt-4o-mini',
      messages: analysisMessages,
      temperature: 0.3,
      max_tokens: 1000
    };
    
    const response = await fetch(OPENAI_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'chatCompletion',
        payload: payload
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('❌ Détails erreur analyse:', errorData);
      throw new Error(`Erreur HTTP ${response.status}: ${errorData.error || errorData.details || 'Erreur inconnue'}`);
    }

    const result = await response.json();
    const analysisText = result.choices?.[0]?.message?.content || '';
    
    // Nettoyer la réponse pour supprimer les marqueurs Markdown
    let cleanedAnalysisText = analysisText.trim();
    
    // Supprimer les blocs de code Markdown (```json ... ```)
    if (cleanedAnalysisText.startsWith('```json')) {
      cleanedAnalysisText = cleanedAnalysisText.replace(/^```json\s*/, '');
    }
    if (cleanedAnalysisText.startsWith('```')) {
      cleanedAnalysisText = cleanedAnalysisText.replace(/^```\s*/, '');
    }
    if (cleanedAnalysisText.endsWith('```')) {
      cleanedAnalysisText = cleanedAnalysisText.replace(/\s*```$/, '');
    }
    
    console.log('📝 Texte d\'analyse nettoyé:', cleanedAnalysisText.substring(0, 200) + '...');
    
    // Parser la réponse JSON
    try {
      const analysis = JSON.parse(cleanedAnalysisText);
      console.log('✅ Analyse terminée:', analysis);
      return analysis;
    } catch (parseError) {
      console.warn('⚠️ Erreur parsing analyse, utilisation fallback:', parseError);
      console.warn('📝 Texte problématique:', cleanedAnalysisText);
      // Fallback si le parsing JSON échoue
      return {
        score: 75,
        strengths: ['Bonne approche générale'],
        recommendations: ['Continuer à pratiquer'],
        detailedFeedback: cleanedAnalysisText || 'Analyse non disponible',
        improvements: ['Améliorer la gestion des objections']
      };
    }
  } catch (error) {
    console.error('❌ Erreur analyse appel:', error);
    // Retourner une analyse par défaut en cas d'erreur
    return {
      score: 50,
      strengths: ['Participation à la simulation'],
      recommendations: ['Réessayer la simulation', 'Pratiquer davantage'],
      detailedFeedback: 'Une erreur est survenue lors de l\'analyse. Veuillez réessayer.',
      improvements: ['Améliorer la technique de prospection']
    };
  }
}