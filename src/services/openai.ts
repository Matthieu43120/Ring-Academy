// Configuration pour utiliser la fonction Netlify proxy
const OPENAI_PROXY_URL = '/.netlify/functions/openai-proxy';
const OPENAI_AUDIO_URL = '/.netlify/functions/openai-audio';

export interface ConversationContext {
  target: string;
  difficulty: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface AIResponse {
  message: string;
  shouldEndCall: boolean;
  emotion: 'neutral' | 'interested' | 'skeptical' | 'annoyed' | 'positive';
  audioUrl?: string;
}

export interface CallAnalysis {
  score: number;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  detailedFeedback: string;
}

// CORRECTION CRITIQUE: Voix OpenAI par personnage avec correspondance GENRE EXACTE
const CHARACTER_INFO = {
  secretary: { 
    name: 'Marie Dubois', 
    gender: 'female',
    voice: 'nova' as const,
    description: 'Secrétaire bienveillante et professionnelle'
  },
  hr: { 
    name: 'Pierre Martin', 
    gender: 'male',
    voice: 'onyx' as const,
    description: 'Directeur RH expérimenté et méthodique'
  },
  manager: { 
    name: 'Sophie Laurent', 
    gender: 'female',
    voice: 'shimmer' as const,
    description: 'Directrice dynamique et décisionnaire'
  },
  sales: { 
    name: 'Thomas Durand', 
    gender: 'male',
    voice: 'alloy' as const,
    description: 'Commercial expérimenté et direct'
  }
} as const;

// Cache pour les réponses audio fréquentes
const audioCache = new Map<string, string>();

// Variable globale pour contrôler la synthèse vocale
let currentSynthesisController: AbortController | null = null;

// NOUVEAUX PROMPTS SYSTÈME RÉALISTES ET COHÉRENTS AVEC GESTION DU SILENCE
const getSystemPrompt = (target: string, difficulty: string): string => {
  const basePrompts = {
    secretary: {
      easy: `Tu es Marie Dubois, secrétaire professionnelle et bienveillante. Tu filtres les appels pour ta responsable Mme Laurent.

RÔLE CRITIQUE: Tu n'es PAS décisionnaire. Tu ne peux PAS prendre de RDV pour ta responsable.

COMPORTEMENT FACILE:
- Réponds poliment avec 1-2 phrases courtes
- Pose MAXIMUM 2 questions pour comprendre l'objet de l'appel
- Questions types: "C'est à quel sujet ?" ou "De quelle entreprise appelez-vous ?"
- Si l'utilisateur est CLAIR et PROFESSIONNEL, tu peux transférer l'appel
- Pour transférer: "Je vous transfère à Mme Laurent" puis termine IMMÉDIATEMENT par "[END_CALL]"
- Si on te demande un RDV directement: "Je ne prends pas de RDV, je ne suis que secrétaire"

GESTION DU SILENCE:
- Si silence prolongé: "Allô ? Il y a quelqu'un ?"
- Si toujours silence: "Je vais raccrocher" puis "[END_CALL]"

RÈGLES STRICTES:
- Si l'utilisateur n'est pas clair ou professionnel: "Pouvez-vous reformuler votre demande ?"
- Si toujours pas clair: "Je vais raccrocher, bonne journée" puis "[END_CALL]"
- CRITIQUE: Dès que tu transfères, tu raccroches IMMÉDIATEMENT avec "[END_CALL]"
- Reste toujours professionnelle et polie`,

      medium: `Tu es Marie Dubois, secrétaire expérimentée qui protège l'agenda de sa responsable Mme Laurent.

RÔLE CRITIQUE: Tu n'es PAS décisionnaire. Tu ne peux PAS prendre de RDV pour ta responsable.

COMPORTEMENT MOYEN:
- Réponds avec 1-2 phrases, un peu plus méfiante
- Pose MAXIMUM 2 questions pour qualifier l'appel
- Questions types: "C'est concernant quoi exactement ?" ou "Vous représentez quelle société ?"
- Mme Laurent est TOUJOURS occupée: "Elle est en réunion/à l'extérieur/indisponible"
- Si l'utilisateur est CONVAINCANT: "Vous pouvez envoyer un email à sophie.laurent@entreprise.com"
- Si TRÈS convaincant: donner le numéro direct "06 12 34 56 78"
- CRITIQUE: Après avoir donné les coordonnées, termine par "[END_CALL]"

GESTION DU SILENCE:
- Si silence: "Vous êtes toujours là ?"
- Si toujours silence: "Au revoir" puis "[END_CALL]"

RÈGLES STRICTES:
- Jamais de transfert direct en mode moyen
- Si pas professionnel: "Je dois raccrocher, au revoir" puis "[END_CALL]"
- Reste ferme mais polie`,

      hard: `Tu es Marie Dubois, secrétaire très protectrice de sa responsable Mme Laurent.

RÔLE CRITIQUE: Tu n'es PAS décisionnaire. Tu ne peux PAS prendre de RDV pour ta responsable.

COMPORTEMENT DIFFICILE:
- Réponses très courtes et directes
- Pose 1 question maximum pour identifier
- "C'est à quel sujet ?" puis évalue immédiatement
- AUCUN transfert, AUCUNE coordonnée donnée
- "Je ne suis pas autorisée à transférer ou donner des coordonnées"
- "Envoyez un courrier à l'entreprise"
- CRITIQUE: Raccroche rapidement avec "[END_CALL]"

GESTION DU SILENCE:
- Si silence: "Allô ?"
- Si toujours silence: raccroche immédiatement "[END_CALL]"

RÈGLES STRICTES:
- Très peu de patience, raccroche rapidement si pas clair
- Si insistance: "Je raccroche" puis "[END_CALL]"
- Reste professionnelle mais très ferme`
    },

    hr: {
      easy: `Tu es Pierre Martin, Directeur RH ouvert aux innovations pour améliorer l'entreprise.

COMPORTEMENT FACILE:
- Réponds avec 1-2 phrases professionnelles et bienveillantes
- Si l'utilisateur se présente clairement: montre de l'intérêt immédiatement
- Pose 1 question simple sur les bénéfices: "En quoi cela peut aider nos équipes ?"
- Si l'utilisateur explique bien la valeur: accepte FACILEMENT le RDV
- "C'est intéressant ! On peut se voir cette semaine ? Jeudi 14h ça vous va ?" puis "[END_CALL]"
- CRITIQUE: En mode facile, tu es TRÈS ouvert et acceptes rapidement les RDV

GESTION DU SILENCE:
- Si silence: "Vous êtes là ?"
- Si toujours silence: "Je vais raccrocher" puis "[END_CALL]"

RÈGLES STRICTES:
- JAMAIS de demande de reformulation en premier si l'utilisateur est clair
- Si l'utilisateur se présente bien: continue la conversation
- Seulement si vraiment pas clair: "Pouvez-vous préciser ?"
- En mode facile, tu es BIENVEILLANT et OUVERT aux propositions
- Reste professionnel mais très accessible`,
      medium: `Tu es Pierre Martin, Directeur RH expérimenté qui évalue chaque proposition.

COMPORTEMENT MOYEN:
- Réponds avec 1-2 phrases, un peu sceptique
- Pose 2-3 objections classiques: "Je n'ai pas le temps", "C'est sûrement cher", "On a déjà des solutions"
- Si l'utilisateur répond BIEN à 2 objections: accepte le RDV
- "D'accord, on peut se voir mardi prochain 15h ?" puis "[END_CALL]"

GESTION DU SILENCE:
- Si silence: "Vous êtes toujours en ligne ?"
- Si toujours silence: "Au revoir" puis "[END_CALL]"

RÈGLES STRICTES:
- Si mauvaises réponses aux objections: "Cela ne nous convient pas"
- Si pas professionnel: "Je dois y aller" puis "[END_CALL]"
- Reste exigeant mais équitable`,

      hard: `Tu es Pierre Martin, Directeur RH très occupé et sélectif.

COMPORTEMENT DIFFICILE:
- Réponses courtes et directes
- Objections fortes: "Cela ne m'intéresse pas", "Je suis très occupé", "Comment avez-vous eu mon numéro ?"
- Continue avec d'autres objections: "C'est trop cher", "On n'a pas le budget", "Pas le bon moment"
- Si l'utilisateur reste TRÈS CLAIR et répond parfaitement à TOUTES les objections: peut accepter le RDV
- "Exceptionnellement, 15 minutes jeudi 16h, pas plus" puis "[END_CALL]"

GESTION DU SILENCE:
- Si silence: "Allô ?"
- Si toujours silence: raccroche immédiatement "[END_CALL]"

RÈGLES STRICTES:
- Très peu de patience, raccroche si pas convaincant
- Si hésitation ou flou: "Je n'ai pas de temps à perdre" puis "[END_CALL]"
- Reste professionnel mais très exigeant`
    },

    manager: {
      easy: `Tu es Sophie Laurent, Chef d'entreprise accessible qui cherche toujours à améliorer ses résultats.

COMPORTEMENT FACILE:
- Réponds avec 1-2 phrases engagées et business
- Pose 1-2 questions sur le ROI et les bénéfices
- Questions types: "Quel impact sur nos résultats ?" ou "Combien d'économies ?"
- Si l'utilisateur montre la valeur CLAIREMENT: accepte le RDV
- "Intéressant, on se voit cette semaine ? Mardi 11h ça va ?" puis "[END_CALL]"

GESTION DU SILENCE:
- Si silence: "Vous êtes là ?"
- Si toujours silence: "Je raccroche" puis "[END_CALL]"

RÈGLES STRICTES:
- Si pas de valeur claire: "Je ne vois pas l'intérêt"
- Si pas professionnel: "Au revoir" puis "[END_CALL]"
- Reste orientée business et résultats`,

      medium: `Tu es Sophie Laurent, Chef d'entreprise expérimentée qui évalue chaque investissement.

COMPORTEMENT MOYEN:
- Réponds avec 1-2 phrases, évalue chaque proposition
- Objections business: "Je n'ai pas le temps", "C'est un investissement important", "On a d'autres priorités"
- Si l'utilisateur répond BIEN à 2-3 objections: accepte le RDV
- "Vous m'avez convaincu, on peut se voir vendredi 14h ?" puis "[END_CALL]"

GESTION DU SILENCE:
- Si silence: "Vous êtes toujours en ligne ?"
- Si toujours silence: "Au revoir" puis "[END_CALL]"

RÈGLES STRICTES:
- Si mauvaises réponses: "Ce n'est pas pour nous"
- Si pas professionnel: "Je dois raccrocher" puis "[END_CALL]"
- Reste business et directe`,

      hard: `Tu es Sophie Laurent, Chef d'entreprise très occupée et directe.

COMPORTEMENT DIFFICILE:
- Réponses très courtes et business
- Objections fortes: "Cela ne m'intéresse pas", "Je suis en réunion", "Qui vous a donné mon numéro ?"
- Continue avec: "C'est hors budget", "Pas prioritaire", "On a d'autres projets"
- Si l'utilisateur reste PARFAITEMENT CLAIR et répond à TOUTES les objections: peut accepter
- "Vous avez 10 minutes jeudi 17h, pas plus" puis "[END_CALL]"

GESTION DU SILENCE:
- Si silence: "Allô ?"
- Si toujours silence: raccroche immédiatement "[END_CALL]"

RÈGLES STRICTES:
- Raccroche rapidement si pas convaincant
- Si flou ou hésitant: "Je n'ai pas de temps" puis "[END_CALL]"
- Reste très directe et exigeante`
    },

    sales: {
      easy: `Tu es Thomas Durand, Commercial ouvert aux opportunités qui peuvent améliorer tes performances.

COMPORTEMENT FACILE:
- Réponds avec 1-2 phrases naturelles entre commerciaux
- Pose 1-2 questions sur l'efficacité: "Ça marche vraiment ?" ou "Quels résultats ?"
- Si l'utilisateur montre des bénéfices CLAIRS: accepte le RDV
- "OK, ça peut m'intéresser. On se voit quand ? Mercredi 10h ?" puis "[END_CALL]"

GESTION DU SILENCE:
- Si silence: "Tu es là ?"
- Si toujours silence: "Salut" puis "[END_CALL]"

RÈGLES STRICTES:
- Si pas convaincant: "Ça ne me dit rien"
- Si pas professionnel: "Salut" puis "[END_CALL]"
- Reste direct et pragmatique`,

      medium: `Tu es Thomas Durand, Commercial expérimenté qui teste l'interlocuteur.

COMPORTEMENT MOYEN:
- Réponds avec 1-2 phrases, un peu provocateur
- Objections de commercial: "J'ai déjà tout ce qu'il faut", "Ça marche ces trucs ?", "C'est encore de la théorie"
- Si l'utilisateur répond BIEN aux objections: accepte le RDV
- "Tu m'as convaincu, on peut se voir cette semaine ?" puis "[END_CALL]"

GESTION DU SILENCE:
- Si silence: "Tu es toujours là ?"
- Si toujours silence: "Ciao" puis "[END_CALL]"

RÈGLES STRICTES:
- Si mauvaises réponses: "Laisse tomber"
- Si pas professionnel: "Ciao" puis "[END_CALL]"

      hard: \`Tu es Thomas Durand, Commercial très expérimenté qui déteste être démarché.

COMPORTEMENT DIFFICILE:
- Réponses courtes et ironiques
- Objections fortes: "Je déteste qu'on me démarch", "Tu perds ton temps", "Comment tu as eu mon numéro ?"
- Continue avec: "C'est du pipeau", "J'ai pas de budget", "Ça m'intéresse pas"
- Retourne les techniques: "C'est quoi ton closing ?" ou "Tu lis un script ?"
- Si l'utilisateur reste EXCELLENT et répond à TOUT: peut accepter par respect professionnel
- "Respect, tu as du niveau. 15 minutes vendredi 16h" puis "[END_CALL]"
      `
    }
  }

  const prompt = basePrompts[target as keyof typeof basePrompts]?.[difficulty as keyof typeof basePrompts.secretary] || basePrompts.secretary.easy;
  
  return `${prompt}

RÈGLES UNIVERSELLES CRITIQUES: 
- Réponds UNIQUEMENT en tant que ce personnage
- MAXIMUM 1-2 phrases courtes et directes
- Pose UNE SEULE question à la fois, jamais plusieurs
- Va à l'ESSENTIEL, pas de détails inutiles
- ADAPTE selon la qualité de l'approche de l'utilisateur
- Si l'utilisateur n'est pas clair ou professionnel: donne UNE chance de reformuler
- Si toujours pas clair: raccroche poliment avec "[END_CALL]"
- CRITIQUE: Si tu acceptes un RDV: propose un créneau précis puis termine IMMÉDIATEMENT par "[END_CALL]"
- CRITIQUE: Si tu transfères (secrétaire facile): annonce le transfert puis termine IMMÉDIATEMENT par "[END_CALL]"
- CRITIQUE: Si tu donnes des coordonnées (secrétaire medium): donne l'info puis termine IMMÉDIATEMENT par "[END_CALL]"
- N'utilise jamais de formatage markdown
- Reste cohérent avec ton rôle et le niveau de difficulté
- Sois professionnel mais authentique selon ton personnage`;
};

// OPTIMISATION MAJEURE : Génération de réponse IA avec audio OpenAI PRIORITAIRE et ATTENTE
export const generateAIResponseFast = async (
  context: ConversationContext, 
  isFirstMessage: boolean = false,
  onTextReady?: (text: string) => void,
  onPartialText?: (partialText: string) => void,
  onSentenceReadyForAudio?: (sentence: string) => void
): Promise<AIResponse> => {
  try {
    if (isFirstMessage) {
      // Pour le premier message, on force "Allô ?" IMMÉDIATEMENT avec audio OpenAI
      const firstResponse = {
        message: "Allô ?",
        shouldEndCall: false,
        emotion: 'neutral' as const
      };

      // OPTIMISATION CRITIQUE: Générer l'audio OpenAI ET ATTENDRE avant le callback
      const audioUrl = await generateOpenAIAudioSync("Allô ?", context.target);
      
      // NOUVEAU: Callback SEULEMENT quand l'audio OpenAI est prêt
      if (onTextReady && audioUrl) {
        onTextReady("Allô ?");
        
        // Jouer immédiatement l'audio OpenAI (déjà prêt)
        setTimeout(() => {
          playOpenAIAudioDirectly(audioUrl);
        }, 25); // Délai minimal pour que le callback soit traité
      } else if (onTextReady) {
        // Fallback si pas d'audio OpenAI
        onTextReady("Allô ?");
      }

      return firstResponse;
    }

    // Pour les messages suivants : STREAMING ULTRA-RAPIDE
    const systemPrompt = getSystemPrompt(context.target, context.difficulty);
    
    let messages = [
      { role: "system" as const, content: systemPrompt },
      ...context.conversationHistory
    ];

    // STREAMING CRITIQUE : Paramètres avec streaming activé
    const response = await fetch(OPENAI_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'chatCompletion',
        payload: {
          model: "gpt-3.5-turbo", // Le plus rapide
          messages: messages,
          max_tokens: 50, // RÉDUCTION: 60 → 50 pour réponses plus courtes et rapides
          temperature: 0.7,
          stream: true // ACTIVATION DU STREAMING
        }
        stream: true // ACTIVATION DU STREAMING AU NIVEAU PROXY
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de la communication avec OpenAI');
    }

    // NOUVEAU: Traitement du streaming
    return await processStreamingResponse(response, context.target, onPartialText, onSentenceReadyForAudio);

  } catch (error) {
    console.error('❌ Erreur génération IA:', error);
    const fallbackMessage = "Pardon ?";
    if (onTextReady) {
      onTextReady(fallbackMessage);
    }
    
    return {
      message: fallbackMessage,
      shouldEndCall: false,
      emotion: 'neutral'
    };
  }
};

// NOUVELLE FONCTION: Traitement du streaming de réponse IA
const processStreamingResponse = async (
  response: Response,
  target: string,
  onPartialText?: (partialText: string) => void,
  onSentenceReadyForAudio?: (sentence: string) => void
): Promise<AIResponse> => {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Pas de stream disponible');
  }

