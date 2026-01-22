/**
 * Auto Maintenance Service
 * Automatically checks for errors, cleans up files, and monitors workspace health
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const execAsync = promisify(exec);

interface ErrorReport {
  timestamp: string;
  errorCount: number;
  errors: Array<{
    file: string;
    line: number;
    message: string;
    severity: 'error' | 'warning';
  }>;
}

interface CleanupReport {
  timestamp: string;
  filesRemoved: string[];
  spaceFreed: number;
}

class AutoMaintenanceService {
  private static instance: AutoMaintenanceService;
  private errorCheckInterval: ReturnType<typeof setInterval> | null = null;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;

  private constructor() {}

  static getInstance(): AutoMaintenanceService {
    if (!AutoMaintenanceService.instance) {
      AutoMaintenanceService.instance = new AutoMaintenanceService();
    }
    return AutoMaintenanceService.instance;
  }

  /**
   * Start automatic maintenance
   * @param errorCheckIntervalMinutes - How often to check for errors (default: 30 minutes)
   * @param cleanupIntervalHours - How often to clean up files (default: 24 hours)
   */
  async start(
    errorCheckIntervalMinutes: number = 30,
    cleanupIntervalHours: number = 24
  ): Promise<void> {
    if (this.isRunning) {
      console.log('Auto maintenance already running');
      return;
    }

    this.isRunning = true;
    console.log('🔧 Starting auto maintenance service...');

    // Initial checks
    await this.checkForErrors();
    await this.cleanupUnnecessaryFiles();

    // Schedule periodic checks
    this.errorCheckInterval = setInterval(
      () => this.checkForErrors(),
      errorCheckIntervalMinutes * 60 * 1000
    );

    this.cleanupInterval = setInterval(
      () => this.cleanupUnnecessaryFiles(),
      cleanupIntervalHours * 60 * 60 * 1000
    );

    await this.logActivity('Auto maintenance started', {
      errorCheckInterval: `${errorCheckIntervalMinutes} minutes`,
      cleanupInterval: `${cleanupIntervalHours} hours`,
    });
  }

  /**
   * Stop automatic maintenance
   */
  stop(): void {
    if (!this.isRunning) return;

    if (this.errorCheckInterval) {
      clearInterval(this.errorCheckInterval);
      this.errorCheckInterval = null;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.isRunning = false;
    console.log('🛑 Auto maintenance stopped');
  }

  /**
   * Check for TypeScript/ESLint errors in the workspace
   */
  async checkForErrors(): Promise<ErrorReport> {
    console.log('🔍 Checking for errors...');
    
    const report: ErrorReport = {
      timestamp: new Date().toISOString(),
      errorCount: 0,
      errors: [],
    };

    try {
      // Run TypeScript compiler check
      try {
        await execAsync('npx tsc --noEmit 2>&1');
      } catch (error: any) {
        const output = error.stdout || error.stderr || '';
        const errorLines = output.split('\n').filter((line: string) => 
          line.includes('error TS') || line.includes('warning TS')
        );

        errorLines.forEach((line: string) => {
          const match = line.match(/(.+)\((\d+),\d+\): (error|warning) TS\d+: (.+)/);
          if (match) {
            report.errors.push({
              file: match[1],
              line: parseInt(match[2]),
              message: match[4],
              severity: match[3] as 'error' | 'warning',
            });
          }
        });
      }

      // Run ESLint check
      try {
        await execAsync('npx eslint . --format json 2>&1');
      } catch (error: any) {
        const output = error.stdout || '';
        try {
          const eslintResults = JSON.parse(output);
          eslintResults.forEach((result: any) => {
            result.messages.forEach((msg: any) => {
              report.errors.push({
                file: result.filePath,
                line: msg.line,
                message: msg.message,
                severity: msg.severity === 2 ? 'error' : 'warning',
              });
            });
          });
        } catch {
          // ESLint output wasn't JSON, skip
        }
      }

      report.errorCount = report.errors.filter(e => e.severity === 'error').length;

      // Store report
      await this.storeErrorReport(report);

      if (report.errorCount > 0) {
        console.warn(`⚠️ Found ${report.errorCount} errors in workspace`);
        await this.logActivity('Errors detected', { count: report.errorCount });
      } else {
        console.log('✅ No errors found');
      }

      return report;
    } catch (error) {
      console.error('Error checking workspace:', error);
      await this.logActivity('Error check failed', { error: String(error) });
      return report;
    }
  }

  /**
   * Clean up unnecessary documentation and temporary files
   */
  async cleanupUnnecessaryFiles(): Promise<CleanupReport> {
    console.log('🗑️ Cleaning up unnecessary files...');

    const report: CleanupReport = {
      timestamp: new Date().toISOString(),
      filesRemoved: [],
      spaceFreed: 0,
    };

    const unnecessaryPatterns = [
      '*SUMMARY*.md',
      '*COMPLETE*.md',
      '*IMPLEMENTATION*.md',
      '*VERIFICATION*.md',
      '*INDEX.md',
      '*CHANGELOG*.md',
      '*.log',
      '*.tmp',
      '.DS_Store',
      'Thumbs.db',
    ];

    // Whitelist - never delete these
    const whitelist = [
      'SECURITY_IMPLEMENTATION.md',
      'SECURITY_QUICK_REFERENCE.md',
      'VIP_DEVELOPER_GUIDE.md',
      'START_HERE.md',
      'README.md',
      'backend/README.md',
    ];

    try {
      for (const pattern of unnecessaryPatterns) {
        try {
          const { stdout } = await execAsync(
            `find . -maxdepth 1 -type f -name "${pattern}" 2>/dev/null || true`
          );
          
          const files = stdout
            .split('\n')
            .filter(f => f.trim() !== '')
            .map(f => f.replace('./', ''));

          for (const file of files) {
            if (whitelist.includes(file)) continue;

            try {
              // Get file size before deletion
              const { stdout: sizeStr } = await execAsync(`stat -f%z "${file}" 2>/dev/null || stat -c%s "${file}" 2>/dev/null || echo 0`);
              const size = parseInt(sizeStr.trim()) || 0;

              await execAsync(`rm -f "${file}"`);
              report.filesRemoved.push(file);
              report.spaceFreed += size;
            } catch (err) {
              console.warn(`Failed to delete ${file}:`, err);
            }
          }
        } catch {
          // Pattern didn't match anything, continue
        }
      }

      // Store cleanup report
      await this.storeCleanupReport(report);

      if (report.filesRemoved.length > 0) {
        console.log(`✅ Removed ${report.filesRemoved.length} unnecessary files (${this.formatBytes(report.spaceFreed)} freed)`);
        await this.logActivity('Files cleaned up', {
          count: report.filesRemoved.length,
          spaceFreed: this.formatBytes(report.spaceFreed),
        });
      } else {
        console.log('✅ No unnecessary files found');
      }

      return report;
    } catch (error) {
      console.error('Error cleaning up files:', error);
      await this.logActivity('Cleanup failed', { error: String(error) });
      return report;
    }
  }

  /**
   * Get latest error report
   */
  async getLatestErrorReport(): Promise<ErrorReport | null> {
    try {
      const reports = await AsyncStorage.getItem('auto_maintenance:error_reports');
      if (!reports) return null;
      
      const parsed = JSON.parse(reports);
      return parsed[0] || null;
    } catch {
      return null;
    }
  }

  /**
   * Get cleanup history
   */
  async getCleanupHistory(): Promise<CleanupReport[]> {
    try {
      const reports = await AsyncStorage.getItem('auto_maintenance:cleanup_reports');
      if (!reports) return [];
      
      return JSON.parse(reports);
    } catch {
      return [];
    }
  }

  /**
   * Get maintenance status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      errorCheckActive: this.errorCheckInterval !== null,
      cleanupActive: this.cleanupInterval !== null,
    };
  }

  // Private helper methods

  private async storeErrorReport(report: ErrorReport): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem('auto_maintenance:error_reports');
      const reports = existing ? JSON.parse(existing) : [];
      
      reports.unshift(report);
      // Keep last 50 reports
      const trimmed = reports.slice(0, 50);
      
      await AsyncStorage.setItem('auto_maintenance:error_reports', JSON.stringify(trimmed));
    } catch (error) {
      console.error('Failed to store error report:', error);
    }
  }

  private async storeCleanupReport(report: CleanupReport): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem('auto_maintenance:cleanup_reports');
      const reports = existing ? JSON.parse(existing) : [];
      
      reports.unshift(report);
      // Keep last 50 reports
      const trimmed = reports.slice(0, 50);
      
      await AsyncStorage.setItem('auto_maintenance:cleanup_reports', JSON.stringify(trimmed));
    } catch (error) {
      console.error('Failed to store cleanup report:', error);
    }
  }

  private async logActivity(action: string, details: any): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem('auto_maintenance:activity_log');
      const logs = existing ? JSON.parse(existing) : [];
      
      logs.unshift({
        timestamp: new Date().toISOString(),
        action,
        details,
      });
      
      // Keep last 200 log entries
      const trimmed = logs.slice(0, 200);
      
      await AsyncStorage.setItem('auto_maintenance:activity_log', JSON.stringify(trimmed));
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

export default AutoMaintenanceService.getInstance();
