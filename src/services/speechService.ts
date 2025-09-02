// Service de synthèse vocale et reconnaissance vocale
export class SpeechService {
  private synthesis: SpeechSynthesis;
  private recognition: SpeechRecognition | null = null;
  private isListening = false;

  constructor() {
    this.synthesis = window.speechSynthesis;
    
    // Configuration de la reconnaissance vocale si disponible
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'fr-FR';
    }
  }

  // Synthèse vocale
  speak(text: string, emotion: 'neutral' | 'interested' | 'skeptical' | 'annoyed' | 'positive' = 'neutral'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Synthèse vocale non supportée'));
        return;
      }

      // Arrêter toute synthèse en cours
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      
      // Adapter la voix selon l'émotion
      switch (emotion) {
        case 'interested':
          utterance.rate = 1.1;
          utterance.pitch = 1.1;
          break;
        case 'skeptical':
          utterance.rate = 0.9;
          utterance.pitch = 0.9;
          break;
        case 'annoyed':
          utterance.rate = 1.2;
          utterance.pitch = 0.8;
          break;
        case 'positive':
          utterance.rate = 1.0;
          utterance.pitch = 1.2;
          break;
        default:
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(event.error);

      this.synthesis.speak(utterance);
    });
  }

  // Reconnaissance vocale
  startListening(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Reconnaissance vocale non supportée'));
        return;
      }

      if (this.isListening) {
        reject(new Error('Écoute déjà en cours'));
        return;
      }

      this.isListening = true;

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.isListening = false;
        resolve(transcript);
      };

      this.recognition.onerror = (event) => {
        this.isListening = false;
        reject(new Error(`Erreur reconnaissance vocale: ${event.error}`));
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };

      this.recognition.start();
    });
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  isSupported(): boolean {
    return !!(this.synthesis && this.recognition);
  }

  isSpeechSynthesisSupported(): boolean {
    return !!this.synthesis;
  }

  isSpeechRecognitionSupported(): boolean {
    return !!this.recognition;
  }
}

// Types pour TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const speechService = new SpeechService();