  const decoder = new TextDecoder();
  let accumulatedText = '';
  let sentenceBuffer = '';
  let shouldEndCall = false;
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.trim() === '') continue;
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            break;
          }
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            
            if (content) {
              accumulatedText += content;
              sentenceBuffer += content;
              
              // Callback pour le texte partiel (feedback visuel)
              if (onPartialText) {
                onPartialText(accumulatedText);
              }
              
              // Détecter les fins de phrase pour génération audio immédiate
              const sentences = extractCompleteSentences(sentenceBuffer);
              for (const sentence of sentences) {
                if (sentence.trim() && onSentenceReadyForAudio) {
                  // Générer et jouer l'audio immédiatement
                  generateAndPlaySegmentAudio(sentence, target, onSentenceReadyForAudio);
                }
                // Retirer la phrase du buffer
                sentenceBuffer = sentenceBuffer.replace(sentence, '').trim();
              }
            }
          } catch (e) {
            // Ignorer les chunks malformés
            continue;
          }
        }
      }
    }
    
    // Traiter le reste du buffer s'il y en a
    if (sentenceBuffer.trim() && onSentenceReadyForAudio) {
      generateAndPlaySegmentAudio(sentenceBuffer, target, onSentenceReadyForAudio);
    }
    
  } finally {
    reader.releaseLock();
  }
  
  // Vérifier si l'appel doit se terminer
  shouldEndCall = accumulatedText.includes("[END_CALL]");
  const cleanMessage = accumulatedText.replace("[END_CALL]", "").trim();
  
  // Émotion simplifiée
  let emotion: AIResponse['emotion'] = 'neutral';
  if (cleanMessage.includes('?')) emotion = 'interested';
  else if (cleanMessage.includes('mais') || cleanMessage.includes('non')) emotion = 'skeptical';
  else if (cleanMessage.includes('occupé') || cleanMessage.includes('temps')) emotion = 'annoyed';
  else if (cleanMessage.includes('oui') || cleanMessage.includes('bien')) emotion = 'positive';

  return {
    message: cleanMessage,
    shouldEndCall,
    emotion
  };
};

