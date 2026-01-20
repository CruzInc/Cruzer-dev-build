
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Participant {
  id: string;
  name: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  joinedAt: Date;
}

export interface CallSession {
  id: string;
  initiator: string;
  participants: Participant[];
  startTime: Date;
  endTime?: Date;
  isRecording: boolean;
  recordingId?: string;
}

const CALLS_KEY = 'cruzer:calls:v1';

class ConferenceCallService {
  private activeCalls: Map<string, CallSession> = new Map();
  private callHistory: CallSession[] = [];
  private maxParticipants = 8;

  constructor() {
    this.loadCallData();
  }

  private async loadCallData() {
    try {
      const [calls, history] = await Promise.all([
        AsyncStorage.getItem(CALLS_KEY),
        AsyncStorage.getItem('cruzer:call:history:v1'),
      ]);
      if (calls) this.activeCalls = new Map(JSON.parse(calls));
      if (history) this.callHistory = JSON.parse(history);
    } catch (error) {
      console.error('Error loading call data:', error);
    }
  }

  private async saveCallData() {
    try {
      await Promise.all([
        AsyncStorage.setItem(CALLS_KEY, JSON.stringify(Array.from(this.activeCalls.entries()))),
        AsyncStorage.setItem('cruzer:call:history:v1', JSON.stringify(this.callHistory)),
      ]);
    } catch (error) {
      console.error('Error saving call data:', error);
    }
  }

  initiateCall(initiatorId: string, initiatorName: string): CallSession {
    const session: CallSession = {
      id: `call-${Date.now()}-${Math.random()}`,
      initiator: initiatorId,
      participants: [
        {
          id: initiatorId,
          name: initiatorName,
          audioEnabled: true,
          videoEnabled: true,
          joinedAt: new Date(),
        },
      ],
      startTime: new Date(),
      isRecording: false,
    };
    this.activeCalls.set(session.id, session);
    this.saveCallData();
    return session;
  }

  addParticipant(callId: string, participantId: string, participantName: string): boolean {
    const call = this.activeCalls.get(callId);
    if (!call || call.participants.length >= this.maxParticipants) return false;
    call.participants.push({
      id: participantId,
      name: participantName,
      audioEnabled: true,
      videoEnabled: true,
      joinedAt: new Date(),
    });
    this.saveCallData();
    return true;
  }

  removeParticipant(callId: string, participantId: string): boolean {
    const call = this.activeCalls.get(callId);
    if (!call) return false;
    call.participants = call.participants.filter(p => p.id !== participantId);
    this.saveCallData();
    return true;
  }

  toggleAudio(callId: string, participantId: string): boolean {
    const call = this.activeCalls.get(callId);
    if (!call) return false;
    const participant = call.participants.find(p => p.id === participantId);
    if (participant) {
      participant.audioEnabled = !participant.audioEnabled;
      this.saveCallData();
      return true;
    }
    return false;
  }

  toggleVideo(callId: string, participantId: string): boolean {
    const call = this.activeCalls.get(callId);
    if (!call) return false;
    const participant = call.participants.find(p => p.id === participantId);
    if (participant) {
      participant.videoEnabled = !participant.videoEnabled;
      this.saveCallData();
      return true;
    }
    return false;
  }

  toggleMute(callId: string, participantId: string): boolean {
    return this.toggleAudio(callId, participantId);
  }

  startRecording(callId: string): boolean {
    const call = this.activeCalls.get(callId);
    if (!call) return false;
    call.isRecording = true;
    call.recordingId = `rec-${Date.now()}`;
    this.saveCallData();
    return true;
  }

  stopRecording(callId: string): string | null {
    const call = this.activeCalls.get(callId);
    if (!call) return null;
    const recordingId = call.recordingId;
    call.isRecording = false;
    this.saveCallData();
    return recordingId || null;
  }

  endCall(callId: string): CallSession | null {
    const call = this.activeCalls.get(callId);
    if (!call) return null;
    call.endTime = new Date();
    this.activeCalls.delete(callId);
    this.callHistory.push(call);
    this.saveCallData();
    return call;
  }

  getActiveCalls(): CallSession[] {
    return Array.from(this.activeCalls.values());
  }

  getCallHistory(): CallSession[] {
    return this.callHistory;
  }

  isInCall(callId: string): boolean {
    return this.activeCalls.has(callId);
  }
}

export const conferenceCallService = new ConferenceCallService();
