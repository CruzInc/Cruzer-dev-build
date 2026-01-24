// Advanced Features Service - Sync Queue, Retry Logic, Crash Recovery, etc.
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface QueuedMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: Date;
  retries: number;
  maxRetries: number;
  lastRetryTime?: Date;
}

export interface CrashSnapshot {
  timestamp: Date;
  currentMode: string;
  currentUser: any;
  activeConversation?: string;
  unsavedData: { [key: string]: any };
}

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export interface SessionTimeout {
  inactivityMinutes: number;
  warningMinutes?: number;
  enabled: boolean;
}

export class AdvancedFeaturesService {
  private messageQueue: Map<string, QueuedMessage> = new Map();
  private lastCrashSnapshot: CrashSnapshot | null = null;
  private sessionInactivityTimer: NodeJS.Timeout | number | null = null;
  private lastActivityTime: Date = new Date();

  private retryConfig: RetryConfig = {
    maxRetries: 5,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
  };

  private sessionTimeout: SessionTimeout = {
    inactivityMinutes: 30,
    warningMinutes: 5,
    enabled: true,
  };

  async initializeAdvancedFeatures() {
    await this.loadMessageQueue();
    await this.loadCrashSnapshot();
    this.setupSessionTimeout();
  }

  // ==================== MESSAGE SYNC QUEUE ====================

  async queueMessage(
    senderId: string,
    recipientId: string,
    content: string
  ): Promise<string> {
    const messageId = `msg-${Date.now()}-${Math.random()}`;
    const queuedMsg: QueuedMessage = {
      id: messageId,
      senderId,
      recipientId,
      content,
      timestamp: new Date(),
      retries: 0,
      maxRetries: this.retryConfig.maxRetries,
    };

    this.messageQueue.set(messageId, queuedMsg);
    await this.saveMessageQueue();
    return messageId;
  }

  async getQueuedMessages(): Promise<QueuedMessage[]> {
    return Array.from(this.messageQueue.values());
  }

  async removeFromQueue(messageId: string): Promise<void> {
    this.messageQueue.delete(messageId);
    await this.saveMessageQueue();
  }

  async incrementRetry(messageId: string): Promise<number> {
    const msg = this.messageQueue.get(messageId);
    if (!msg) return 0;

    msg.retries += 1;
    msg.lastRetryTime = new Date();

    if (msg.retries > msg.maxRetries) {
      this.messageQueue.delete(messageId);
    }

    await this.saveMessageQueue();
    return msg.retries;
  }

  async processSyncQueue(
    onMessage: (msg: QueuedMessage) => Promise<boolean>
  ): Promise<void> {
    const messages = Array.from(this.messageQueue.values());

    for (const msg of messages) {
      try {
        const success = await onMessage(msg);
        if (success) {
          await this.removeFromQueue(msg.id);
        } else {
          await this.incrementRetry(msg.id);
        }
      } catch (error) {
        await this.incrementRetry(msg.id);
      }
    }
  }

  // ==================== CRASH RECOVERY ====================

  async saveCrashSnapshot(snapshot: Partial<CrashSnapshot>): Promise<void> {
    this.lastCrashSnapshot = {
      timestamp: new Date(),
      currentMode: snapshot.currentMode || 'messages',
      currentUser: snapshot.currentUser,
      activeConversation: snapshot.activeConversation,
      unsavedData: snapshot.unsavedData || {},
    };

    await AsyncStorage.setItem(
      'recovery:snapshot',
      JSON.stringify(this.lastCrashSnapshot)
    );
  }

  async getCrashSnapshot(): Promise<CrashSnapshot | null> {
    return this.lastCrashSnapshot;
  }

  async clearCrashSnapshot(): Promise<void> {
    this.lastCrashSnapshot = null;
    await AsyncStorage.removeItem('recovery:snapshot');
  }

  // ==================== RETRY LOGIC ====================

  calculateBackoffDelay(retryCount: number): number {
    const delay =
      this.retryConfig.initialDelayMs *
      Math.pow(this.retryConfig.backoffMultiplier, retryCount);

    return Math.min(delay, this.retryConfig.maxDelayMs);
  }

  async executeWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = this.retryConfig.maxRetries
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (i < maxRetries) {
          const delay = this.calculateBackoffDelay(i);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  // ==================== SESSION TIMEOUT ====================

  private setupSessionTimeout(): void {
    // Reset activity tracker on any user interaction
    this.recordUserActivity();

    // Check inactivity every minute
    this.sessionInactivityTimer = setInterval(() => {
      this.checkSessionTimeout();
    }, 60000);
  }

  recordUserActivity(): void {
    this.lastActivityTime = new Date();
  }

  private checkSessionTimeout(): void {
    if (!this.sessionTimeout.enabled) return;

    const now = new Date();
    const inactiveMs =
      now.getTime() - this.lastActivityTime.getTime();
    const inactiveMinutes = inactiveMs / (1000 * 60);

    if (inactiveMinutes > this.sessionTimeout.inactivityMinutes) {
      this.onSessionTimeout();
    }
  }

  private onSessionTimeout(): void {
    console.log('Session timeout - user should be logged out');
    // This would be handled by the main app component
  }

  setSessionTimeout(inactivityMinutes: number): void {
    this.sessionTimeout.inactivityMinutes = inactivityMinutes;
  }

  getSessionTimeout(): SessionTimeout {
    return this.sessionTimeout;
  }

  // ==================== NOTIFICATION BATCHING ====================

  async batchNotifications(
    notifications: any[],
    batchWindowMs: number = 5000
  ): Promise<any[]> {
    if (notifications.length === 0) return [];

    // Group notifications by type
    const grouped: { [key: string]: any[] } = {};

    notifications.forEach((notif) => {
      const key = notif.type || 'default';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(notif);
    });

    // Create batched notifications
    const batched: any[] = [];

    Object.entries(grouped).forEach(([type, notifs]) => {
      if (notifs.length === 1) {
        batched.push(notifs[0]);
      } else {
        batched.push({
          type: `${type}-batch`,
          count: notifs.length,
          preview: notifs[0],
          timestamp: new Date(),
        });
      }
    });

    return batched;
  }

  // ==================== PRIVATE HELPERS ====================

  private async saveMessageQueue(): Promise<void> {
    const data = Array.from(this.messageQueue.values());
    await AsyncStorage.setItem('sync:queue', JSON.stringify(data));
  }

  private async loadMessageQueue(): Promise<void> {
    const data = await AsyncStorage.getItem('sync:queue');
    if (data) {
      const messages = JSON.parse(data) as QueuedMessage[];
      messages.forEach((msg) => {
        msg.timestamp = new Date(msg.timestamp);
        if (msg.lastRetryTime) msg.lastRetryTime = new Date(msg.lastRetryTime);
        this.messageQueue.set(msg.id, msg);
      });
    }
  }

  private async loadCrashSnapshot(): Promise<void> {
    const data = await AsyncStorage.getItem('recovery:snapshot');
    if (data) {
      const snapshot = JSON.parse(data) as CrashSnapshot;
      snapshot.timestamp = new Date(snapshot.timestamp);
      this.lastCrashSnapshot = snapshot;
    }
  }

  cleanup(): void {
    if (this.sessionInactivityTimer) {
      clearInterval(this.sessionInactivityTimer);
    }
  }
}

export const advancedFeaturesService = new AdvancedFeaturesService();
