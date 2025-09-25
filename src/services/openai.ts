// Configuration de l'API OpenAI
const OPENAI_PROXY_URL = '/.netlify/functions/openai-proxy';
const OPENAI_AUDIO_URL = '/.netlify/functions/openai-audio';

// Interface pour les paramètres de génération de réponse IA
interface AIResponseParams {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  target: string;
  onPartialText?: (text: string) => void;
  onSentenceReadyForAudio?: (sentence: string) => void;
  onTextReady?: (text: string) => void;
}

// Fonction pour générer une réponse IA rapide avec streaming
export async function generateAIResponseFast(params: AIResponseParams): Promise<string> {
  const { messages, target, onPartialText, onSentenceReadyForAudio, onTextReady } = params;
  
  console.log('🚀 Démarrage streaming IA...');
  
  try {
    const response = await fetch(OPENAI_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        target,
        stream: true
      }),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return await processStreamingResponse(response, target, onPartialText, onSentenceReadyForAudio, onTextReady);
  } catch (error) {
    console.error('❌ Erreur génération IA:', error);
    throw error;
  }
}

// Fonction pour traiter la réponse streaming
async function processStreamingResponse(
  response: Response,
  target: string,
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
        text: text,
        voice: 'nova',
        model: 'tts-1'
      }),
    });

    if (!response.ok) {
      throw new Error(`Erreur génération audio: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
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