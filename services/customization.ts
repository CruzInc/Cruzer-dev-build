// Customization & Security Service - Themes, Notification Sounds, Device Fingerprinting, etc.
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
    border: string;
  };
  isDark: boolean;
  isCustom: boolean;
  createdAt: Date;
}

export interface NotificationSound {
  id: string;
  name: string;
  category: 'message' | 'call' | 'general' | 'custom';
  filePath?: string;
  isDefault: boolean;
}

export interface DeviceFingerprint {
  id: string;
  userId: string;
  deviceModel: string;
  osVersion: string;
  appVersion: string;
  firstLoginDate: Date;
  lastLoginDate: Date;
  isTrusted: boolean;
  notifiedUser: boolean;
}

export interface ContactNotificationSound {
  contactId: string;
  soundId: string;
  customName?: string;
}

export interface ReportedUser {
  reportedUserId: string;
  reporterUserId: string;
  reason: string;
  description?: string;
  timestamp: Date;
  status: 'pending' | 'reviewed' | 'resolved';
}

export interface BlockedUser {
  userId: string;
  blockedUserId: string;
  blockedAt: Date;
  reason?: string;
}

export class CustomizationSecurityService {
  private themes: Map<string, AppTheme> = new Map();
  private notificationSounds: Map<string, NotificationSound> = new Map();
  private deviceFingerprints: Map<string, DeviceFingerprint> = new Map();
  private contactSounds: Map<string, ContactNotificationSound> = new Map();
  private reportedUsers: ReportedUser[] = [];
  private blockedUsers: Map<string, BlockedUser> = new Map();

  async initializeCustomizationSecurity() {
    await this.loadThemes();
    await this.loadNotificationSounds();
    await this.loadDeviceFingerprints();
    await this.loadContactSounds();
    await this.loadReportedUsers();
    await this.loadBlockedUsers();
  }

  // ==================== THEMES ====================

  async createCustomTheme(theme: Omit<AppTheme, 'createdAt'>): Promise<void> {
    const newTheme: AppTheme = {
      ...theme,
      createdAt: new Date(),
    };

    this.themes.set(theme.id, newTheme);
    await this.saveThemes();
  }

  async getTheme(themeId: string): Promise<AppTheme | null> {
    return this.themes.get(themeId) || null;
  }

  async getAllThemes(): Promise<AppTheme[]> {
    return Array.from(this.themes.values());
  }

  async getCustomThemes(): Promise<AppTheme[]> {
    return Array.from(this.themes.values()).filter((t) => t.isCustom);
  }

  async updateTheme(themeId: string, updates: Partial<AppTheme>): Promise<void> {
    const theme = this.themes.get(themeId);
    if (theme) {
      Object.assign(theme, updates);
      await this.saveThemes();
    }
  }

  async deleteTheme(themeId: string): Promise<void> {
    this.themes.delete(themeId);
    await this.saveThemes();
  }

  // ==================== NOTIFICATION SOUNDS ====================

  async addNotificationSound(sound: NotificationSound): Promise<void> {
    this.notificationSounds.set(sound.id, sound);
    await this.saveNotificationSounds();
  }

  async getNotificationSounds(category: string): Promise<NotificationSound[]> {
    return Array.from(this.notificationSounds.values()).filter(
      (s) => s.category === category || s.category === 'general'
    );
  }

  async setContactNotificationSound(
    contactId: string,
    soundId: string
  ): Promise<void> {
    const sound = this.notificationSounds.get(soundId);
    if (sound) {
      this.contactSounds.set(contactId, {
        contactId,
        soundId,
        customName: sound.name,
      });
      await this.saveContactSounds();
    }
  }

  async getContactNotificationSound(
    contactId: string
  ): Promise<NotificationSound | null> {
    const contactSound = this.contactSounds.get(contactId);
    if (!contactSound) return null;

    return this.notificationSounds.get(contactSound.soundId) || null;
  }

  // ==================== DEVICE FINGERPRINTING ====================

  async registerDeviceFingerprint(
    fingerprint: Omit<DeviceFingerprint, 'isTrusted' | 'notifiedUser'>
  ): Promise<void> {
    const existing = this.deviceFingerprints.get(fingerprint.id);

    if (existing) {
      existing.lastLoginDate = new Date();
      existing.appVersion = fingerprint.appVersion;
    } else {
      const newFingerprint: DeviceFingerprint = {
        ...fingerprint,
        isTrusted: false,
        notifiedUser: false,
      };

      this.deviceFingerprints.set(fingerprint.id, newFingerprint);
    }

    await this.saveDeviceFingerprints();
  }

  async isNewDevice(deviceId: string, userId: string): Promise<boolean> {
    const fingerprint = this.deviceFingerprints.get(deviceId);

    if (!fingerprint) {
      return true; // New device
    }

    return fingerprint.userId === userId && !fingerprint.isTrusted;
  }

  async trustDevice(deviceId: string): Promise<void> {
    const fingerprint = this.deviceFingerprints.get(deviceId);
    if (fingerprint) {
      fingerprint.isTrusted = true;
      await this.saveDeviceFingerprints();
    }
  }

  async getUserDevices(userId: string): Promise<DeviceFingerprint[]> {
    return Array.from(this.deviceFingerprints.values()).filter(
      (f) => f.userId === userId
    );
  }

  // ==================== USER REPORTING & BLOCKING ====================

  async reportUser(
    reportedUserId: string,
    reporterUserId: string,
    reason: string,
    description?: string
  ): Promise<void> {
    const report: ReportedUser = {
      reportedUserId,
      reporterUserId,
      reason,
      description,
      timestamp: new Date(),
      status: 'pending',
    };

    this.reportedUsers.push(report);
    await this.saveReportedUsers();
  }

