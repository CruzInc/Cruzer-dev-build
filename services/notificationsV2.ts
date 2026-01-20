import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export interface NotificationSettings {
  globalEnabled: boolean;
  dndStart: string;
  dndEnd: string;
  enableBatching: boolean;
  batchDelay: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface NotificationPreferences {
  globalEnabled: boolean;
  globalDndEnabled: boolean;
  dndStart: string;
  dndStartTime?: string;
  dndEnd: string;
  dndEndTime?: string;
  soundEnabled?: boolean;
  vibrateEnabled?: boolean;
  batchingEnabled?: boolean;
  batchingDelayMs?: number;
}

export interface ContactNotificationPrefs {
  contactId: string;
  contactName: string;
  muted: boolean;
}

export interface MutedContact {
  contactId: string;
  contactName: string;
  mutedUntil: Date;
}

const SETTINGS_KEY = 'cruzer:notification:settings';
const MUTED_KEY = 'cruzer:muted:contacts';

class NotificationServiceV2 {
  private settings: NotificationSettings = {
    globalEnabled: true,
    dndStart: '22:00',
    dndEnd: '08:00',
    enableBatching: true,
    batchDelay: 5000,
    soundEnabled: true,
    vibrationEnabled: true,
  };
  private mutedContacts: Map<string, MutedContact> = new Map();
  private notificationQueue: any[] = [];
  private batchTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.loadSettings();
  }

  private async loadSettings() {
    try {
      const [settings, muted] = await Promise.all([
        AsyncStorage.getItem(SETTINGS_KEY),
        AsyncStorage.getItem(MUTED_KEY),
      ]);
      if (settings) this.settings = JSON.parse(settings);
      if (muted) this.mutedContacts = new Map(JSON.parse(muted));
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }

  private async saveSettings() {
    try {
      await Promise.all([
        AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings)),
        AsyncStorage.setItem(MUTED_KEY, JSON.stringify(Array.from(this.mutedContacts.entries()))),
      ]);
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }

  setDnd(enabled: boolean, startTime?: string, endTime?: string) {
    this.settings.globalEnabled = enabled;
    if (startTime) this.settings.dndStart = startTime;
    if (endTime) this.settings.dndEnd = endTime;
    this.saveSettings();
  }

  setContactMuted(contactId: string, contactName: string, minutesOrBool: number | boolean) {
    const minutes = typeof minutesOrBool === 'boolean' 
      ? (minutesOrBool ? 60 : 0)
      : minutesOrBool;
    if (minutes <= 0) {
      this.mutedContacts.delete(contactId);
    } else {
      const mutedUntil = new Date();
      mutedUntil.setMinutes(mutedUntil.getMinutes() + minutes);
      this.mutedContacts.set(contactId, { contactId, contactName, mutedUntil });
    }
    this.saveSettings();
  }

  isContactMuted(contactId: string): boolean {
    const muted = this.mutedContacts.get(contactId);
    if (!muted) return false;
    if (new Date() > muted.mutedUntil) {
      this.mutedContacts.delete(contactId);
      return false;
    }
    return true;
  }

  unmuteContact(contactId: string) {
    this.mutedContacts.delete(contactId);
    this.saveSettings();
  }

  shouldShowNotification(contactId: string): boolean {
    if (!this.settings.globalEnabled) return false;
    if (this.isContactMuted(contactId)) return false;
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    if (this.settings.dndStart > this.settings.dndEnd) {
      return !(currentTime >= this.settings.dndStart || currentTime < this.settings.dndEnd);
    }
    return !(currentTime >= this.settings.dndStart && currentTime < this.settings.dndEnd);
  }

  send(title: string, body: string, data?: any) {
    if (!this.shouldShowNotification(data?.contactId)) return;
    if (this.settings.enableBatching) {
      this.notificationQueue.push({ title, body, data });
      if (this.batchTimer) clearTimeout(this.batchTimer);
      this.batchTimer = setTimeout(() => this.flushQueue(), this.settings.batchDelay) as any;
    } else {
      Notifications.scheduleNotificationAsync({
        content: { title, body, data, sound: this.settings.soundEnabled },
        trigger: null,
      });
    }
  }

  private flushQueue() {
    if (this.notificationQueue.length === 0) return;
    const title = `${this.notificationQueue.length} new notifications`;
    Notifications.scheduleNotificationAsync({
      content: { title, body: 'You have new messages', sound: this.settings.soundEnabled },
      trigger: null,
    });
    this.notificationQueue = [];
    this.batchTimer = null;
  }

  getGlobalPreferences(): NotificationPreferences {
    return {
      globalEnabled: this.settings.globalEnabled,
      globalDndEnabled: !this.settings.globalEnabled,
      dndStart: this.settings.dndStart,
      dndEnd: this.settings.dndEnd,
    };
  }

  async setGlobalPreferences(prefs: NotificationPreferences) {
    this.settings.globalEnabled = prefs.globalEnabled;
    this.settings.dndStart = prefs.dndStart;
    this.settings.dndEnd = prefs.dndEnd;
    await this.saveSettings();
  }

  getContactPreferences(): ContactNotificationPrefs[] {
    return Array.from(this.mutedContacts.values()).map(contact => ({
      contactId: contact.contactId,
      contactName: contact.contactName,
      muted: new Date() < contact.mutedUntil,
    }));
  }

  async setDndSchedule(startTime: string, endTime: string, enabled: boolean) {
    if (enabled) {
      this.settings.dndStart = startTime;
      this.settings.dndEnd = endTime;
    }
    await this.saveSettings();
  }

  setCm(contactId: string, contactName: string, muted: boolean) {
    if (muted) {
      this.setContactMuted(contactId, contactName, 60);
    } else {
      this.unmuteContact(contactId);
    }
  }

  setGp(prefs: any) {
    this.settings.globalEnabled = prefs.globalEnabled ?? this.settings.globalEnabled;
    this.saveSettings();
  }
}

export const notificationServiceV2 = new NotificationServiceV2();
