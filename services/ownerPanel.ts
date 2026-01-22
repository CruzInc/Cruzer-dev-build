/**
 * Owner Panel Service
 * God-mode panel for app owner with full monitoring and control
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { backend } from './backend';
import { whitelistService } from './whitelist';
import { debugMonitor, DebugLog } from './debugMonitor';

export interface OwnerAction {
  id: string;
  timestamp: Date;
  action: string;
  target?: string;
  details: string;
  result: 'success' | 'failed';
}

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalMessages: number;
  totalCalls: number;
  storageUsed: number;
  cpuUsage?: number;
  memoryUsage?: number;
}

export interface DevActivity {
  devId: string;
  devEmail: string;
  action: string;
  timestamp: Date;
  details: string;
}

class OwnerPanelService {
  private static instance: OwnerPanelService;
  private ownerActions: OwnerAction[] = [];
  private devActivities: DevActivity[] = [];
  private readonly STORAGE_KEY = 'owner:actions';
  private readonly DEV_ACTIVITY_KEY = 'owner:dev:activities';
  private readonly MAX_ACTIONS = 1000;

  private constructor() {
    this.initializeFromStorage();
  }

  static getInstance(): OwnerPanelService {
    if (!OwnerPanelService.instance) {
      OwnerPanelService.instance = new OwnerPanelService();
    }
    return OwnerPanelService.instance;
  }

  private async initializeFromStorage(): Promise<void> {
    try {
      const [actionsJson, devActivitiesJson] = await Promise.all([
        AsyncStorage.getItem(this.STORAGE_KEY),
        AsyncStorage.getItem(this.DEV_ACTIVITY_KEY),
      ]);

      if (actionsJson) {
        const actions = JSON.parse(actionsJson);
        this.ownerActions = actions.map((a: any) => ({
          ...a,
          timestamp: new Date(a.timestamp),
        }));
      }

      if (devActivitiesJson) {
        const activities = JSON.parse(devActivitiesJson);
        this.devActivities = activities.map((a: any) => ({
          ...a,
          timestamp: new Date(a.timestamp),
        }));
      }

      console.log('[Owner Panel] Initialized with', {
        actions: this.ownerActions.length,
        devActivities: this.devActivities.length,
      });
    } catch (error) {
      console.error('[Owner Panel] Failed to initialize:', error);
    }
  }

  /**
   * Log owner action
   */
  private async logAction(
    action: string,
    target: string | undefined,
    details: string,
    result: 'success' | 'failed'
  ): Promise<void> {
    const ownerAction: OwnerAction = {
      id: `owner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      action,
      target,
      details,
      result,
    };

    this.ownerActions.push(ownerAction);

    // Keep only recent actions
    if (this.ownerActions.length > this.MAX_ACTIONS) {
      this.ownerActions = this.ownerActions.slice(-this.MAX_ACTIONS);
    }

    await AsyncStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify(this.ownerActions)
    );

    console.log('[Owner Panel] Action logged:', action);
  }

  /**
   * Log developer activity
   */
  async logDevActivity(
    devId: string,
    devEmail: string,
    action: string,
    details: string
  ): Promise<void> {
    const activity: DevActivity = {
      devId,
      devEmail,
      action,
      timestamp: new Date(),
      details,
    };

    this.devActivities.push(activity);

    // Keep only last 500
    if (this.devActivities.length > 500) {
      this.devActivities = this.devActivities.slice(-500);
    }

    await AsyncStorage.setItem(
      this.DEV_ACTIVITY_KEY,
      JSON.stringify(this.devActivities)
    );

    console.log('[Owner Panel] Dev activity logged:', action, 'by', devEmail);
  }

  /**
   * Get all developer activities
   */
  getDevActivities(limit?: number): DevActivity[] {
    const activities = [...this.devActivities].reverse();
    return limit ? activities.slice(0, limit) : activities;
  }

  /**
   * Get owner actions
   */
  getOwnerActions(limit?: number): OwnerAction[] {
    const actions = [...this.ownerActions].reverse();
    return limit ? actions.slice(0, limit) : actions;
  }

  /**
   * Get system stats
   */
  async getSystemStats(): Promise<SystemStats> {
    try {
      // Get from backend if available
      // const stats = await backend.getSystemStats();
      // return stats;

      // Fallback to local calculation
      const keys = await AsyncStorage.getAllKeys();
      let storageUsed = 0;

      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          storageUsed += new Blob([value]).size;
        }
      }

      return {
        totalUsers: 0, // TODO: Get from backend
        activeUsers: 0, // TODO: Get from backend
        totalMessages: 0, // TODO: Get from backend
        totalCalls: 0, // TODO: Get from backend
        storageUsed: Math.round(storageUsed / 1024), // KB
      };
    } catch (error) {
      console.error('[Owner Panel] Failed to get stats:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalMessages: 0,
        totalCalls: 0,
        storageUsed: 0,
      };
    }
  }

  /**
   * Force whitelist user (bypass all checks)
   */
  async forceWhitelistUser(
    userId: string,
    type: 'developer' | 'staff',
    reason: string
  ): Promise<boolean> {
    try {
      const success =
        type === 'developer'
          ? await whitelistService.addDeveloperWhitelist(
              userId,
              'OWNER',
              'owner@cruzer.app',
              reason
            )
          : await whitelistService.addStaffWhitelist(
              userId,
              'OWNER',
              'owner@cruzer.app',
              reason
            );

      await this.logAction(
        'force_whitelist',
        userId,
        `Added ${userId} to ${type} whitelist: ${reason}`,
        success ? 'success' : 'failed'
      );

      return success;
    } catch (error: any) {
      await this.logAction(
        'force_whitelist',
        userId,
        `Failed: ${error.message}`,
        'failed'
      );
      return false;
    }
  }

  /**
   * Force remove from whitelist
   */
  async forceRemoveFromWhitelist(
    userId: string,
    type: 'developer' | 'staff'
  ): Promise<boolean> {
    try {
      const success =
        type === 'developer'
          ? await whitelistService.removeDeveloperWhitelist(
              userId,
              'OWNER',
              'owner@cruzer.app'
            )
          : await whitelistService.removeStaffWhitelist(
              userId,
              'OWNER',
              'owner@cruzer.app'
            );

      await this.logAction(
        'force_remove_whitelist',
        userId,
        `Removed ${userId} from ${type} whitelist`,
        success ? 'success' : 'failed'
      );

      return success;
    } catch (error: any) {
      await this.logAction(
        'force_remove_whitelist',
        userId,
        `Failed: ${error.message}`,
        'failed'
      );
      return false;
    }
  }

  /**
   * Clear all app data (nuclear option)
   */
  async clearAllData(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      await this.logAction(
        'clear_all_data',
        undefined,
        'Cleared all app data',
        'success'
      );
      return true;
    } catch (error: any) {
      await this.logAction(
        'clear_all_data',
        undefined,
        `Failed: ${error.message}`,
        'failed'
      );
      return false;
    }
  }

  /**
   * Export all logs and data
   */
  async exportAllData(): Promise<{
    ownerActions: OwnerAction[];
    devActivities: DevActivity[];
    debugLogs: DebugLog[];
    whitelistAudits: any[];
  }> {
    return {
      ownerActions: this.ownerActions,
      devActivities: this.devActivities,
      debugLogs: debugMonitor.getAllLogs(),
      whitelistAudits: whitelistService.getAuditLogs(),
    };
  }

  /**
   * Get all whitelists
   */
  getAllWhitelists(): {
    developers: string[];
    staff: string[];
  } {
    return {
      developers: whitelistService.getDeveloperWhitelist(),
      staff: whitelistService.getStaffWhitelist(),
    };
  }

  /**
   * Emergency shutdown (disable all features)
   */
  async emergencyShutdown(reason: string): Promise<boolean> {
    try {
      // Broadcast to all users
      await whitelistService.logServerReset(
        'OWNER',
        'owner@cruzer.app',
        `EMERGENCY SHUTDOWN: ${reason}`
      );

      await this.logAction(
        'emergency_shutdown',
        undefined,
        reason,
        'success'
      );

      return true;
    } catch (error: any) {
      await this.logAction(
        'emergency_shutdown',
        undefined,
        `Failed: ${error.message}`,
        'failed'
      );
      return false;
    }
  }

  /**
   * Get debug statistics
   */
  getDebugStats() {
    return debugMonitor.getStats();
  }

  /**
   * Get all unresolved bugs
   */
  getUnresolvedBugs(): DebugLog[] {
    return debugMonitor.getAllLogs().filter(log => !log.resolved);
  }

  /**
   * Force resolve all bugs
   */
  async forceResolveAllBugs(): Promise<void> {
    const logs = debugMonitor.getAllLogs();
    for (const log of logs) {
      if (!log.resolved) {
        await debugMonitor.resolveLog(log.id);
      }
    }

    await this.logAction(
      'resolve_all_bugs',
      undefined,
      `Resolved ${logs.length} bugs`,
      'success'
    );
  }

  /**
   * Get monitoring dashboard data
   */
  async getDashboardData(): Promise<{
    stats: SystemStats;
    recentActions: OwnerAction[];
    recentDevActivities: DevActivity[];
    debugStats: ReturnType<typeof debugMonitor.getStats>;
    whitelists: { developers: string[]; staff: string[] };
  }> {
    const [stats, whitelists] = await Promise.all([
      this.getSystemStats(),
      Promise.resolve(this.getAllWhitelists()),
    ]);

    return {
      stats,
      recentActions: this.getOwnerActions(10),
      recentDevActivities: this.getDevActivities(10),
      debugStats: this.getDebugStats(),
      whitelists,
    };
  }
}

export const ownerPanel = OwnerPanelService.getInstance();