// NOUVELLE FONCTION: Extraire les phrases complètes d'un buffer de texte
const extractCompleteSentences = (buffer: string): string[] => {
  const sentences: string[] = [];
  
  // Patterns pour détecter les fins de phrase
  const sentenceEndPatterns = [
    /[.!?]\s+/g,  // Ponctuation suivie d'espace
    /[.!?]$/g,    // Ponctuation en fin de texte
  ];
  
  let workingBuffer = buffer;
  
  for (const pattern of sentenceEndPatterns) {
    const matches = [...workingBuffer.matchAll(pattern)];
    
    for (const match of matches) {
      if (match.index !== undefined) {
        const sentence = workingBuffer.substring(0, match.index + match[0].length).trim();
        if (sentence.length > 5) { // Phrases minimum 5 caractères
          sentences.push(sentence);
          workingBuffer = workingBuffer.substring(match.index + match[0].length);
        }
      }
    }
  }
  
  return sentences;
};

// NOUVELLE FONCTION CRITIQUE : Générer et jouer l'audio d'un segment immédiatement
async function generateAndPlaySegmentAudio(
  segment: string, 
  target: string,
  onSentenceReady?: (sentence: string) => void
): Promise<void> {
  try {
    // Nettoyer le segment
    const cleanSegment = segment.replace(/[[\]]/g, '').trim();
    if (cleanSegment.length < 5) return;

    console.log('🎵 Génération audio segment:', cleanSegment);

    // Callback immédiat pour indiquer qu'une phrase est prête
    if (onSentenceReady) {
      onSentenceReady(cleanSegment);
    }

    // NOUVEAU: Générer et jouer l'audio en arrière-plan sans bloquer
    generateOpenAIAudioSync(cleanSegment, target).then(audioUrl => {
      if (audioUrl) {
        playOpenAIAudioDirectly(audioUrl);
      } else {
        // Fallback vers synthèse navigateur
        playTextImmediately(cleanSegment);
      }
    }).catch(error => {
      console.error('Erreur génération audio segment:', error);
      // Fallback silencieux vers synthèse navigateur
      playTextImmediately(cleanSegment).catch(fallbackError => {
        console.error('Erreur fallback audio:', fallbackError);
      });
    });
  } catch (error) {
    console.error('Erreur génération audio segment:', error);
    // Fallback silencieux vers synthèse navigateur
    try {
      await playTextImmediately(segment);
    } catch (fallbackError) {
      console.error('Erreur fallback audio:', fallbackError);
    }
  }
}

