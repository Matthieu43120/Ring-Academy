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
  onPartialText?: (text: string) => void,
  onSentenceReadyForAudio?: (sentence: string) => void
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
      model: 'gpt-4-turbo',
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
  onSentenceReadyForAudio?: (sentence: string) => void,
  onTextReady?: (text: string) => void
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Impossible de lire la réponse streaming');
  }

  const decoder = new TextDecoder();
  let accumulatedText = '';
  let sentenceBuffer = '';
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

              // Détecter les phrases complètes
              const completeSentences = extractCompleteSentences(sentenceBuffer);
              
              for (const sentence of completeSentences) {
                console.log('🎵 Phrase complète détectée:', sentence);
                
                if (onSentenceReadyForAudio) {
                  onSentenceReadyForAudio(sentence);
                }
                
                // Retirer la phrase du buffer
                sentenceBuffer = sentenceBuffer.replace(sentence, '').trim();
              }
            }
          } catch (parseError) {
            console.warn('⚠️ Erreur parsing JSON:', parseError);
          }
        }
      }
    }

    // Traiter le reste du buffer s'il y en a
    if (sentenceBuffer.trim()) {
      console.log('🎵 Phrase finale du buffer:', sentenceBuffer);
      if (onSentenceReadyForAudio) {
        onSentenceReadyForAudio(sentenceBuffer.trim());
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

// Fonction pour extraire les phrases complètes
function extractCompleteSentences(text: string): string[] {
  const sentences: string[] = [];
  
  // Regex pour détecter les fins de phrases
  const sentenceEndRegex = /[.!?]+\s+/g;
  let lastIndex = 0;
  let match;

  while ((match = sentenceEndRegex.exec(text)) !== null) {
    const sentence = text.slice(lastIndex, match.index + match[0].length).trim();
    if (sentence.length > 5) {
      sentences.push(sentence);
      lastIndex = match.index + match[0].length;
    }
  }

  return sentences;
}

// Fonction pour streamer et jouer l'audio OpenAI en temps réel
export async function streamOpenAIAudio(text: string): Promise<void> {
  console.log('🎵 Streaming audio temps réel pour:', text.substring(0, 50) + '...');
  
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

    if (!response.body) {
      throw new Error('Pas de flux audio reçu');
    }

    console.log('🔊 Début streaming audio temps réel');
    
    // Créer un AudioContext pour la lecture en temps réel
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Utiliser l'API MediaSource pour le streaming audio
    await playStreamingAudio(response.body, audioContext);
    
  } catch (error) {
    console.error('❌ Erreur streaming audio:', error);
    throw error;
  }
}

// Fonction pour jouer un flux audio en temps réel
async function playStreamingAudio(stream: ReadableStream<Uint8Array>, audioContext: AudioContext): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const reader = stream.getReader();
      const chunks: Uint8Array[] = [];
      let totalLength = 0;
      let isPlaying = false;
      
      // Lire le flux par chunks
      const readChunk = async () => {
        try {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('🔊 Fin du flux audio');
            // Jouer les derniers chunks s'il en reste
            if (chunks.length > 0 && !isPlaying) {
              await playAccumulatedChunks();
            }
            resolve();
            return;
          }
          
          if (value) {
            chunks.push(value);
            totalLength += value.length;
            
            // Commencer la lecture dès qu'on a assez de données (environ 8KB)
            if (!isPlaying && totalLength > 8192) {
              isPlaying = true;
              await playAccumulatedChunks();
            }
          }
          
          // Continuer à lire
          readChunk();
        } catch (error) {
          console.error('❌ Erreur lecture chunk:', error);
          reject(error);
        }
      };
      
      // Fonction pour jouer les chunks accumulés
      const playAccumulatedChunks = async () => {
        if (chunks.length === 0) return;
        
        try {
          // Combiner tous les chunks en un seul ArrayBuffer
          const combinedBuffer = new ArrayBuffer(totalLength);
          const combinedView = new Uint8Array(combinedBuffer);
          let offset = 0;
          
          for (const chunk of chunks) {
            combinedView.set(chunk, offset);
            offset += chunk.length;
          }
          
          // Décoder et jouer l'audio
          const audioBuffer = await audioContext.decodeAudioData(combinedBuffer);
          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContext.destination);
          
          source.onended = () => {
            console.log('🔊 Lecture chunk terminée');
          };
          
          source.start(0);
          console.log('🔊 Lecture chunk démarrée');
          
          // Réinitialiser pour le prochain batch
          chunks.length = 0;
          totalLength = 0;
          isPlaying = false;
          
        } catch (error) {
          console.error('❌ Erreur lecture chunk audio:', error);
          // Continuer malgré l'erreur
          chunks.length = 0;
          totalLength = 0;
          isPlaying = false;
        }
      };
      
      // Démarrer la lecture du flux
      readChunk();
      
    } catch (error) {
      console.error('❌ Erreur setup streaming audio:', error);
      reject(error);
    }
  });
}

// Fonction pour générer et jouer un segment audio
export async function generateAndPlaySegmentAudio(text: string): Promise<void> {
  try {
    console.log('🎵 Génération et lecture pour:', text.substring(0, 30) + '...');
    await streamOpenAIAudio(text);
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
      model: 'gpt-4-turbo',
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
    
    // Parser la réponse JSON
    try {
      const analysis = JSON.parse(analysisText);
      console.log('✅ Analyse terminée:', analysis);
      return analysis;
    } catch (parseError) {
      console.warn('⚠️ Erreur parsing analyse, utilisation fallback');
      // Fallback si le parsing JSON échoue
      return {
        score: 75,
        strengths: ['Bonne approche générale'],
        recommendations: ['Continuer à pratiquer'],
        detailedFeedback: analysisText || 'Analyse non disponible',
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