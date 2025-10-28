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

export class RealtimeService {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private conversationHistory: ConversationMessage[] = [];
  private isConnected = false;
  private sessionId: string | null = null;

  private onConversationUpdateCallback?: (history: ConversationMessage[]) => void;
  private onStateChangeCallback?: (state: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
  private onAIStateChangeCallback?: (state: 'listening' | 'thinking' | 'speaking') => void;

  constructor() {
    this.audioElement = new Audio();
    this.audioElement.autoplay = true;
  }

  async startSession(config: RealtimeConfig): Promise<void> {
    try {
      console.log('🚀 Starting Realtime API session...');
      this.onStateChangeCallback?.('connecting');

      const response = await fetch(REALTIME_SESSION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create session');
      }

      const { clientSecret, sessionId } = await response.json();
      this.sessionId = sessionId;

      console.log('✅ Ephemeral session created:', sessionId);

      await this.setupWebRTC(clientSecret);
    } catch (error) {
      console.error('❌ Error starting session:', error);
      this.onStateChangeCallback?.('error');
      throw error;
    }
  }

  private async setupWebRTC(clientSecret: string): Promise<void> {
    try {
      console.log('🔌 Setting up WebRTC connection...');

      this.peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

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
        } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
          this.isConnected = false;
          this.onStateChangeCallback?.('disconnected');
        }
      };

      this.dataChannel = this.peerConnection.createDataChannel('oai-events', {
        ordered: true,
      });

      this.setupDataChannel();

      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      console.log('📤 Sending SDP offer to OpenAI...');

      const sdpResponse = await fetch('https://api.openai.com/v1/realtime', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${clientSecret}`,
          'Content-Type': 'application/sdp',
        },
        body: offer.sdp,
      });

      if (!sdpResponse.ok) {
        throw new Error(`SDP exchange failed: ${sdpResponse.status}`);
      }

      const answerSdp = await sdpResponse.text();
      console.log('📥 Received SDP answer from OpenAI');

      await this.peerConnection.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp,
      });

      console.log('✅ WebRTC connection established');
    } catch (error) {
      console.error('❌ Error setting up WebRTC:', error);
      this.onStateChangeCallback?.('error');
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

  getConversationHistory(): ConversationMessage[] {
    return this.conversationHistory;
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