// OPTIMISATION MAJEURE : Génération audio OpenAI SYNCHRONE avec modèle plus rapide
const generateOpenAIAudioSync = async (text: string, target: string): Promise<string | undefined> => {
  try {
    // Vérifier le cache d'abord
    const cacheKey = `${text}-${target}`;
    if (audioCache.has(cacheKey)) {
      return audioCache.get(cacheKey);
    }

    const character = CHARACTER_INFO[target as keyof typeof CHARACTER_INFO] || CHARACTER_INFO.secretary;
    const voice = character.voice;
    
    const response = await fetch(OPENAI_AUDIO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'speech',
        payload: {
          model: "tts-1", // OPTIMISATION: tts-1 est plus rapide que tts-1-hd
          voice: voice,
          input: text,
          speed: 1.15 // OPTIMISATION: 1.1 → 1.15 pour encore plus de rapidité
        }
      }),
    });

    if (!response.ok) {
      console.error('Erreur génération audio:', await response.text());
      return undefined;
    }

    const { audio: audioBase64 } = await response.json();
    
    // Convertir le base64 en Blob puis en URL
    const audioBuffer = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);

    
    // Mettre en cache pour les prochaines fois
    audioCache.set(cacheKey, audioUrl);
    
    return audioUrl;
  } catch (error) {
    return undefined;
  }
};

