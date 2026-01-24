// User Presence & Status Service
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserPresenceStatus = 'online' | 'away' | 'dnd' | 'offline';

export interface UserPresence {
  userId: string;
  status: UserPresenceStatus;
  lastSeen: Date;
  statusMessage?: string;
  dndSchedule?: {
    startTime: string; // HH:mm format
    endTime: string;
    enabled: boolean;
  };
}

export interface UserProfile {
  userId: string;
  bio?: string;
  displayName: string;
  profilePicture?: string;
  statusMessage?: string;
  lastSeen?: Date;
  joinDate: Date;
  isVisible?: boolean; // Privacy setting
}

export interface AutoReply {
  userId: string;
  enabled: boolean;
  message: string;
  startTime?: string;
  endTime?: string;
}

export class PresenceService {
  private presenceMap: Map<string, UserPresence> = new Map();
  private profileMap: Map<string, UserProfile> = new Map();
  private autoReplyMap: Map<string, AutoReply> = new Map();

  async initializePresence() {
    await this.loadPresenceData();
    await this.loadProfiles();
    await this.loadAutoReplies();
  }

  // User Presence Management
  async setUserPresence(userId: string, status: UserPresenceStatus): Promise<void> {
    const presence = this.presenceMap.get(userId) || {
      userId,
      status: 'offline',
      lastSeen: new Date(),
    };

    presence.status = status;
    presence.lastSeen = new Date();
    this.presenceMap.set(userId, presence);

    await this.savePresenceData();
  }

  async getUserPresence(userId: string): Promise<UserPresence | null> {
    return this.presenceMap.get(userId) || null;
  }

  async getAllOnlineUsers(): Promise<UserPresence[]> {
    return Array.from(this.presenceMap.values()).filter(
      (p) => p.status === 'online'
    );
  }

  // Do Not Disturb
  async setDoNotDisturb(
    userId: string,
    enabled: boolean,
    startTime?: string,
    endTime?: string
  ): Promise<void> {
    const presence = this.presenceMap.get(userId);
    if (!presence) return;

    presence.dndSchedule = {
      startTime: startTime || '22:00',
      endTime: endTime || '08:00',
      enabled,
    };

    if (enabled) {
      presence.status = 'dnd';
    }

    this.presenceMap.set(userId, presence);
    await this.savePresenceData();
  }

  async isUserInDND(userId: string): Promise<boolean> {
    const presence = this.presenceMap.get(userId);
    if (!presence?.dndSchedule?.enabled) return false;

    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}`;

    return currentTime >= presence.dndSchedule.startTime ||
      currentTime < presence.dndSchedule.endTime;
  }

  // User Profiles
  async updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
    const existing = this.profileMap.get(userId) || {
      userId,
      displayName: 'User',
      joinDate: new Date(),
    };

    const updated = { ...existing, ...profile };
    this.profileMap.set(userId, updated);
    await this.saveProfiles();
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    return this.profileMap.get(userId) || null;
  }

  async getUserLastSeen(userId: string): Promise<Date | null> {
    const presence = this.presenceMap.get(userId);
    return presence?.lastSeen || null;
  }

  // Auto-Reply
  async setAutoReply(
    userId: string,
    enabled: boolean,
    message: string,
    startTime?: string,
    endTime?: string
  ): Promise<void> {
    const autoReply: AutoReply = {
      userId,
      enabled,
      message,
      startTime,
      endTime,
    };

    this.autoReplyMap.set(userId, autoReply);
    await this.saveAutoReplies();
  }

  async getAutoReply(userId: string): Promise<AutoReply | null> {
    return this.autoReplyMap.get(userId) || null;
  }

  async shouldAutoReply(userId: string): Promise<boolean> {
    const autoReply = this.autoReplyMap.get(userId);
    if (!autoReply?.enabled) return false;

    if (!autoReply.startTime || !autoReply.endTime) return true;

    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}`;

    return currentTime >= autoReply.startTime && currentTime < autoReply.endTime;
  }

  // Private helpers
  private async savePresenceData(): Promise<void> {
    const data = Array.from(this.presenceMap.values());
    await AsyncStorage.setItem('user:presence', JSON.stringify(data));
  }

  private async loadPresenceData(): Promise<void> {
    const data = await AsyncStorage.getItem('user:presence');
    if (data) {
      const presences = JSON.parse(data) as UserPresence[];
      presences.forEach((p) => {
        p.lastSeen = new Date(p.lastSeen);
        this.presenceMap.set(p.userId, p);
      });
    }
  }

  private async saveProfiles(): Promise<void> {
    const data = Array.from(this.profileMap.values());
    await AsyncStorage.setItem('user:profiles', JSON.stringify(data));
  }

  private async loadProfiles(): Promise<void> {
    const data = await AsyncStorage.getItem('user:profiles');
    if (data) {
      const profiles = JSON.parse(data) as UserProfile[];
      profiles.forEach((p) => {
        p.joinDate = new Date(p.joinDate);
        if (p.lastSeen) p.lastSeen = new Date(p.lastSeen);
        this.profileMap.set(p.userId, p);
      });
    }
  }

  private async saveAutoReplies(): Promise<void> {
    const data = Array.from(this.autoReplyMap.values());
    await AsyncStorage.setItem('user:autoreplies', JSON.stringify(data));
  }

  private async loadAutoReplies(): Promise<void> {
    const data = await AsyncStorage.getItem('user:autoreplies');
    if (data) {
      const replies = JSON.parse(data) as AutoReply[];
      replies.forEach((r) => {
        this.autoReplyMap.set(r.userId, r);
      });
    }
  }
}

export const presenceService = new PresenceService();
