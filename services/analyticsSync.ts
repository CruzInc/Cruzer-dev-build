import { analytics } from './analytics';
import { usageInsights } from './usageInsights';
import { backend } from './backend';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

/**
 * Analytics Sync Service
 * Bridges local analytics with backend for cloud persistence
 */

interface SyncConfig {
  batchSize?: number;
  syncInterval?: number; // ms
  includeDeviceInfo?: boolean;
}

class AnalyticsSyncService {
  private static instance: AnalyticsSyncService;
  private batchSize: number = 50;
  private syncInterval: number = 120000; // 2 minutes
  private includeDeviceInfo: boolean = true;
  private lastSyncTime: number = 0;
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): AnalyticsSyncService {
    if (!AnalyticsSyncService.instance) {
      AnalyticsSyncService.instance = new AnalyticsSyncService();
    }
    return AnalyticsSyncService.instance;
  }

  /**
   * Initialize sync service
   */
  async initialize(config?: SyncConfig): Promise<void> {
    if (this.isInitialized) return;

    if (config?.batchSize) this.batchSize = config.batchSize;
    if (config?.syncInterval) this.syncInterval = config.syncInterval;
    if (config?.includeDeviceInfo !== undefined) this.includeDeviceInfo = config.includeDeviceInfo;

    // Start periodic sync
    setInterval(() => this.syncToBackend(), this.syncInterval);

    this.isInitialized = true;
    console.log('[AnalyticsSync] Initialized with interval:', this.syncInterval);
  }

  /**
   * Sync analytics to backend
   */
  async syncToBackend(): Promise<boolean> {
    try {
      // Get current user
      const userId = (backend as any).userId || 'anonymous';

      // Get insights summary
      const summary = await usageInsights.getInsightsSummary();

      // Get daily breakdown
      const dailyBreakdown = await usageInsights.getDailyBreakdown();

      // Prepare payload
      const payload = {
        userId,
        sessionId: (analytics as any).getSessionInfo?.().session_id || 'unknown',
        events: this.formatEvents(summary),
        deviceInfo: this.includeDeviceInfo ? this.getDeviceInfo() : undefined,
        summary: {
          total_sessions: summary.total_sessions,
          total_app_time: summary.total_app_time,
          feature_engagement_rate: summary.feature_engagement_rate,
          error_frequency: summary.error_frequency,
          daily_breakdown: dailyBreakdown,
        },
        syncedAt: new Date().toISOString(),
      };

      // Send to backend
      const success = await backend.syncAnalytics(payload);

      if (success) {
        this.lastSyncTime = Date.now();
        console.log('[AnalyticsSync] Successfully synced to backend');
      }

      return success;
    } catch (error) {
      console.error('[AnalyticsSync] Sync error:', error);
      return false;
    }
  }

  /**
   * Format insights into event array
   */
  private formatEvents(summary: any) {
    const events = [];

    // Add each top feature as an event
    if (summary.most_used_features) {
      summary.most_used_features.forEach((feature: any) => {
        events.push({
          event: `feature_usage_${feature.feature}`,
          timestamp: Date.now(),
          duration: feature.avg_duration,
          metadata: {
            count: feature.count,
          },
        });
      });
    }

    return events;
  }

  /**
   * Get device information
   */
  private getDeviceInfo() {
    return {
      device_name: Device.deviceName,
      device_brand: Device.brand,
      device_model: Device.modelName,
      os: Device.osInternalBuildId ? 'android' : 'ios',
      is_device: Device.isDevice,
      app_version: Constants.expoConfig?.version,
      app_name: Constants.expoConfig?.name,
    };
  }

  /**
   * Force sync immediately
   */
  async forceSyncNow(): Promise<boolean> {
    console.log('[AnalyticsSync] Forcing immediate sync...');
    return this.syncToBackend();
  }

  /**
   * Get sync status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      last_sync: new Date(this.lastSyncTime).toISOString(),
      sync_interval: this.syncInterval,
      batch_size: this.batchSize,
      backend_status: (backend as any).getSessionInfo?.(),
    };
  }
}

export const analyticsSync = AnalyticsSyncService.getInstance();
export default AnalyticsSyncService;