// NOUVELLE FONCTION : Lecture directe de l'audio OpenAI
const playOpenAIAudioDirectly = async (audioUrl: string): Promise<void> => {
  try {
    // Arrêter toute synthèse précédente
    if (currentSynthesisController) {
      currentSynthesisController.abort();
    }
    window.speechSynthesis.cancel();
    
    // Créer un nouveau contrôleur
    currentSynthesisController = new AbortController();
    
    const audio = await loadAudioFast(audioUrl);
    
    if (currentSynthesisController.signal.aborted) {
      return;
    }
    
    await playAudioElement(audio, currentSynthesisController.signal);
    
  } catch (error) {
    // En cas d'erreur, ne pas utiliser de fallback pour éviter la double lecture
  }
};

// CORRECTION CRITIQUE: Synthèse vocale SEULEMENT si pas d'audio OpenAI
export const playTextImmediately = async (text: string): Promise<void> => {
  // ARRÊTER toute synthèse précédente
  if (currentSynthesisController) {
    currentSynthesisController.abort();
  }
  
  // Créer un nouveau contrôleur pour cette synthèse
  currentSynthesisController = new AbortController();
  
  try {
    // Synthèse navigateur en fallback
    await playWithBrowserSynthesisRobust(text, currentSynthesisController.signal);
    
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('❌ Erreur lecture audio complète:', error);
    }
  }
};

// NOUVELLE FONCTION : Lecture avec choix automatique audio OpenAI ou synthèse
export const playTextWithBestMethod = async (text: string, target: string): Promise<void> => {
  try {
    // Essayer d'abord l'audio OpenAI
    const audioUrl = await generateOpenAIAudioSync(text, target);
    if (audioUrl) {
      await playOpenAIAudioDirectly(audioUrl);
    } else {
      await playTextImmediately(text);
    }
  } catch (error) {
    await playTextImmediately(text);
  }
};

// NOUVELLE FONCTION : Chargement audio ultra-rapide avec timeout augmenté
const loadAudioFast = async (audioUrl: string): Promise<HTMLAudioElement> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    
    // Timeout optimisé pour le streaming
    const timeout = setTimeout(() => {
      reject(new Error('Audio loading timeout'));
    }, 3000); // OPTIMISATION: 5000ms → 3000ms pour plus de réactivité
    
    audio.addEventListener('canplaythrough', () => {
      clearTimeout(timeout);
      resolve(audio);
    }, { once: true });
    
    audio.addEventListener('error', () => {
      clearTimeout(timeout);
      reject(new Error('Audio loading error'));
    }, { once: true });
    
    audio.src = audioUrl;
    audio.load();
  });
};

// NOUVELLE FONCTION : Lecture d'un élément audio avec contrôle d'annulation
const playAudioElement = async (audio: HTMLAudioElement, signal: AbortSignal): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Audio playback aborted', 'AbortError'));
      return;
    }

    const cleanup = () => {
      audio.pause();
      audio.currentTime = 0;
    };

    signal.addEventListener('abort', () => {
      cleanup();
      reject(new DOMException('Audio playback aborted', 'AbortError'));
    });

    audio.addEventListener('ended', () => {
      console.log('✅ IMMEDIATE: Audio OpenAI terminé');
      resolve();
    }, { once: true });
    
    audio.addEventListener('error', () => {
      cleanup();
      reject(new Error('Audio playback error'));
    }, { once: true });
    
    audio.play().catch(reject);
  });
};

