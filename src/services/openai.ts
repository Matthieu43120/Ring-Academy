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
      secretary: "Tu es une assistante de direction. Ton rôle est de filtrer les appels et protéger l'agenda de ton patron. Tu es polie mais sélective : seuls les appels vraiment pertinents passent. Adopte à chaque appel une attitude légèrement différente (plus cordiale, plus expéditive, plus sceptique…).",
      hr: "Tu es un directeur des ressources humaines. Tu es souvent occupé et sollicité, mais tu restes poli. Tu écoutes si la proposition peut être utile à tes collaborateurs ou à ton entreprise. Varie ton attitude : parfois tu es ouvert, parfois sceptique, parfois pressé.",
      manager: "Tu es un chef d'entreprise expérimenté. Tu reçois de nombreux appels commerciaux chaque semaine. Tu es direct, pragmatique et tu veux rapidement savoir si l'appel t'apporte de la valeur. Ton comportement change à chaque appel : parfois curieux, parfois pressé, parfois très sceptique.",
      sales: "Tu es un directeur commercial expérimenté. Tu connais bien les techniques de vente et tu les repères rapidement. Tu n'aimes pas perdre de temps et tu ne te laisses pas facilement convaincre. Adapte ton attitude à chaque appel : parfois ironique, parfois méfiant, parfois intéressé mais exigeant."
    };

    const difficultyPrompts = {
      easy: "Tu es cordial, bienveillant et relativement ouvert à la discussion. Tu poses peu d'objections, et si l'interlocuteur est un minimum clair, tu acceptes facilement de poursuivre la conversation. Tes réponses doivent rester crédibles, mais tu ne cherches pas à compliquer la tâche. Varie légèrement ta manière de répondre à chaque simulation pour ne pas être prévisible.",
      medium: "Tu es poli mais sceptique. Tu poses plusieurs objections classiques (manque de temps, déjà un fournisseur, pas sûr que ce soit pertinent). Si l'interlocuteur pose des questions de qualification claires et pertinentes sur ton entreprise (par exemple : taille de l'équipe, organisation, outils utilisés, besoins actuels, prestataires existants), tu peux répondre de manière crédible, mais sans tout dévoiler. Si les questions sont trop vagues ou mal amenées, tu indiques que tu n'as pas de temps ou que ce n'est pas prioritaire. Tes réponses varient d'une simulation à l'autre : parfois tu donnes un peu d'info, parfois tu restes vague. Tu changes ton vocabulaire et ta personnalité subtilement à chaque simulation. Parfois tu acceptes un rendez-vous, parfois tu refuses poliment. Ne donne jamais toujours le même résultat.",
      hard: "Tu es pressé, méfiant et difficile à convaincre. Tu varies ton attitude d'un appel à l'autre : parfois tu coupes court très vite, parfois tu écoutes un peu avant de refuser. Tu inventes des objections crédibles mais différentes à chaque simulation (ex : timing, budget, fournisseurs existants, scepticisme, manque de confiance). Tu changes ton vocabulaire et ta manière de répondre pour éviter toute répétition. Il est rare que tu acceptes un rendez-vous, sauf si la présentation est vraiment percutante. Ne sois jamais prévisible."
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
export async function getAudioBufferForSentence(text: string, voice: string = 'nova'): Promise<AudioBuffer> {
  console.log('🎵 Génération AudioBuffer - Texte:', text.substring(0, 30) + '...', 'Voix demandée:', voice);
  console.log('🎵 Génération AudioBuffer pour:', text.substring(0, 30) + '...');
  
  try {
    const payload = {
      input: text,
      voice: voice,
      model: 'tts-1'
    };
    
    console.log('📤 Payload envoyé à openai-audio:', payload);
    
    const response = await fetch(OPENAI_AUDIO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'speech',
        payload: payload
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
export async function generateAndPlaySegmentAudio(text: string, voice: string = 'nova'): Promise<void> {
  try {
    console.log('🎵 Génération et lecture - Texte:', text.substring(0, 30) + '...', 'Voix demandée:', voice);
    const audioBuffer = await getAudioBufferForSentence(text, voice);
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
  criteriaScores?: {
    accroche: number;
    ecoute: number;
    objections: number;
    clarte: number;
    conclusion: number;
  };
  recurrentErrors?: string[];
  mainObjective?: string;
}> {
  try {
    console.log('🔍 Analyse de l\'appel en cours...');

    // Préparer les messages pour l'analyse
    const analysisMessages = [
      {
        role: 'system' as const,
        content: `Tu es un coach expert en prospection téléphonique B2B, spécialisé dans la **prise de rendez-vous qualifiés**.
Ton rôle est d'analyser la conversation ci-dessous entre un commercial et un prospect, afin de produire une évaluation complète, pédagogique et exploitable pour le suivi de progression sur plusieurs appels.

L'objectif principal de l'appel est **d'obtenir un rendez-vous**. Tes retours doivent donc toujours être orientés vers cet objectif.

---

### 🎯 CRITÈRES D'ÉVALUATION (pondérés pour le score global)
1. **Accroche et mise en confiance** (20%)
   - Clarté de la présentation, tonalité, crédibilité du début d'appel.
2. **Capacité d'écoute et de reformulation** (20%)
   - Détection des besoins, reformulation pertinente, prise en compte du discours du prospect.
3. **Gestion des objections** (25%)
   - Calme, empathie, pertinence des réponses aux objections.
4. **Clarté et structure du discours** (15%)
   - Fluidité, cohérence, capacité à garder le fil de la discussion.
5. **Conclusion et capacité à obtenir un engagement concret** (20%)
   - Capacité à conclure efficacement et à obtenir le rendez-vous.

---

### 📊 OBJECTIF DU RAPPORT
Tu dois fournir une analyse exploitable pour un tableau de bord pédagogique.
Elle servira à suivre l'évolution de l'apprenant sur plusieurs appels, à détecter ses points faibles récurrents et à proposer des axes d'amélioration concrets.

---

### 🧾 FORMAT DE RÉPONSE (JSON STRICT)
Donne uniquement un JSON valide avec les clés suivantes :

{
  "score": nombre entre 0 et 100,
  "criteriaScores": {
    "accroche": nombre entre 0 et 100,
    "ecoute": nombre entre 0 et 100,
    "objections": nombre entre 0 et 100,
    "clarte": nombre entre 0 et 100,
    "conclusion": nombre entre 0 et 100
  },
  "strengths": [
    "Phrase ou point fort concret basé sur la performance réelle"
  ],
  "improvements": [
    "Point faible concret à travailler, identifiable sur plusieurs sessions potentielles"
  ],
  "recurrentErrors": [
    "Erreur récurrente détectée ou suspectée à partir du comportement observé (même si c'est la première fois)"
  ],
  "recommendations": [
    "Conseils pratiques à appliquer dès le prochain appel pour progresser sur la prise de rendez-vous"
  ],
  "detailedFeedback": "Analyse complète, cohérente et motivante, expliquant pourquoi le score a été attribué et comment progresser.",
  "mainObjective": "Évaluation centrée sur la capacité à obtenir un rendez-vous et à surmonter les objections."
}

---

### 🧠 CONSIGNES SUPPLÉMENTAIRES
- Sois précis, concret et orienté apprentissage (évite les phrases vagues).
- Ne te contente pas de décrire la performance : aide l'utilisateur à progresser.
- Si le commercial a bien géré un point précédemment faible (écoute, objections, etc.), mentionne-le explicitement.
- Adapte ton ton : bienveillant mais professionnel, comme un coach de vente expérimenté.
- Garde toujours en tête : ton analyse alimente un **tableau de bord d'évolution** et doit être exploitable dans le temps.`
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