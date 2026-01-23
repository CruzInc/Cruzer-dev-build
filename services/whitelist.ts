import AsyncStorage from '@react-native-async-storage/async-storage';
import { backend } from './backend';
import { realtimeService } from './realtime';

/**
 * Whitelist Service
 * Handles:
 * - VIP/admin whitelist persistence via AsyncStorage
 * - Backend synchronization for database storage
 * - Audit logging for admin actions
 * - Real-time broadcast of whitelist changes
 */

export interface WhitelistEntry {
  userId: string;
  type: 'developer' | 'staff';
  grantedBy: string; // Admin ID who granted access
  grantedAt: Date;
  expiresAt?: Date; // Optional expiration
  reason?: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: 'whitelist_add' | 'whitelist_remove' | 'server_reset';
  targetUserId?: string;
  targetUserEmail?: string;
  panelType?: 'developer' | 'staff';
  timestamp: Date;
  ipAddress?: string;
  reason?: string;
  status: 'success' | 'failed';
  metadata?: Record<string, any>;
}

class WhitelistService {
  private static instance: WhitelistService;
  
  // Local state
  private devWhitelistedUsers: Set<string> = new Set();
  private staffWhitelistedUsers: Set<string> = new Set();
  private auditLogs: AuditLog[] = [];
  
  // Storage keys
  private readonly DEV_WHITELIST_KEY = 'vip:dev:whitelist';
  private readonly STAFF_WHITELIST_KEY = 'vip:staff:whitelist';
  private readonly AUDIT_LOGS_KEY = 'vip:audit:logs';
  private readonly MAX_LOCAL_LOGS = 1000;
  
  // Sync tracking
  private lastSyncTimestamp: number = 0;
  private syncInProgress: boolean = false;
  private listeners: Set<(type: 'whitelist' | 'audit') => void> = new Set();

  constructor() {
    this.initializeFromStorage();
  }

  static getInstance(): WhitelistService {
    if (!WhitelistService.instance) {
      WhitelistService.instance = new WhitelistService();
    }
    return WhitelistService.instance;
  }

