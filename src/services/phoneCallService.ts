// Service pour la gestion des appels téléphoniques simulés
export class PhoneCallService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private isRecording = false;
  private onTranscriptionCallback?: (text: string) => void;
  private silenceTimer: NodeJS.Timeout | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private isAISpeaking = false;

  constructor() {
    this.setupAudioContext();
  }

  private setupAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('AudioContext non supporté:', error);
    }
  }

  setAISpeaking(speaking: boolean) {
    this.isAISpeaking = speaking;
    console.log('🤖 IA speaking state:', speaking);
  }

  async requestMicrophonePermission(): Promise<boolean> {
    try {
      console.log('🎤 Demande d\'autorisation du microphone...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      });

      stream.getTracks().forEach(track => {
        track.stop();
      });

      console.log('✅ Permission du microphone accordée');
      return true;
    } catch (error) {
      console.warn('❌ Permission du microphone refusée ou erreur:', error);
      return false;
    }
  }

  async startContinuousRecording(onTranscription: (text: string) => void): Promise<void> {
    this.onTranscriptionCallback = onTranscription;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      });

      this.setupVoiceActivityDetection();

    } catch (error) {
      throw new Error('Impossible d\'accéder au microphone');
    }
  }

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

      const voiceThreshold = 15;

      if (average > voiceThreshold && !this.isAISpeaking) {
        if (this.silenceTimer) {
          clearTimeout(this.silenceTimer);
          this.silenceTimer = null;
        }

        if (!this.isRecording) {
          this.startRecording();
        }
      } else {
        if (this.isRecording && !this.silenceTimer) {
          this.silenceTimer = setTimeout(() => {
            this.stopRecordingAndTranscribe();
          }, 800);
        }
      }

      requestAnimationFrame(checkAudioLevel);
    };

    checkAudioLevel();
  }

  private startRecording() {
    if (!this.stream || this.isRecording || this.isAISpeaking) return;

    this.audioChunks = [];

    try {
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
    } catch (error) {
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
    console.log('🎤 Enregistrement démarré');
  }

  private stopRecordingAndTranscribe() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      console.log('🎤 Enregistrement arrêté');
    }
  }

  private async processRecording() {
    if (this.audioChunks.length === 0) return;

    const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });

    if (audioBlob.size < 600) {
      console.log('⚠️ Audio trop court, ignoré');
      return;
    }

    console.log('📤 Envoi audio pour transcription, taille:', audioBlob.size);

    try {
      const { transcribeAudio } = await import('./openai');

      const transcriptionPromise = transcribeAudio(audioBlob);
      const timeoutPromise = new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error('Transcription timeout')), 5000);
      });

      const transcription = await Promise.race([transcriptionPromise, timeoutPromise]);

      if (transcription.trim() && this.onTranscriptionCallback && !this.isAISpeaking) {
        console.log('✅ Transcription reçue:', transcription);
        this.onTranscriptionCallback(transcription.trim());
      }
    } catch (error) {
      console.error('❌ Erreur transcription:', error);
    }
  }

  async playRingtone(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.audioContext) {
        setTimeout(resolve, 3000);
        return;
      }

      this.playRingTone();

      setTimeout(() => {
        this.playRingTone();
      }, 1000);

      setTimeout(() => {
        this.playRingTone();
      }, 2000);

      setTimeout(() => {
        resolve();
      }, 3000);
    });
  }

  private playRingTone() {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime + 0.2);

    gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + 0.4);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.4);
  }

  stopRecording() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
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
      this.audioContext.close();
      this.audioContext = null;
    }

    this.isAISpeaking = false;
    console.log('🛑 Service d\'enregistrement arrêté');
  }

  isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  }
}

export const phoneCallService = new PhoneCallService();