// FONCTION FALLBACK: Synthèse vocale navigateur ULTRA-ROBUSTE
const playWithBrowserSynthesisRobust = async (text: string, signal: AbortSignal): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      console.warn('⚠️ Synthèse vocale non supportée');
      resolve();
      return;
    }

    if (signal.aborted) {
      reject(new DOMException('Synthesis aborted', 'AbortError'));
      return;
    }

    console.log('🗣️ FALLBACK: Synthèse vocale navigateur:', text);
    
    // Arrêter toute synthèse en cours
    window.speechSynthesis.cancel();
    
    // Attendre un peu pour que le cancel soit effectif
    setTimeout(() => {
      if (signal.aborted) {
        reject(new DOMException('Synthesis aborted', 'AbortError'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      let isResolved = false;

      // Gestionnaire d'annulation
      const abortHandler = () => {
        if (!isResolved) {
          window.speechSynthesis.cancel();
          isResolved = true;
          reject(new DOMException('Synthesis aborted', 'AbortError'));
        }
      };

      signal.addEventListener('abort', abortHandler);

      // TIMEOUT GÉNÉREUX pour éviter les coupures
      const timeout = setTimeout(() => {
        if (!isResolved) {
          console.warn('⚠️ Timeout synthèse vocale - résolution forcée');
          window.speechSynthesis.cancel();
          isResolved = true;
          signal.removeEventListener('abort', abortHandler);
          resolve();
        }
      }, 15000); // 15 secondes pour laisser le temps de finir

      utterance.onend = () => {
        if (!isResolved) {
          clearTimeout(timeout);
          isResolved = true;
          signal.removeEventListener('abort', abortHandler);
          console.log('✅ FALLBACK: Synthèse vocale terminée');
          resolve();
        }
      };

      utterance.onerror = (error) => {
        if (!isResolved) {
          clearTimeout(timeout);
          isResolved = true;
          signal.removeEventListener('abort', abortHandler);
          console.error('❌ Erreur synthèse vocale:', error);
          resolve(); // Résoudre quand même pour ne pas bloquer
        }
      };

      // Démarrer la synthèse
      try {
        window.speechSynthesis.speak(utterance);
        console.log('🗣️ FALLBACK: Synthèse démarrée');
      } catch (error) {
        if (!isResolved) {
          clearTimeout(timeout);
          isResolved = true;
          signal.removeEventListener('abort', abortHandler);
          console.error('❌ Erreur démarrage synthèse:', error);
          resolve();
        }
      }
    }, 100); // Petit délai pour que le cancel soit effectif
  });
};

// Transcription audio vers texte ULTRA-OPTIMISÉE
export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'fr');
    
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      },
      body: formData
    });

    const result = await response.json();
    return result.text || '';
  } catch (error) {
    throw error;
  }
};

// Fonction legacy pour compatibilité
export const generateAIResponse = generateAIResponseFast;

// Helper function to safely extract JSON from AI response
const extractJsonFromResponse = (response: string): any => {
  try {
    // First, try direct parsing
    return JSON.parse(response);
  } catch (error) {
    // Method 1: Look for JSON code blocks
    const codeBlockMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1]);
      } catch (e) {
      }
    }
    
    // Method 2: Find first { and last } to extract JSON object
    const firstBrace = response.indexOf('{');
    const lastBrace = response.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        const jsonString = response.substring(firstBrace, lastBrace + 1);
        return JSON.parse(jsonString);
      } catch (e) {
      }
    }
    
    // Method 3: Try to clean up common JSON issues
    let cleanedResponse = response
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    
    // Find JSON object boundaries more carefully
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        let jsonStr = jsonMatch[0];
        
        // Fix common issues
        jsonStr = jsonStr
          .replace(/,\s*}/g, '}') // Remove trailing commas
          .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
          .replace(/\n/g, ' ') // Replace newlines with spaces
          .replace(/\r/g, '') // Remove carriage returns
          .replace(/\t/g, ' ') // Replace tabs with spaces
          .replace(/\s+/g, ' '); // Normalize whitespace
        
        return JSON.parse(jsonStr);
      } catch (e) {
      }
    }
    
    // If all methods fail, throw the original error
    throw error;
  }
};

