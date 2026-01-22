/**
 * Debug Monitor Service
 * Real-time bug detection and logging for developers
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { backend } from './backend';

export interface DebugLog {
  id: string;
  timestamp: Date;
  level: 'error' | 'warning' | 'info' | 'crash' | 'glitch';
  category: 'ui' | 'network' | 'storage' | 'performance' | 'crash' | 'other';
  message: string;
  details?: string;
  stackTrace?: string;
  deviceInfo?: {
    platform: string;
    version: string;
    memory?: string;
  };
  userId?: string;
  resolved: boolean;
}

export interface BugReport {
  totalErrors: number;
  totalWarnings: number;
  totalCrashes: number;
  recentLogs: DebugLog[];
  performanceMetrics: {
    avgResponseTime: number;
    failedRequests: number;
    memoryUsage?: number;
  };
}

class DebugMonitorService {
  private static instance: DebugMonitorService;
  private debugLogs: DebugLog[] = [];
  private readonly MAX_LOGS = 500;
  private readonly STORAGE_KEY = 'debug:logs';
  private isMonitoring: boolean = false;
  private listeners: ((log: DebugLog) => void)[] = [];

  private constructor() {
    this.initializeFromStorage();
  }

  static getInstance(): DebugMonitorService {
    if (!DebugMonitorService.instance) {
      DebugMonitorService.instance = new DebugMonitorService();
    }
    return DebugMonitorService.instance;
  }

  private async initializeFromStorage(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const logs = JSON.parse(stored);
        this.debugLogs = logs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        }));
        console.log(`[Debug Monitor] Loaded ${this.debugLogs.length} logs from storage`);
      }
    } catch (error) {
      console.error('[Debug Monitor] Failed to load logs:', error);
    }
  }

  private async saveLogs(): Promise<void> {
    try {
      // Keep only recent logs
      const recentLogs = this.debugLogs.slice(-this.MAX_LOGS);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentLogs));
    } catch (error) {
      console.error('[Debug Monitor] Failed to save logs:', error);
    }
  }

  /**
   * Start monitoring for bugs and errors
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Hook into global error handler
    const originalErrorHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      this.logError({
        level: isFatal ? 'crash' : 'error',
        category: 'crash',
        message: error.message || 'Unknown error',
        stackTrace: error.stack,
      });
      
      // Call original handler
      if (originalErrorHandler) {
        originalErrorHandler(error, isFatal);
      }
    });

    // Hook into console.error
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      this.logError({
        level: 'error',
        category: 'other',
        message: message,
      });
      
      originalConsoleError(...args);
    };

    console.log('[Debug Monitor] Started monitoring');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    console.log('[Debug Monitor] Stopped monitoring');
  }

  /**
   * Log an error/warning/info
   */
  logError(params: {
    level: DebugLog['level'];
    category: DebugLog['category'];
    message: string;
    details?: string;
    stackTrace?: string;
    userId?: string;
  }): void {
    const log: DebugLog = {
      id: `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false,
      ...params,
    };

    this.debugLogs.push(log);
    
    // Notify listeners
    this.listeners.forEach(listener => listener(log));
    
    // Save to storage
    this.saveLogs();
    
    // Send to backend if critical
    if (log.level === 'crash' || log.level === 'error') {
      this.sendToBackend(log);
    }

    console.log(`[Debug Monitor] Logged ${log.level}: ${log.message}`);
  }

  /**
   * Run comprehensive bug check
   */
  async runBugCheck(): Promise<BugReport> {
    console.log('[Debug Monitor] Running bug check...');

    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;

    const recentLogs = this.debugLogs.filter(
      log => log.timestamp.getTime() > last24h
    );

    const errors = recentLogs.filter(log => log.level === 'error');
    const warnings = recentLogs.filter(log => log.level === 'warning');
    const crashes = recentLogs.filter(log => log.level === 'crash');

    // Check for common issues
    await this.checkStorageHealth();
    await this.checkNetworkHealth();
    await this.checkPerformance();

    const report: BugReport = {
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      totalCrashes: crashes.length,
      recentLogs: recentLogs.slice(-50), // Last 50 logs
      performanceMetrics: {
        avgResponseTime: 0, // TODO: Calculate from network logs
        failedRequests: 0, // TODO: Calculate from network logs
      },
    };

    console.log('[Debug Monitor] Bug check complete:', {
      errors: report.totalErrors,
      warnings: report.totalWarnings,
      crashes: report.totalCrashes,
    });

    return report;
  }

  /**
   * Check storage health
   */
  private async checkStorageHealth(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      if (keys.length > 100) {
        this.logError({
          level: 'warning',
          category: 'storage',
          message: `High storage key count: ${keys.length} keys`,
          details: 'Consider cleanup of old data',
        });
      }
    } catch (error: any) {
      this.logError({
        level: 'error',
        category: 'storage',
        message: 'Storage health check failed',
        details: error.message,
      });
    }
  }

  /**
   * Check network health
   */
  private async checkNetworkHealth(): Promise<void> {
    try {
      const start = Date.now();
      // Simple ping to backend
      await backend.getVersion(); // Assuming this method exists
      const duration = Date.now() - start;

      if (duration > 5000) {
        this.logError({
          level: 'warning',
          category: 'network',
          message: `Slow network response: ${duration}ms`,
        });
      }
    } catch (error: any) {
      this.logError({
        level: 'error',
        category: 'network',
        message: 'Network health check failed',
        details: error.message,
      });
    }
  }

  /**
   * Check performance
   */
  private async checkPerformance(): Promise<void> {
    // Check if there are repeated errors (potential memory leak)
    const errorMessages = this.debugLogs
      .filter(log => log.level === 'error')
      .map(log => log.message);

    const messageCounts: Record<string, number> = {};
    errorMessages.forEach(msg => {
      messageCounts[msg] = (messageCounts[msg] || 0) + 1;
    });

    Object.entries(messageCounts).forEach(([msg, count]) => {
      if (count > 10) {
        this.logError({
          level: 'warning',
          category: 'performance',
          message: `Repeated error detected: "${msg.substring(0, 50)}..." (${count} times)`,
          details: 'Possible memory leak or unhandled error',
        });
      }
    });
  }

  /**
   * Get all logs
   */
  getAllLogs(): DebugLog[] {
    return [...this.debugLogs];
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: DebugLog['level']): DebugLog[] {
    return this.debugLogs.filter(log => log.level === level);
  }

  /**
   * Get logs by category
   */
  getLogsByCategory(category: DebugLog['category']): DebugLog[] {
    return this.debugLogs.filter(log => log.category === category);
  }

  /**
   * Mark log as resolved
   */
  async resolveLog(logId: string): Promise<void> {
    const log = this.debugLogs.find(l => l.id === logId);
    if (log) {
      log.resolved = true;
      await this.saveLogs();
      console.log(`[Debug Monitor] Resolved log: ${logId}`);
    }
  }

  /**
   * Clear all logs
   */
  async clearLogs(): Promise<void> {
    this.debugLogs = [];
    await AsyncStorage.removeItem(this.STORAGE_KEY);
    console.log('[Debug Monitor] Cleared all logs');
  }

  /**
   * Subscribe to new logs
   */
  subscribe(listener: (log: DebugLog) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Send log to backend
   */
  private async sendToBackend(log: DebugLog): Promise<void> {
    try {
      // TODO: Implement backend endpoint
      // await backend.sendDebugLog(log);
      console.log('[Debug Monitor] Would send to backend:', log.message);
    } catch (error) {
      console.error('[Debug Monitor] Failed to send log to backend:', error);
    }
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.debugLogs, null, 2);
  }

  /**
   * Get statistics
   */
  getStats(): {
    total: number;
    byLevel: Record<DebugLog['level'], number>;
    byCategory: Record<DebugLog['category'], number>;
    resolved: number;
    unresolved: number;
  } {
    const byLevel: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    let resolved = 0;

    this.debugLogs.forEach(log => {
      byLevel[log.level] = (byLevel[log.level] || 0) + 1;
      byCategory[log.category] = (byCategory[log.category] || 0) + 1;
      if (log.resolved) resolved++;
    });

    return {
      total: this.debugLogs.length,
      byLevel: byLevel as any,
      byCategory: byCategory as any,
      resolved,
      unresolved: this.debugLogs.length - resolved,
    };
  }
}

export const debugMonitor = DebugMonitorService.getInstance();
