  onTextReady?: (text: string) => void
// Service pour la gestion des appels téléphoniques simulés - ULTRA-OPTIMISÉ avec transcription continue
export class PhoneCallService {
  private mediaRecorder: MediaRecorder | null = null;
      console.log('🎵 Phrase finale du buffer:', sentenceBuffer);
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private isRecording = false;
  console.log('📡 Début traitement streaming...');

  private onTranscriptionCallback?: (text: string) => void;
  private silenceTimer: NodeJS.Timeout | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  let hasStartedProcessing = false;
  
  console.log('✅ Message IA final:', cleanMessage, 'shouldEndCall:', shouldEndCall);
  
  // Callback final avec le texte complet
  if (onTextReady && cleanMessage) {
    onTextReady(cleanMessage);
  }
  
  // NOUVEAU: Reconnaissance vocale continue avec interimResults
  private recognition: any = null;
  private isListening = false;
  private currentTranscript = '';
  private finalTranscript = '';
  private lastSentenceTime = 0;
  private sentenceEndTimer: NodeJS.Timeout | null = null;
  private lastSentMessage = ''; // Protection contre les doublons
  private isProcessingMessage = false; // NOUVEAU: Protection contre les envois multiples
  private isAISpeaking = false; // CRITIQUE: Savoir si l'IA parle pour ignorer la reconnaissance

  constructor() {
    this.setupAudioContext();
    this.setupSpeechRecognition();
  }