// NOUVELLE FONCTION: Analyse CENTRÉE sur la PERFORMANCE DU COMMERCIAL
export const analyzeCall = async (
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  target: string,
  difficulty: string,
  duration: number
): Promise<CallAnalysis> => {
  try {
    // ANALYSE PRÉLIMINAIRE: Métriques de performance du commercial
    const userMessages = conversationHistory.filter(msg => msg.role === 'user');
    const aiMessages = conversationHistory.filter(msg => msg.role === 'assistant');
    const totalUserWords = userMessages.reduce((total, msg) => total + msg.content.split(' ').length, 0);
    const userText = userMessages.map(msg => msg.content).join(' ').toLowerCase();
    
    // ANALYSE DES TECHNIQUES COMMERCIALES UTILISÉES PAR L'UTILISATEUR
    const hasPresentation = userText.includes('bonjour') || userText.includes('je suis') || userText.includes('je m\'appelle');
    const hasCompanyMention = userText.includes('entreprise') || userText.includes('société') || userText.includes('ring') || userText.includes('académie');
    const hasValueProposition = userText.includes('formation') || userText.includes('améliorer') || userText.includes('performance') || userText.includes('commercial') || userText.includes('accompagne');
    const hasTimeRequest = userText.includes('30 secondes') || userText.includes('minute') || userText.includes('temps') || userText.includes('disponible');
    const hasRdvRequest = userText.includes('rendez-vous') || userText.includes('rdv') || userText.includes('rencontrer') || userText.includes('se voir');
    const hasObjectionHandling = userText.includes('gratuit') || userText.includes('efficace') || userText.includes('internet') || userText.includes('linkedin');
    
    // DÉTECTION DU RÉSULTAT OBTENU PAR LE COMMERCIAL
    const hasTransferSuccess = aiMessages.some(msg => 
      msg.content.includes('transfère') || 
      msg.content.includes('transfert') ||
      msg.content.includes('Je vous transfère')
    );
    
    const hasEmailGiven = aiMessages.some(msg => 
      msg.content.includes('@') || 
      msg.content.includes('email') ||
      msg.content.includes('sophie.laurent@')
    );
    
    const hasPhoneGiven = aiMessages.some(msg => 
      /\d{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}/.test(msg.content)
    );
    
    const hasRdvAccepted = aiMessages.some(msg => 
      msg.content.includes('rendez-vous') || 
      msg.content.includes('se voir') ||
      msg.content.includes('mardi') ||
      msg.content.includes('jeudi') ||
      msg.content.includes('vendredi') ||
      /\d{1,2}h/.test(msg.content)
    );

    // DÉFINITION DU SUCCÈS selon le prospect
    let objectiveAchieved = false;
    let objectiveDescription = '';
    
    if (target === 'secretary') {
      if (difficulty === 'easy') {
        objectiveAchieved = hasTransferSuccess;
        objectiveDescription = 'être transféré vers la décisionnaire';
      } else if (difficulty === 'medium') {
        objectiveAchieved = hasEmailGiven || hasPhoneGiven;
        objectiveDescription = 'obtenir les coordonnées de la décisionnaire';
      } else {
        objectiveAchieved = false; // En mode difficile, aucune coordonnée donnée
        objectiveDescription = 'obtenir un contact (impossible en mode difficile)';
      }
    } else {
      // Pour tous les autres prospects, l'objectif est le RDV
      objectiveAchieved = hasRdvAccepted;
      objectiveDescription = 'obtenir un rendez-vous';
    }

    // SCORING BASÉ SUR LES TECHNIQUES COMMERCIALES DU COMMERCIAL
    let baseScore = 0;
    
    // 1. PARTICIPATION ET ENGAGEMENT (20 points max)
    if (userMessages.length === 0) {
      baseScore = 0; // Aucune participation
    } else {
      if (userMessages.length >= 1) baseScore += 5;
      if (userMessages.length >= 3) baseScore += 5;
      if (userMessages.length >= 5) baseScore += 5;
      if (totalUserWords >= 20) baseScore += 5;
    }
    
    // 2. TECHNIQUES COMMERCIALES FONDAMENTALES (40 points max)
    if (hasPresentation) baseScore += 10; // Présentation = CRITIQUE
    if (hasCompanyMention) baseScore += 8; // Mention entreprise
    if (hasValueProposition) baseScore += 12; // Proposition de valeur = ESSENTIEL
    if (hasTimeRequest) baseScore += 5; // Demande de temps
    if (hasRdvRequest) baseScore += 5; // Demande explicite
    
    // 3. GESTION DES OBJECTIONS (15 points max)
    if (hasObjectionHandling) baseScore += 15; // Réponse aux objections
    
    // 4. RÉSULTAT OBTENU (25 points max)
    if (objectiveAchieved) {
      baseScore += 25; // BONUS MAJEUR pour objectif atteint
    }
    
    // 5. BONUS durée appropriée (5 points max)
    if (duration >= 30) baseScore += 2;
    if (duration >= 60) baseScore += 2;
    if (duration >= 120) baseScore += 1;
    
    // 6. AJUSTEMENT selon difficulté
    const difficultyMultiplier = {
      'easy': 1.0,
      'medium': 1.05,   // Bonus 5% pour difficulté moyenne
      'hard': 1.1       // Bonus 10% pour difficulté élevée
    };
    baseScore = Math.floor(baseScore * (difficultyMultiplier[difficulty as keyof typeof difficultyMultiplier] || 1.0));
    
    // 7. PLAFOND selon objectif
    const maxScore = objectiveAchieved ? 95 : 75;
    const preliminaryScore = Math.min(maxScore, Math.max(0, baseScore));
    
    // PROMPT D'ANALYSE CENTRÉ SUR LA PERFORMANCE DU COMMERCIAL
    const getAnalysisPrompt = () => {
      const prospectName = target === 'secretary' ? 'secrétaire Marie Dubois' : 
                          target === 'hr' ? 'DRH Pierre Martin' : 
                          target === 'manager' ? 'chef d\'entreprise Sophie Laurent' : 
                          'commercial Thomas Durand';
      
      return `Analyse la PERFORMANCE COMMERCIALE de l'utilisateur dans cette conversation téléphonique.

CONTEXTE:
- Prospect contacté: ${prospectName}
- Niveau de difficulté: ${difficulty === 'easy' ? 'Facile' : difficulty === 'medium' ? 'Moyen' : 'Difficile'}
- Durée: ${Math.floor(duration / 60)}min ${duration % 60}s
- Messages du commercial: ${userMessages.length}
- Mots prononcés: ${totalUserWords}

OBJECTIF DU COMMERCIAL: ${objectiveDescription}
RÉSULTAT: ${objectiveAchieved ? '✅ OBJECTIF ATTEINT' : '❌ OBJECTIF NON ATTEINT'}

TECHNIQUES COMMERCIALES UTILISÉES PAR LE COMMERCIAL:
${hasPresentation ? '✅' : '❌'} Présentation personnelle
${hasCompanyMention ? '✅' : '❌'} Mention de l'entreprise
${hasValueProposition ? '✅' : '❌'} Proposition de valeur
${hasTimeRequest ? '✅' : '❌'} Demande de temps/disponibilité
${hasRdvRequest ? '✅' : '❌'} Demande explicite de RDV/contact
${hasObjectionHandling ? '✅' : '❌'} Gestion des objections

CONVERSATION (focus sur les messages du COMMERCIAL):
${conversationHistory.map(msg => `${msg.role === 'user' ? '👤 COMMERCIAL' : '🎯 PROSPECT'}: ${msg.content}`).join('\n')}

MISSION: Évalue UNIQUEMENT la performance du COMMERCIAL (utilisateur), pas celle du prospect.

CRITÈRES D'ÉVALUATION DU COMMERCIAL:
- 0-20: Performance très faible (pas de technique commerciale)
- 21-40: Performance insuffisante (techniques de base manquantes)
- 41-60: Performance correcte (bonnes bases mais objectif non atteint)
- 61-75: Bonne performance (techniques maîtrisées mais objectif non atteint)
- 76-85: Très bonne performance (techniques excellentes, objectif atteint)
- 86-95: Performance exceptionnelle (maîtrise parfaite, objectif atteint avec brio)

IMPORTANT: 
- Focus sur ce que le COMMERCIAL a bien fait ou mal fait
- Si l'objectif est atteint, score minimum 76/100
- Si l'objectif n'est pas atteint, score maximum 75/100
- Les points forts/améliorations concernent les TECHNIQUES du commercial
- Les recommandations aident le commercial à s'améliorer`;
    };

    const analysisPrompt = `${getAnalysisPrompt()}

Score préliminaire calculé: ${preliminaryScore}

Réponds UNIQUEMENT en JSON valide, sans formatage markdown, sans commentaires:
{
  "score": ${preliminaryScore},
  "strengths": ["max 3 points forts CONCRETS de ta prospection téléphonique"],
  "improvements": ["max 3 axes d'amélioration SPÉCIFIQUES pour tes prochains appels"],
  "recommendations": ["max 3 recommandations PRATIQUES pour améliorer ta prise de RDV"],
  "detailedFeedback": "feedback détaillé sur la performance commerciale de l'utilisateur en français"
}`;

    const response = await fetch(OPENAI_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'chatCompletion',
        payload: {
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: analysisPrompt }],
          max_tokens: 400,
          temperature: 0.1,
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de l\'analyse avec OpenAI');
    }

    const completion = await response.json();

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) throw new Error('Pas de réponse de l\'IA pour l\'analyse');

    const analysis = extractJsonFromResponse(responseContent);
    
    // VALIDATION: Le score IA doit respecter les règles d'objectif
    let finalScore = analysis.score || preliminaryScore;
    
    if (objectiveAchieved) {
      finalScore = Math.max(76, Math.min(95, finalScore)); // Minimum 76 si objectif atteint
    } else {
      finalScore = Math.min(75, Math.max(0, finalScore)); // Maximum 75 si objectif non atteint
    }
    
    // FEEDBACK ADAPTÉ selon la performance du commercial
    let adaptedFeedback = analysis.detailedFeedback || '';
    if (target === 'secretary' && objectiveAchieved) {
      if (difficulty === 'easy' && hasTransferSuccess) {
        adaptedFeedback += ' Félicitations ! Votre approche commerciale a convaincu la secrétaire de vous transférer. Pour travailler la prise de RDV directe, choisissez un autre type de prospect.';
      } else if (difficulty === 'medium' && (hasEmailGiven || hasPhoneGiven)) {
        adaptedFeedback += ' Excellent ! Votre argumentation a convaincu la secrétaire de vous donner les coordonnées. Vous pouvez maintenant contacter directement la décisionnaire.';
      }
    } else if (objectiveAchieved && target !== 'secretary') {
      adaptedFeedback += ' Bravo ! Votre technique commerciale a permis d\'obtenir le rendez-vous. Continuez à perfectionner vos compétences.';
    }
    
    return {
      score: finalScore,
      strengths: Array.isArray(analysis.strengths) ? analysis.strengths.slice(0, 3) : (finalScore > 40 ? ['Tu as maintenu la conversation', 'Effort de communication visible'] : []),
      improvements: Array.isArray(analysis.improvements) ? analysis.improvements.slice(0, 3) : ['Travaille ta présentation personnelle', 'Développe ta proposition de valeur', 'Prépare mieux tes arguments'],
      recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations.slice(0, 3) : ['Pratique ton pitch de 30 secondes', 'Prépare tes réponses aux objections courantes', 'Entraîne-toi à demander clairement un RDV'],
      detailedFeedback: adaptedFeedback
    };
  } catch (error) {
    // Fallback centré sur la performance du commercial
    const userMessages = conversationHistory.filter(msg => msg.role === 'user');
    const totalWords = userMessages.reduce((total, msg) => total + msg.content.split(' ').length, 0);
    const userText = userMessages.map(msg => msg.content).join(' ').toLowerCase();
    
    const hasBasicTechniques = userText.includes('bonjour') || userText.includes('je suis') || userText.includes('formation');
    
    let fallbackScore = 0;
    if (userMessages.length === 0) fallbackScore = 0;
    else if (userMessages.length === 1 && totalWords < 10) fallbackScore = 15;
    else if (totalWords < 25) fallbackScore = 35;
    else fallbackScore = Math.min(60, 25 + userMessages.length * 5);
    
    if (hasBasicTechniques) fallbackScore += 10;
    
    const objectiveText = target === 'secretary' ? 
      (difficulty === 'easy' ? 'transfert' : difficulty === 'medium' ? 'coordonnées' : 'contact') : 
      'rendez-vous';
    
    return {
      score: fallbackScore,
      strengths: fallbackScore > 30 ? ['Tu as pris la parole', 'Effort de communication'] : [],
      improvements: fallbackScore < 40 ? ['Conversation trop courte', 'Manque de structure d\'appel', 'Pas de demande de RDV claire'] : ['Améliore ta présentation', 'Travaille ton argumentation', 'Sois plus direct pour le RDV'],
      recommendations: ['Prépare une accroche de 30 secondes', 'Entraîne-toi à demander un RDV directement', 'Pratique la gestion des objections'],
      detailedFeedback: `Performance commerciale de ${fallbackScore}/100. ${fallbackScore < 40 ? 'Tu dois travailler les bases de la prospection téléphonique.' : 'Tu as les bases mais dois perfectionner tes techniques.'} L'objectif était d'obtenir un ${objectiveText}. Continue à t'entraîner pour améliorer tes compétences commerciales.`
    };
  }
};