  /**
   * Initialize whitelist data from AsyncStorage
   */
  private async initializeFromStorage(): Promise<void> {
    try {
      // Load developer whitelist
      const devWhitelistJson = await AsyncStorage.getItem(this.DEV_WHITELIST_KEY);
      if (devWhitelistJson) {
        const devList = JSON.parse(devWhitelistJson);
        this.devWhitelistedUsers = new Set(devList);
        console.log('[Whitelist] Loaded developer whitelist:', devList);
      }

      // Load staff whitelist
      const staffWhitelistJson = await AsyncStorage.getItem(this.STAFF_WHITELIST_KEY);
      if (staffWhitelistJson) {
        const staffList = JSON.parse(staffWhitelistJson);
        this.staffWhitelistedUsers = new Set(staffList);
        console.log('[Whitelist] Loaded staff whitelist:', staffList);
      }

      // Load audit logs
      const auditLogsJson = await AsyncStorage.getItem(this.AUDIT_LOGS_KEY);
      if (auditLogsJson) {
        this.auditLogs = JSON.parse(auditLogsJson).map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
          grantedAt: log.grantedAt ? new Date(log.grantedAt) : undefined,
        }));
        console.log('[Whitelist] Loaded audit logs:', this.auditLogs.length);
      }

      // Sync with backend if online
      this.syncWithBackend().catch(err => {
        console.error('[Whitelist] Failed to sync with backend:', err);
      });
    } catch (error) {
      console.error('[Whitelist] Failed to initialize from storage:', error);
    }
  }

  /**
   * Add user to developer whitelist
   */
  async addDeveloperWhitelist(
    userId: string,
    grantedByAdminId: string,
    grantedByAdminEmail: string,
    reason?: string
  ): Promise<boolean> {
    try {
      // Add to local state
      this.devWhitelistedUsers.add(userId);

      // Persist to storage
      await this.saveDeveloperWhitelist();

      // Log audit
      const auditEntry: AuditLog = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        adminId: grantedByAdminId,
        adminEmail: grantedByAdminEmail,
        action: 'whitelist_add',
        targetUserId: userId,
        panelType: 'developer',
        timestamp: new Date(),
        reason,
        status: 'success',
      };
      await this.logAuditAction(auditEntry);

      // Broadcast change
      this.notifyListeners('whitelist');

      // Sync with backend asynchronously
      this.syncWithBackend().catch(err => {
        console.error('[Whitelist] Backend sync failed:', err);
      });

      console.log('[Whitelist] Added developer whitelist for user:', userId);
      return true;
    } catch (error) {
      console.error('[Whitelist] Failed to add developer whitelist:', error);
      return false;
    }
  }

  /**
   * Remove user from developer whitelist
   */
  async removeDeveloperWhitelist(
    userId: string,
    adminId: string,
    adminEmail: string
  ): Promise<boolean> {
    try {
      // Remove from local state
      this.devWhitelistedUsers.delete(userId);

      // Persist to storage
      await this.saveDeveloperWhitelist();

      // Log audit
      const auditEntry: AuditLog = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        adminId,
        adminEmail,
        action: 'whitelist_remove',
        targetUserId: userId,
        panelType: 'developer',
        timestamp: new Date(),
        status: 'success',
      };
      await this.logAuditAction(auditEntry);

      // Broadcast change
      this.notifyListeners('whitelist');

      // Sync with backend
      this.syncWithBackend().catch(err => {
        console.error('[Whitelist] Backend sync failed:', err);
      });

      console.log('[Whitelist] Removed developer whitelist for user:', userId);
      return true;
    } catch (error) {
      console.error('[Whitelist] Failed to remove developer whitelist:', error);
      return false;
    }
  }

  /**
   * Add user to staff whitelist
   */
  async addStaffWhitelist(
    userId: string,
    grantedByAdminId: string,
    grantedByAdminEmail: string,
    reason?: string
  ): Promise<boolean> {
    try {
      // Add to local state
      this.staffWhitelistedUsers.add(userId);

      // Persist to storage
      await this.saveStaffWhitelist();

      // Log audit
      const auditEntry: AuditLog = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        adminId: grantedByAdminId,
        adminEmail: grantedByAdminEmail,
        action: 'whitelist_add',
        targetUserId: userId,
        panelType: 'staff',
        timestamp: new Date(),
        reason,
        status: 'success',
      };
      await this.logAuditAction(auditEntry);

      // Broadcast change
      this.notifyListeners('whitelist');

      // Sync with backend
      this.syncWithBackend().catch(err => {
        console.error('[Whitelist] Backend sync failed:', err);
      });

      console.log('[Whitelist] Added staff whitelist for user:', userId);
      return true;
    } catch (error) {
      console.error('[Whitelist] Failed to add staff whitelist:', error);
      return false;
    }
  }

  /**
   * Remove user from staff whitelist
   */
  async removeStaffWhitelist(
    userId: string,
    adminId: string,
    adminEmail: string
  ): Promise<boolean> {
    try {
      // Remove from local state
      this.staffWhitelistedUsers.delete(userId);

      // Persist to storage
      await this.saveStaffWhitelist();

      // Log audit
      const auditEntry: AuditLog = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        adminId,
        adminEmail,
        action: 'whitelist_remove',
        targetUserId: userId,
        panelType: 'staff',
        timestamp: new Date(),
        status: 'success',
      };
      await this.logAuditAction(auditEntry);

      // Broadcast change
      this.notifyListeners('whitelist');

      // Sync with backend
      this.syncWithBackend().catch(err => {
        console.error('[Whitelist] Backend sync failed:', err);
      });

      console.log('[Whitelist] Removed staff whitelist for user:', userId);
      return true;
    } catch (error) {
      console.error('[Whitelist] Failed to remove staff whitelist:', error);
      return false;
    }
  }

  /**
   * Check if user is on developer whitelist
   */
  isDeveloperWhitelisted(userId: string): boolean {
    return this.devWhitelistedUsers.has(userId);
  }

  /**
   * Check if user is on staff whitelist
   */
  isStaffWhitelisted(userId: string): boolean {
    return this.staffWhitelistedUsers.has(userId);
  }

  /**
   * Get all developer whitelisted users
   */
  getDeveloperWhitelist(): string[] {
    return Array.from(this.devWhitelistedUsers);
  }

  /**
   * Get all staff whitelisted users
   */
  getStaffWhitelist(): string[] {
    return Array.from(this.staffWhitelistedUsers);
  }

  /**
   * Log audit action (admin activity)
   */
  private async logAuditAction(entry: AuditLog): Promise<void> {
    try {
      // Add to local log
      this.auditLogs.push(entry);

      // Trim if too large
      if (this.auditLogs.length > this.MAX_LOCAL_LOGS) {
        this.auditLogs = this.auditLogs.slice(-this.MAX_LOCAL_LOGS);
      }

      // Persist to storage
      await AsyncStorage.setItem(this.AUDIT_LOGS_KEY, JSON.stringify(this.auditLogs));

      // Broadcast change
      this.notifyListeners('audit');

      // Send to backend asynchronously
      this.sendAuditLogToBackend(entry).catch(err => {
        console.error('[Whitelist] Failed to send audit log to backend:', err);
      });

      console.log('[Whitelist] Audit logged:', entry.action, 'for user:', entry.targetUserId);
    } catch (error) {
      console.error('[Whitelist] Failed to log audit action:', error);
    }
  }

  /**
   * Get audit logs
   */
  getAuditLogs(limit?: number): AuditLog[] {
    if (limit) {
      return this.auditLogs.slice(-limit);
    }
    return this.auditLogs;
  }

  /**
   * Log server reset event
   */
  async logServerReset(adminId: string, adminEmail: string, reason?: string): Promise<void> {
    try {
      const auditEntry: AuditLog = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        adminId,
        adminEmail,
        action: 'server_reset',
        timestamp: new Date(),
        reason,
        status: 'success',
      };

      await this.logAuditAction(auditEntry);

      // Broadcast server reset via realtime service
      this.broadcastServerReset(adminId, adminEmail);

      console.log('[Whitelist] Server reset logged and broadcasted');
    } catch (error) {
      console.error('[Whitelist] Failed to log server reset:', error);
    }
  }

  /**
   * Broadcast server reset to all connected clients
   */
  private broadcastServerReset(adminId: string, adminEmail: string): void {
    try {
      // Send via realtime service if available
      if (realtimeService) {
        realtimeService.broadcast({
          type: 'server-reset',
          payload: {
            adminId,
            adminEmail,
            timestamp: new Date().toISOString(),
            message: 'Server is resetting for updates. Please close and reopen the app.',
          },
        });
        console.log('[Whitelist] Server reset broadcasted to all clients');
      }
    } catch (error) {
      console.error('[Whitelist] Failed to broadcast server reset:', error);
    }
  }

  /**
   * Save developer whitelist to AsyncStorage
   */
  private async saveDeveloperWhitelist(): Promise<void> {
    try {
      const whitelistArray = Array.from(this.devWhitelistedUsers);
      await AsyncStorage.setItem(this.DEV_WHITELIST_KEY, JSON.stringify(whitelistArray));
      console.log('[Whitelist] Developer whitelist saved to storage');
    } catch (error) {
      console.error('[Whitelist] Failed to save developer whitelist:', error);
    }
  }

  /**
   * Save staff whitelist to AsyncStorage
   */
  private async saveStaffWhitelist(): Promise<void> {
    try {
      const whitelistArray = Array.from(this.staffWhitelistedUsers);
      await AsyncStorage.setItem(this.STAFF_WHITELIST_KEY, JSON.stringify(whitelistArray));
      console.log('[Whitelist] Staff whitelist saved to storage');
    } catch (error) {
      console.error('[Whitelist] Failed to save staff whitelist:', error);
    }
  }

  /**
   * Sync whitelist data with backend
   */
  private async syncWithBackend(): Promise<void> {
    // Prevent concurrent syncs
    if (this.syncInProgress) {
      return;
    }

    try {
      this.syncInProgress = true;

      // Check if we should sync (throttle to prevent too frequent syncs)
      const now = Date.now();
      if (now - this.lastSyncTimestamp < 5000) { // Min 5 seconds between syncs
        return;
      }

      this.lastSyncTimestamp = now;

      // Prepare payload
      const payload = {
        devWhitelist: this.getDeveloperWhitelist(),
        staffWhitelist: this.getStaffWhitelist(),
        timestamp: new Date().toISOString(),
      };

      // Send to backend with error handling
      try {
        const response = await backend.syncWhitelist(payload);
        if (response) {
          console.log('[Whitelist] Backend sync successful');
        } else {
          console.warn('[Whitelist] Backend sync returned non-success response');
        }
      } catch (backendError: any) {
        // Handle specific backend errors
        if (backendError.message?.includes('Network request failed')) {
          console.warn('[Whitelist] Backend sync failed - network unavailable');
        } else if (backendError.message?.includes('Not initialized')) {
          console.warn('[Whitelist] Backend not initialized, skipping sync');
        } else {
          console.error('[Whitelist] Backend sync error:', backendError);
        }
      }
    } catch (error) {
      console.error('[Whitelist] Backend sync failed:', error);
      // Don't throw - sync failures are non-critical
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Send audit log to backend
   */
  private async sendAuditLogToBackend(entry: AuditLog): Promise<void> {
    try {
      await backend.sendAuditLog({
        ...entry,
        timestamp: entry.timestamp.toISOString(),
      });
      console.log('[Whitelist] Audit log sent to backend');
    } catch (error: any) {
      // Handle specific errors gracefully
      if (error.message?.includes('Network request failed')) {
        console.warn('[Whitelist] Audit log send failed - network unavailable');
      } else if (error.message?.includes('Not initialized')) {
        console.warn('[Whitelist] Backend not initialized, skipping audit log send');
      } else {
        console.error('[Whitelist] Failed to send audit log to backend:', error);
      }
      // Non-critical failure - log is stored locally anyway
    }
  }

  /**
   * Add change listener
   */
  subscribe(callback: (type: 'whitelist' | 'audit') => void): () => void {
    this.listeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of changes
   */
  private notifyListeners(type: 'whitelist' | 'audit'): void {
    this.listeners.forEach(listener => {
      try {
        listener(type);
      } catch (error) {
        console.error('[Whitelist] Listener error:', error);
      }
    });
  }

  /**
   * Clear all whitelist data (admin only - use with caution)
   */
  async clearAllWhitelists(adminId: string, adminEmail: string): Promise<boolean> {
    try {
      this.devWhitelistedUsers.clear();
      this.staffWhitelistedUsers.clear();

      await Promise.all([
        AsyncStorage.removeItem(this.DEV_WHITELIST_KEY),
        AsyncStorage.removeItem(this.STAFF_WHITELIST_KEY),
      ]);

      // Log audit
      const auditEntry: AuditLog = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        adminId,
        adminEmail,
        action: 'whitelist_remove',
        timestamp: new Date(),
        reason: 'Bulk clear all whitelists',
        status: 'success',
      };
      await this.logAuditAction(auditEntry);

      console.log('[Whitelist] All whitelists cleared');
      return true;
    } catch (error) {
      console.error('[Whitelist] Failed to clear whitelists:', error);
      return false;
    }
  }

  /**
   * Get whitelist statistics
   */
  getStatistics() {
    return {
      devWhitelistCount: this.devWhitelistedUsers.size,
      staffWhitelistCount: this.staffWhitelistedUsers.size,
      auditLogCount: this.auditLogs.length,
      lastSyncTimestamp: this.lastSyncTimestamp,
      syncInProgress: this.syncInProgress,
    };
  }
}

export const whitelistService = WhitelistService.getInstance();
export default WhitelistService;
