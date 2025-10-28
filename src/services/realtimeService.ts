const REALTIME_SESSION_URL = '/.netlify/functions/openai-realtime-session';

export interface RealtimeConfig {
  target: string;
  difficulty: string;
  voice: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type ErrorType =
  | 'microphone_permission_denied'
  | 'microphone_not_found'
  | 'session_creation_failed'
  | 'webrtc_connection_failed'
  | 'network_error'
  | 'openai_api_error'
  | 'unknown_error';

export interface DetailedError {
  type: ErrorType;
  message: string;
  details?: string;
}

export class RealtimeService {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private conversationHistory: ConversationMessage[] = [];
  private isConnected = false;
  private sessionId: string | null = null;
  private lastError: DetailedError | null = null;

  private onConversationUpdateCallback?: (history: ConversationMessage[]) => void;
  private onStateChangeCallback?: (state: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
  private onAIStateChangeCallback?: (state: 'listening' | 'thinking' | 'speaking') => void;
  private onErrorCallback?: (error: DetailedError) => void;

  constructor() {
    this.audioElement = new Audio();
    this.audioElement.autoplay = true;
  }

  private createError(type: ErrorType, message: string, details?: string): DetailedError {
    return { type, message, details };
  }

  private handleError(error: DetailedError): void {
    this.lastError = error;
    console.error(`❌ ${error.type}:`, error.message, error.details || '');
    this.onErrorCallback?.(error);
    this.onStateChangeCallback?.('error');
  }

  async checkMicrophonePermissions(): Promise<{ granted: boolean; error?: DetailedError }> {
    try {
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });

      if (permissionStatus.state === 'denied') {
        const error = this.createError(
          'microphone_permission_denied',
          'Permissions microphone refusées',
          'Veuillez autoriser l\'accès au microphone dans les paramètres de votre navigateur'
        );
        return { granted: false, error };
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return { granted: true };
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          const error = this.createError(
            'microphone_permission_denied',
            'Permissions microphone refusées',
            'Cliquez sur l\'icône de cadenas dans la barre d\'adresse pour autoriser le microphone'
          );
          return { granted: false, error };
        } else if (err.name === 'NotFoundError') {
          const error = this.createError(
            'microphone_not_found',
            'Aucun microphone détecté',
            'Veuillez brancher un microphone et réessayer'
          );
          return { granted: false, error };
        }
        throw err;
      }
    } catch (err: any) {
      const error = this.createError(
        'unknown_error',
        'Erreur lors de la vérification des permissions',
        err.message
      );
      return { granted: false, error };
    }
  }

  async startSession(config: RealtimeConfig): Promise<void> {
    try {
      console.log('🚀 Starting Realtime API session...');
      this.onStateChangeCallback?.('connecting');

      const micCheck = await this.checkMicrophonePermissions();
      if (!micCheck.granted) {
        this.handleError(micCheck.error!);
        throw new Error(micCheck.error!.message);
      }

      console.log('✅ Microphone permissions granted');

      const response = await fetch(REALTIME_SESSION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        const error = this.createError(
          response.status === 401 || response.status === 403
            ? 'openai_api_error'
            : 'session_creation_failed',
          'Échec de création de la session',
          errorData.error || errorData.details || `HTTP ${response.status}`
        );
        this.handleError(error);
        throw new Error(error.message);
      }

      const { clientSecret, sessionId } = await response.json();
      this.sessionId = sessionId;

      console.log('✅ Ephemeral session created:', sessionId);

      await this.setupWebRTC(clientSecret);
    } catch (error: any) {
      if (!this.lastError) {
        const detailedError = this.createError(
          'network_error',
          'Erreur réseau',
          error.message || 'Impossible de se connecter au serveur'
        );
        this.handleError(detailedError);
      }
      throw error;
    }
  }

  private async setupWebRTC(clientSecret: string): Promise<void> {
    try {
      console.log('🔌 Setting up WebRTC connection...');

      this.peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          const error = this.createError(
            'microphone_permission_denied',
            'Permissions microphone refusées',
            'Autorisez le microphone pour continuer'
          );
          this.handleError(error);
          throw error;
        } else if (err.name === 'NotFoundError') {
          const error = this.createError(
            'microphone_not_found',
            'Aucun microphone détecté',
            'Veuillez brancher un microphone'
          );
          this.handleError(error);
          throw error;
        }
        throw err;
      }

      mediaStream.getTracks().forEach(track => {
        this.peerConnection?.addTrack(track, mediaStream);
      });

      this.peerConnection.ontrack = (event) => {
        console.log('🎵 Received remote audio track');
        if (this.audioElement && event.streams[0]) {
          this.audioElement.srcObject = event.streams[0];
        }
      };

      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('🧊 ICE candidate:', event.candidate);
        }
      };

      this.peerConnection.oniceconnectionstatechange = () => {
        const state = this.peerConnection?.iceConnectionState;
        console.log('🔗 ICE connection state:', state);

        if (state === 'connected' || state === 'completed') {
          this.isConnected = true;
          this.onStateChangeCallback?.('connected');
          this.onAIStateChangeCallback?.('speaking');
        } else if (state === 'disconnected') {
          this.isConnected = false;
          this.onStateChangeCallback?.('disconnected');
        } else if (state === 'failed') {
          this.isConnected = false;
          const error = this.createError(
            'webrtc_connection_failed',
            'Échec de connexion WebRTC',
            'La connexion audio n\'a pas pu être établie'
          );
          this.handleError(error);
        }
      };

      this.dataChannel = this.peerConnection.createDataChannel('oai-events', {
        ordered: true,
      });

      this.setupDataChannel();

      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      console.log('📤 Sending SDP offer to OpenAI...');

      let sdpResponse: Response;
      try {
        sdpResponse = await fetch('https://api.openai.com/v1/realtime', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${clientSecret}`,
            'Content-Type': 'application/sdp',
          },
          body: offer.sdp,
        });
      } catch (err: any) {
        const error = this.createError(
          'network_error',
          'Erreur réseau',
          'Impossible de se connecter à OpenAI. Vérifiez votre connexion Internet.'
        );
        this.handleError(error);
        throw error;
      }

      if (!sdpResponse.ok) {
        const error = this.createError(
          'openai_api_error',
          'Erreur API OpenAI',
          `Échec d'échange SDP: ${sdpResponse.status}`
        );
        this.handleError(error);
        throw error;
      }

      const answerSdp = await sdpResponse.text();
      console.log('📥 Received SDP answer from OpenAI');

      await this.peerConnection.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp,
      });

      console.log('✅ WebRTC connection established');
    } catch (error: any) {
      if (!this.lastError) {
        const detailedError = this.createError(
          'webrtc_connection_failed',
          'Erreur de connexion WebRTC',
          error.message
        );
        this.handleError(detailedError);
      }
      throw error;
    }
  }

  private setupDataChannel(): void {
    if (!this.dataChannel) return;

    this.dataChannel.onopen = () => {
      console.log('📡 Data channel opened');
    };

    this.dataChannel.onclose = () => {
      console.log('📡 Data channel closed');
    };

    this.dataChannel.onerror = (error) => {
      console.error('📡 Data channel error:', error);
    };

    this.dataChannel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleRealtimeEvent(message);
      } catch (error) {
        console.error('❌ Error parsing data channel message:', error);
      }
    };
  }

  private handleRealtimeEvent(event: any): void {
    console.log('📨 Realtime event:', event.type);

    switch (event.type) {
      case 'conversation.item.created':
        if (event.item?.type === 'message') {
          const role = event.item.role;
          const content = event.item.content?.[0]?.transcript || '';

          if (content && role) {
            this.conversationHistory.push({ role, content });
            this.onConversationUpdateCallback?.(this.conversationHistory);
          }
        }
        break;

      case 'response.audio.delta':
        break;

      case 'response.audio_transcript.delta':
        break;

      case 'response.audio_transcript.done':
        if (event.transcript) {
          const lastMessage = this.conversationHistory[this.conversationHistory.length - 1];
          if (!lastMessage || lastMessage.role !== 'assistant') {
            this.conversationHistory.push({
              role: 'assistant',
              content: event.transcript
            });
            this.onConversationUpdateCallback?.(this.conversationHistory);
          }
        }
        break;

      case 'input_audio_buffer.speech_started':
        console.log('🎤 User started speaking');
        this.onAIStateChangeCallback?.('listening');
        break;

      case 'input_audio_buffer.speech_stopped':
        console.log('🎤 User stopped speaking');
        this.onAIStateChangeCallback?.('thinking');
        break;

      case 'response.audio.done':
        console.log('🔊 AI finished speaking');
        this.onAIStateChangeCallback?.('listening');
        break;

      case 'response.done':
        console.log('✅ Response completed');
        this.onAIStateChangeCallback?.('listening');
        break;

      case 'error':
        console.error('❌ Realtime API error:', event.error);
        this.onStateChangeCallback?.('error');
        break;

      case 'input_audio_buffer.committed':
        const transcript = event.transcript || '';
        if (transcript) {
          const lastMessage = this.conversationHistory[this.conversationHistory.length - 1];
          if (!lastMessage || lastMessage.role !== 'user') {
            this.conversationHistory.push({
              role: 'user',
              content: transcript
            });
            this.onConversationUpdateCallback?.(this.conversationHistory);
          }
        }
        break;
    }
  }

  onConversationUpdate(callback: (history: ConversationMessage[]) => void): void {
    this.onConversationUpdateCallback = callback;
  }

  onStateChange(callback: (state: 'connecting' | 'connected' | 'disconnected' | 'error') => void): void {
    this.onStateChangeCallback = callback;
  }

  onAIStateChange(callback: (state: 'listening' | 'thinking' | 'speaking') => void): void {
    this.onAIStateChangeCallback = callback;
  }

  onError(callback: (error: DetailedError) => void): void {
    this.onErrorCallback = callback;
  }

  getConversationHistory(): ConversationMessage[] {
    return this.conversationHistory;
  }

  getLastError(): DetailedError | null {
    return this.lastError;
  }

  async endSession(): Promise<void> {
    console.log('🛑 Ending session...');

    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.srcObject = null;
    }

    this.isConnected = false;
    this.onStateChangeCallback?.('disconnected');
    console.log('✅ Session ended');
  }

  isSessionActive(): boolean {
    return this.isConnected;
  }
}