  private setupAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('AudioContext non supporté:', error);
    }
  }

  // NOUVEAU: Configuration de la reconnaissance vocale continue
  private setupSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      // CONFIGURATION ULTRA-RAPIDE
      this.recognition.continuous = true;        // Écoute continue
      this.recognition.interimResults = true;    // Résultats partiels en temps réel
      this.recognition.lang = 'fr-FR';
      this.recognition.maxAlternatives = 1;      // Une seule alternative pour plus de rapidité
      
      this.setupRecognitionHandlers();
      console.log('🎤 ULTRA-FAST: Reconnaissance vocale configurée avec interimResults');
    } else {
      console.warn('⚠️ Reconnaissance vocale non supportée, fallback vers MediaRecorder');
    }
  }

  // NOUVEAU: Gestionnaires d'événements pour la reconnaissance vocale
  private setupRecognitionHandlers() {
    if (!this.recognition) return;

    this.recognition.onresult = (event: any) => {
      // CRITIQUE: Ignorer si l'IA parle
      if (this.isAISpeaking) {
        return;
      }

      let interimTranscript = '';
      let finalTranscript = '';

      // Traiter tous les résultats
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // ULTRA-OPTIMISATION: Détecter fin de phrase en temps réel
      this.processTranscriptInRealTime(finalTranscript, interimTranscript);
    };

    this.recognition.onend = () => {
      // CORRECTION CRITIQUE: Redémarrer automatiquement SEULEMENT si on écoute encore
      if (this.isListening && !this.isAISpeaking) {
        setTimeout(() => {
          if (this.isListening && !this.isAISpeaking) {
            try {
              this.recognition.start();
            } catch (error) {
            }
          }
        }, 100);
      } else {
      }
    };

    this.recognition.onerror = (event: any) => {
      // CORRECTION: Redémarrer même en cas d'erreur pour maintenir la conversation
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        setTimeout(() => {
          if (this.isListening && !this.isAISpeaking) {
            try {
              this.recognition.start();
            } catch (error) {
            }
          }
        }, 500);
      }
    };

    this.recognition.onstart = () => {
    };
  }

  // NOUVEAU: Traitement en temps réel de la transcription
  private processTranscriptInRealTime(finalText: string, interimText: string) {
    // CRITIQUE: Ignorer si l'IA parle
    if (this.isAISpeaking) {
      return;
    }

    // Mettre à jour les transcriptions
    if (finalText) {
      this.finalTranscript += finalText;
    }

    this.currentTranscript = this.finalTranscript + interimText;

    // DÉTECTION ULTRA-RAPIDE de fin de phrase
    if (finalText) {
      this.detectSentenceEnd(this.finalTranscript);
    } else if (interimText && !this.isProcessingMessage) {
      // Même sur les résultats intermédiaires, détecter les pauses
      this.detectPotentialSentenceEnd(this.currentTranscript);
    }
  }

  // NOUVEAU: Détection de fin de phrase sur texte final
  private detectSentenceEnd(text: string) {
    const trimmedText = text.trim();
    
    // Vérifier si c'est une phrase complète
    if (this.isCompleteSentence(trimmedText)) {
      this.sendTranscriptionToAI(trimmedText);
      this.resetTranscription();
    }
  }

  // AMÉLIORATION: Détection potentielle de fin de phrase avec protection
  private detectPotentialSentenceEnd(text: string) {
    if (this.isProcessingMessage || this.isAISpeaking) {
      return;
    }

    const trimmedText = text.trim();
    
    // Annuler le timer précédent
    if (this.sentenceEndTimer) {
      clearTimeout(this.sentenceEndTimer);
    }

    // Si on a du texte et qu'il semble complet, attendre un peu avant d'envoyer
    if (trimmedText.length > 10 && this.isCompleteSentence(trimmedText)) {
      this.sentenceEndTimer = setTimeout(() => {
        if (!this.isProcessingMessage && !this.isAISpeaking) {
          this.sendTranscriptionToAI(trimmedText);
          this.resetTranscription();
        }
      }, 2500); // AUGMENTATION: 2000ms → 2500ms pour éviter les coupures
    }
  }

  // CORRECTION MAJEURE: Vérifier si c'est une phrase complète avec critères ADAPTÉS AU CONTEXTE
  private isCompleteSentence(text: string): boolean {
    if (!text || text.length < 5) return false;

    const lowerText = text.toLowerCase().trim();
    
    // NOUVEAU: Ignorer seulement les fragments très courts sans contexte
    if (lowerText.length < 8 && (
        lowerText === 'oui' || lowerText === 'allô' || lowerText === 'non' ||
        lowerText === 'bonjour' || lowerText === 'bonsoir' || lowerText === 'salut'
    )) {
      return false;
    }

    // Détecter ponctuation de fin
    const endsWithPunctuation = /[.!?]$/.test(text.trim());
    
    // CORRECTION MAJEURE: Phrases de réponse courantes dans un contexte téléphonique
    const phoneResponsePatterns = [
      // Présentations
      /^(bonjour|bonsoir|salut)/i,
      /je suis .+/i,
      /je m'appelle .+/i,
      /c'est .+/i,
      
      // Réponses aux questions
      /j'ai eu .+/i,                    // "j'ai eu votre numéro sur Internet"
      /sur internet/i,                  // "sur Internet"
      /par .+/i,                        // "par un collègue"
      /grâce à .+/i,                    // "grâce à LinkedIn"
      /via .+/i,                        // "via votre site"
      
      // Propositions commerciales
      /j'aimerais .+/i,
      /je voudrais .+/i,
      /pouvez-vous .+/i,
      /est-ce que .+/i,
      /avez-vous .+/i,
      /disponible .+/i,
      /rendez-vous .+/i,
      /nous accompagnons .+/i,
      /on accompagne .+/i,
      /je vous appelle .+/i,
      /organiser .+/i,
      
      // Réponses aux objections
      /c'est gratuit/i,
      /pas cher/i,
      /très efficace/i,
      /ça marche/i,
      /bien sûr/i,
      /exactement/i,
      /tout à fait/i,
      
      // Phrases avec contexte suffisant
      /.+ (sur|par|avec|pour|dans|chez) .+/i  // Phrases avec prépositions = contexte
    ];

    const isPhoneResponse = phoneResponsePatterns.some(pattern => pattern.test(text.trim()));
    
    // CORRECTION: Réduire encore la longueur minimale pour les réponses courtes mais pertinentes
    const hasMinLength = text.trim().length > 12; // RÉDUCTION: 20 → 12 caractères
    
    // NOUVEAU: Accepter les réponses courtes mais contextuelles
    const isShortButContextual = text.trim().length >= 8 && (
      lowerText.includes('internet') ||
      lowerText.includes('linkedin') ||
      lowerText.includes('site') ||
      lowerText.includes('collègue') ||
      lowerText.includes('gratuit') ||
      lowerText.includes('efficace') ||
      lowerText.includes('marche')
    );
    
    // CORRECTION MAJEURE: Accepter plus facilement les phrases pertinentes
    const result = endsWithPunctuation || 
                   (isPhoneResponse && hasMinLength) || 
                   isShortButContextual ||
                   text.trim().length > 40;
    
    return result;
  }

  // AMÉLIORATION CRITIQUE: Envoyer la transcription à l'IA avec protection renforcée
  private sendTranscriptionToAI(text: string) {
    if (!text.trim() || !this.onTranscriptionCallback || this.isProcessingMessage || this.isAISpeaking) {
      return;
    }

    const cleanText = text.trim();
    
    // PROTECTION CONTRE LES DOUBLONS
    if (cleanText === this.lastSentMessage) {
      return;
    }

    const now = Date.now();
    
    // CORRECTION: Réduire le délai minimum entre envois
    if (now - this.lastSentenceTime < 2000) { // RÉDUCTION: 3000ms → 2000ms
      return;
    }

    // MARQUER comme en cours de traitement
    this.isProcessingMessage = true;
    this.lastSentenceTime = now;
    this.lastSentMessage = cleanText;
    
    this.onTranscriptionCallback(cleanText);

    // Libérer après un délai pour permettre le traitement
    setTimeout(() => {
      this.isProcessingMessage = false;
    }, 3000); // RÉDUCTION: 4s → 3s
  }

  // NOUVEAU: Réinitialiser la transcription
  private resetTranscription() {
    this.finalTranscript = '';
    this.currentTranscript = '';
    
    if (this.sentenceEndTimer) {
      clearTimeout(this.sentenceEndTimer);
      this.sentenceEndTimer = null;
    }
  }

  // CORRECTION CRITIQUE: Méthodes pour contrôler l'état de l'IA
  setAISpeaking(speaking: boolean) {
    this.isAISpeaking = speaking;
    
    if (speaking) {
      // Quand l'IA commence à parler, réinitialiser la transcription
      this.resetTranscription();
      this.isProcessingMessage = false;
    }
  }

  // Démarrer l'enregistrement continu ULTRA-OPTIMISÉ
  async startContinuousRecording(onTranscription: (text: string) => void): Promise<void> {
    this.onTranscriptionCallback = onTranscription;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000 // Optimisé pour Whisper
        } 
      });

      // PRIORITÉ: Utiliser la reconnaissance vocale si disponible
      if (this.recognition) {
        this.startSpeechRecognition();
      } else {
        // Fallback vers l'ancienne méthode
        this.setupVoiceActivityDetection();
      }
      
    } catch (error) {
      throw new Error('Impossible d\'accéder au microphone');
    }
  }

  // NOUVEAU: Démarrer la reconnaissance vocale continue
  private startSpeechRecognition() {
    if (!this.recognition) return;

    this.isListening = true;
    this.isAISpeaking = false; // IMPORTANT: Reset de l'état IA
    this.resetTranscription();
    this.lastSentMessage = '';
    console.log('🚀 Démarrage streaming IA...');
    
    // STREAMING CRITIQUE : Paramètres avec streaming activé
    
    try {
      this.recognition.start();
    } catch (error) {
      // Fallback vers l'ancienne méthode
      this.setupVoiceActivityDetection();
    }
  }

  // Méthode fallback (ancienne méthode optimisée)
  private setupVoiceActivityDetection() {
    if (!this.stream || !this.audioContext) return;

    const source = this.audioContext.createMediaStreamSource(this.stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    source.connect(this.analyser);

    this.monitorAudioLevel();
  }

  private monitorAudioLevel() {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const checkAudioLevel = () => {
      if (!this.analyser) return;

      this.analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;

      // ULTRA-OPTIMISATION: Seuil de détection très sensible
      const voiceThreshold = 12; // ULTRA-RÉDUCTION: 15 → 12 pour détecter instantanément

      if (average > voiceThreshold) {
        // Voix détectée
        if (this.silenceTimer) {
          clearTimeout(this.silenceTimer);
          this.silenceTimer = null;
        }
        
        if (!this.isRecording) {
          this.startRecording();
        }
      } else {
        // Silence détecté
        if (this.isRecording && !this.silenceTimer) {
          this.silenceTimer = setTimeout(() => {
            this.stopRecordingAndTranscribe();
          }, 600); // AMÉLIORATION: 800ms → 600ms pour transcription plus rapide
        }
      }

      requestAnimationFrame(checkAudioLevel);
    };

    checkAudioLevel();
  }

  private startRecording() {
    if (!this.stream || this.isRecording) return;

    this.audioChunks = [];
    
    try {
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
    } catch (error) {
      // Fallback pour Safari
      this.mediaRecorder = new MediaRecorder(this.stream);
    }

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      this.processRecording();
    };

    this.mediaRecorder.start();
    this.isRecording = true;
  }

  private stopRecordingAndTranscribe() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
  }

  private async processRecording() {
    if (this.audioChunks.length === 0) return;

    const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
    
    // ULTRA-OPTIMISATION: Taille minimale encore plus petite
    if (audioBlob.size < 500) { // OPTIMISATION: 600 → 500 pour accepter encore plus d'audio court
      return;
    }

    try {
      const { transcribeAudio } = await import('./openai');
      
      // AMÉLIORATION CRITIQUE: Transcription avec timeout pour éviter les blocages
      const transcriptionPromise = transcribeAudio(audioBlob);
      const timeoutPromise = new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error('Transcription timeout')), 2000); // OPTIMISATION: 2.5s → 2s
      });
      
      const transcription = await Promise.race([transcriptionPromise, timeoutPromise]);
      
      if (transcription.trim() && this.onTranscriptionCallback) {
        this.onTranscriptionCallback(transcription.trim());
      } else {
      }
    } catch (error) {
      // En cas d'erreur, on continue sans bloquer
    }
  }

  // Jouer la sonnerie ULTRA-RAPIDE
  async playRingtone(): Promise<void> {
    return new Promise((resolve) => {
      // Créer une sonnerie synthétique
      if (!this.audioContext) {
        setTimeout(resolve, 1000); // RÉDUCTION: 1200ms → 1000ms
        return;
      }

      // Première sonnerie
      this.playRingTone();
      
      // Deuxième sonnerie après 0.7s
      setTimeout(() => {
        this.playRingTone();
        setTimeout(() => {
          resolve();
        }, 1200); // OPTIMISATION: 1500ms → 1200ms pour démarrage plus rapide
      }, 700); // RÉDUCTION: 800ms → 700ms
      
      console.log('✅ Streaming terminé');
    });
  }

  private playRingTone() {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Fréquences de sonnerie classique
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime + 0.15); // OPTIMISATION: 0.2 → 0.15
    
    // Volume
    gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + 0.3); // OPTIMISATION: 0.4 → 0.3

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.3); // OPTIMISATION: 0.4 → 0.3
  }

  // Arrêter l'enregistrement
  stopRecording() {
    // Arrêter la reconnaissance vocale
    if (this.recognition && this.isListening) {
      this.isListening = false;
      try {
        this.recognition.stop();
      } catch (error) {
      }
    }

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    if (this.sentenceEndTimer) {
      clearTimeout(this.sentenceEndTimer);
      this.sentenceEndTimer = null;
    }

    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
      });
      this.stream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().then(() => {
      });
      this.audioContext = null;
    }

    this.resetTranscription();
    this.lastSentMessage = '';
    this.isProcessingMessage = false;
    this.isAISpeaking = false;
  }

  // Vérifier le support
  isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && 
             (window.MediaRecorder || 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window));
  }
}

async function processStreamingResponse(
  response: Response,
  target: string,
  onPartialText?: (text: string) => void,
  onSentenceReadyForAudio?: (sentence: string) => void,
  onTextReady?: (text: string) => void
) {
  let hasStartedProcessing = false;
  
  return await processStreamingResponse(response, target, onPartialText, onSentenceReadyForAudio, onTextReady);
  
  if (!hasStartedProcessing) {
    hasStartedProcessing = true;
    console.log('🎯 Premier contenu reçu, démarrage traitement...');
  }
  
  console.log('🎵 Phrase complète détectée:', sentence);
}