  async blockUser(userId: string, blockedUserId: string, reason?: string): Promise<void> {
    const blockKey = `${userId}-${blockedUserId}`;

    if (!this.blockedUsers.has(blockKey)) {
      const blocked: BlockedUser = {
        userId,
        blockedUserId,
        blockedAt: new Date(),
        reason,
      };

      this.blockedUsers.set(blockKey, blocked);
      await this.saveBlockedUsers();
    }
  }

  async unblockUser(userId: string, blockedUserId: string): Promise<void> {
    const blockKey = `${userId}-${blockedUserId}`;
    this.blockedUsers.delete(blockKey);
    await this.saveBlockedUsers();
  }

  async isUserBlocked(userId: string, otherUserId: string): Promise<boolean> {
    const blockKey = `${userId}-${otherUserId}`;
    return this.blockedUsers.has(blockKey);
  }

  async getBlockedUsers(userId: string): Promise<string[]> {
    const blocked: string[] = [];

    this.blockedUsers.forEach((block) => {
      if (block.userId === userId) {
        blocked.push(block.blockedUserId);
      }
    });

    return blocked;
  }

  async getReportedUsers(status?: string): Promise<ReportedUser[]> {
    if (status) {
      return this.reportedUsers.filter((r) => r.status === status);
    }
    return this.reportedUsers;
  }

  // ==================== PRIVATE HELPERS ====================

  private async saveThemes(): Promise<void> {
    const data = Array.from(this.themes.values());
    await AsyncStorage.setItem('customization:themes', JSON.stringify(data));
  }

  private async loadThemes(): Promise<void> {
    const data = await AsyncStorage.getItem('customization:themes');
    if (data) {
      const themes = JSON.parse(data) as AppTheme[];
      themes.forEach((theme) => {
        theme.createdAt = new Date(theme.createdAt);
        this.themes.set(theme.id, theme);
      });
    }

    // Load default themes if none exist
    if (this.themes.size === 0) {
      this.loadDefaultThemes();
    }
  }

  private loadDefaultThemes(): void {
    const darkTheme: AppTheme = {
      id: 'dark',
      name: 'Dark',
      colors: {
        primary: '#007AFF',
        secondary: '#5AC8FA',
        background: '#000000',
        text: '#FFFFFF',
        accent: '#FF3B30',
        border: '#3A3A3C',
      },
      isDark: true,
      isCustom: false,
      createdAt: new Date(),
    };

    const lightTheme: AppTheme = {
      id: 'light',
      name: 'Light',
      colors: {
        primary: '#0051BA',
        secondary: '#0071D5',
        background: '#FFFFFF',
        text: '#000000',
        accent: '#FF3B30',
        border: '#D0D0D0',
      },
      isDark: false,
      isCustom: false,
      createdAt: new Date(),
    };

    this.themes.set(darkTheme.id, darkTheme);
    this.themes.set(lightTheme.id, lightTheme);
  }

  private async saveNotificationSounds(): Promise<void> {
    const data = Array.from(this.notificationSounds.values());
    await AsyncStorage.setItem('customization:sounds', JSON.stringify(data));
  }

  private async loadNotificationSounds(): Promise<void> {
    const data = await AsyncStorage.getItem('customization:sounds');
    if (data) {
      const sounds = JSON.parse(data) as NotificationSound[];
      sounds.forEach((sound) => {
        this.notificationSounds.set(sound.id, sound);
      });
    }
  }

  private async saveContactSounds(): Promise<void> {
    const data = Array.from(this.contactSounds.values());
    await AsyncStorage.setItem('customization:contactsounds', JSON.stringify(data));
  }

  private async loadContactSounds(): Promise<void> {
    const data = await AsyncStorage.getItem('customization:contactsounds');
    if (data) {
      const sounds = JSON.parse(data) as ContactNotificationSound[];
      sounds.forEach((sound) => {
        this.contactSounds.set(sound.contactId, sound);
      });
    }
  }

  private async saveDeviceFingerprints(): Promise<void> {
    const data = Array.from(this.deviceFingerprints.values());
    await AsyncStorage.setItem('security:fingerprints', JSON.stringify(data));
  }

  private async loadDeviceFingerprints(): Promise<void> {
    const data = await AsyncStorage.getItem('security:fingerprints');
    if (data) {
      const fingerprints = JSON.parse(data) as DeviceFingerprint[];
      fingerprints.forEach((fp) => {
        fp.firstLoginDate = new Date(fp.firstLoginDate);
        fp.lastLoginDate = new Date(fp.lastLoginDate);
        this.deviceFingerprints.set(fp.id, fp);
      });
    }
  }

  private async saveReportedUsers(): Promise<void> {
    await AsyncStorage.setItem('security:reports', JSON.stringify(this.reportedUsers));
  }

  private async loadReportedUsers(): Promise<void> {
    const data = await AsyncStorage.getItem('security:reports');
    if (data) {
      this.reportedUsers = JSON.parse(data) as ReportedUser[];
      this.reportedUsers.forEach((report) => {
        report.timestamp = new Date(report.timestamp);
      });
    }
  }

  private async saveBlockedUsers(): Promise<void> {
    const data = Array.from(this.blockedUsers.values());
    await AsyncStorage.setItem('security:blocked', JSON.stringify(data));
  }

  private async loadBlockedUsers(): Promise<void> {
    const data = await AsyncStorage.getItem('security:blocked');
    if (data) {
      const blocked = JSON.parse(data) as BlockedUser[];
      blocked.forEach((block) => {
        block.blockedAt = new Date(block.blockedAt);
        const key = `${block.userId}-${block.blockedUserId}`;
        this.blockedUsers.set(key, block);
      });
    }
  }
}

export const customizationSecurityService = new CustomizationSecurityService();
