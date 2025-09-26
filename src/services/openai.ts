// Configuration de l'API OpenAI
const OPENAI_PROXY_URL = '/.netlify/functions/openai-proxy';
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
  isFirstMessage: boolean = false,
  onTextReady?: (text: string) => void,
  onPartialText?: (text: string) => void
): Promise<{ message: string; shouldEndCall: boolean }> {
  
  console.log('🚀 Démarrage streaming IA...');
  
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

    const finalMessage = await processStreamingResponse(response, onPartialText, onSentenceReadyForAudio, onTextReady);
    
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
      console.log('📦 Chunk reçu:', chunk);

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
              sentenceBuffer += content;

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


// Fonction pour générer l'audio OpenAI de manière synchrone
export async function generateOpenAIAudioSync(text: string): Promise<ArrayBuffer> {
  console.log('🎤 Génération audio pour:', text.substring(0, 50) + '...');
  
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

    // La fonction Netlify renvoie un objet JSON avec l'audio en Base64
    const result = await response.json();
    const audioBase64 = result.audio;
    
    if (!audioBase64) {
      throw new Error('Aucun audio reçu de la fonction Netlify');
    }
    
    // Convertir le Base64 en ArrayBuffer
    const binaryString = atob(audioBase64);
    const audioBuffer = new ArrayBuffer(binaryString.length);
    const uint8Array = new Uint8Array(audioBuffer);
    
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i);
    }
    
    console.log('✅ Audio généré, taille:', audioBuffer.byteLength);
    return audioBuffer;
  } catch (error) {
    console.error('❌ Erreur génération audio:', error);
    throw error;
  }
}

// Fonction pour jouer l'audio OpenAI directement
export async function playOpenAIAudioDirectly(audioBuffer: ArrayBuffer): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      audioContext.decodeAudioData(audioBuffer.slice(0), (decodedData) => {
        const source = audioContext.createBufferSource();
        source.buffer = decodedData;
        source.connect(audioContext.destination);
        
        source.onended = () => {
          console.log('🔊 Lecture audio terminée');
          resolve();
        };
        
        source.start(0);
        console.log('🔊 Début lecture audio');
      }, (error) => {
        console.error('❌ Erreur décodage audio:', error);
        reject(error);
      });
    } catch (error) {
      console.error('❌ Erreur lecture audio:', error);
      reject(error);
    }
  });
}

// Fonction pour générer et jouer un segment audio
export async function generateAndPlaySegmentAudio(text: string): Promise<void> {
  try {
    console.log('🎵 Génération et lecture pour:', text.substring(0, 30) + '...');
    const audioBuffer = await generateOpenAIAudioSync(text);
    await playOpenAIAudioDirectly(audioBuffer);
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
    return {
      score: 50,
      strengths: ['Participation à la simulation'],
      recommendations: ['Réessayer la simulation', 'Pratiquer davantage'],
      detailedFeedback: 'Une erreur est survenue lors de l\'analyse. Veuillez réessayer.',
      improvements: ['Améliorer la technique de prospection']
    };
  }
}