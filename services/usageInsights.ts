import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Usage Insights Service
 * Collects and aggregates local usage data
 */

interface UsageData {
  timestamp: number;
  event: string;
  duration?: number;
  metadata?: Record<string, any>;
}

interface InsightsSummary {
  total_sessions: number;
  total_app_time: number;
  most_used_features: Array<{ feature: string; count: number; avg_duration: number }>;
  daily_usage_pattern: Record<string, number>;
  feature_engagement_rate: Record<string, number>;
  error_frequency: number;
  last_updated: number;
}

class UsageInsightsService {
  private static instance: UsageInsightsService;
  private storageKey = 'app_usage_insights';
  private usageBuffer: UsageData[] = [];
  private bufferSize = 50; // Flush after 50 events

  private constructor() {
    this.loadUsageData();
  }

  static getInstance(): UsageInsightsService {
    if (!UsageInsightsService.instance) {
      UsageInsightsService.instance = new UsageInsightsService();
    }
    return UsageInsightsService.instance;
  }

  /**
   * Record a usage event
   */
  async recordEvent(event: string, duration?: number, metadata?: Record<string, any>): Promise<void> {
    const usageData: UsageData = {
      timestamp: Date.now(),
      event,
      duration,
      metadata,
    };

    this.usageBuffer.push(usageData);

    // Auto-flush if buffer is full
    if (this.usageBuffer.length >= this.bufferSize) {
      await this.flushBuffer();
    }
  }

  /**
   * Flush buffer to storage
   */
  async flushBuffer(): Promise<void> {
    if (this.usageBuffer.length === 0) return;

    try {
      const existing = await this.getStoredData();
      const updated = [...existing, ...this.usageBuffer];

      // Keep only last 7 days of data
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const filtered = updated.filter(item => item.timestamp > weekAgo);

      await AsyncStorage.setItem(this.storageKey, JSON.stringify(filtered));
      this.usageBuffer = [];

      console.log('[UsageInsights] Buffer flushed successfully');
    } catch (error) {
      console.error('[UsageInsights] Flush error:', error);
    }
  }

  /**
   * Get stored usage data
   */
  private async getStoredData(): Promise<UsageData[]> {
    try {
      const data = await AsyncStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[UsageInsights] Storage read error:', error);
      return [];
    }
  }

  /**
   * Load usage data from storage
   */
  private async loadUsageData(): Promise<void> {
    try {
      const data = await this.getStoredData();
      console.log(`[UsageInsights] Loaded ${data.length} usage records`);
    } catch (error) {
      console.error('[UsageInsights] Load error:', error);
    }
  }

  /**
   * Get comprehensive insights summary
   */
  async getInsightsSummary(): Promise<InsightsSummary> {
    try {
      const data = await this.getStoredData();

      if (data.length === 0) {
        return this.getEmptySummary();
      }

      // Calculate metrics
      const sessions = this.countSessions(data);
      const totalTime = this.calculateTotalTime(data);
      const mostUsed = this.getMostUsedFeatures(data);
      const dailyPattern = this.getDailyUsagePattern(data);
      const engagementRate = this.calculateEngagementRate(data);
      const errorFreq = this.calculateErrorFrequency(data);

      return {
        total_sessions: sessions,
        total_app_time: totalTime,
        most_used_features: mostUsed,
        daily_usage_pattern: dailyPattern,
        feature_engagement_rate: engagementRate,
        error_frequency: errorFreq,
        last_updated: Date.now(),
      };
    } catch (error) {
      console.error('[UsageInsights] Summary error:', error);
      return this.getEmptySummary();
    }
  }

  /**
   * Get feature-specific insights
   */
  async getFeatureInsights(featureName: string): Promise<any> {
    try {
      const data = await this.getStoredData();
      const featureData = data.filter(item => item.event === featureName);

      if (featureData.length === 0) {
        return null;
      }

      return {
        feature: featureName,
        usage_count: featureData.length,
        total_duration: featureData.reduce((sum, item) => sum + (item.duration || 0), 0),
        average_duration: featureData.reduce((sum, item) => sum + (item.duration || 0), 0) / featureData.length,
        last_used: Math.max(...featureData.map(item => item.timestamp)),
        usage_frequency_per_day: featureData.length / 7, // Assuming 7 days max
      };
    } catch (error) {
      console.error('[UsageInsights] Feature insights error:', error);
      return null;
    }
  }

  /**
   * Get daily usage breakdown
   */
  async getDailyBreakdown(): Promise<Record<string, number>> {
    try {
      const data = await this.getStoredData();
      const breakdown: Record<string, number> = {};

      data.forEach(item => {
        const date = new Date(item.timestamp).toISOString().split('T')[0];
        breakdown[date] = (breakdown[date] || 0) + (item.duration || 1);
      });

      return breakdown;
    } catch (error) {
      console.error('[UsageInsights] Daily breakdown error:', error);
      return {};
    }
  }

  /**
   * Clear all insights data
   */
  async clearData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.storageKey);
      this.usageBuffer = [];
      console.log('[UsageInsights] Data cleared');
    } catch (error) {
      console.error('[UsageInsights] Clear error:', error);
    }
  }

  /**
   * Export insights as JSON
   */
  async exportInsights(): Promise<string> {
    try {
      const summary = await this.getInsightsSummary();
      const dailyBreakdown = await this.getDailyBreakdown();

      return JSON.stringify(
        {
          summary,
          daily_breakdown: dailyBreakdown,
          export_timestamp: new Date().toISOString(),
        },
        null,
        2
      );
    } catch (error) {
      console.error('[UsageInsights] Export error:', error);
      return '';
    }
  }

  // ==================== Private Helpers ====================

  private getEmptySummary(): InsightsSummary {
    return {
      total_sessions: 0,
      total_app_time: 0,
      most_used_features: [],
      daily_usage_pattern: {},
      feature_engagement_rate: {},
      error_frequency: 0,
      last_updated: Date.now(),
    };
  }

  private countSessions(data: UsageData[]): number {
    // Count unique days with activity
    const days = new Set(data.map(item => new Date(item.timestamp).toDateString()));
    return days.size;
  }

  private calculateTotalTime(data: UsageData[]): number {
    return data.reduce((sum, item) => sum + (item.duration || 0), 0);
  }

  private getMostUsedFeatures(data: UsageData[]): Array<{ feature: string; count: number; avg_duration: number }> {
    const featureMap: Record<string, { count: number; totalDuration: number }> = {};

    data.forEach(item => {
      if (!featureMap[item.event]) {
        featureMap[item.event] = { count: 0, totalDuration: 0 };
      }
      featureMap[item.event].count++;
      featureMap[item.event].totalDuration += item.duration || 0;
    });

    return Object.entries(featureMap)
      .map(([feature, { count, totalDuration }]) => ({
        feature,
        count,
        avg_duration: totalDuration / count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10
  }

  private getDailyUsagePattern(data: UsageData[]): Record<string, number> {
    const pattern: Record<string, number> = {};

    data.forEach(item => {
      const date = new Date(item.timestamp).toISOString().split('T')[0];
      pattern[date] = (pattern[date] || 0) + 1;
    });

    return pattern;
  }

  private calculateEngagementRate(data: UsageData[]): Record<string, number> {
    const totalEvents = data.length;
    const featureMap: Record<string, number> = {};

    data.forEach(item => {
      featureMap[item.event] = (featureMap[item.event] || 0) + 1;
    });

    const engagementRate: Record<string, number> = {};
    Object.entries(featureMap).forEach(([feature, count]) => {
      engagementRate[feature] = (count / totalEvents) * 100;
    });

    return engagementRate;
  }

  private calculateErrorFrequency(data: UsageData[]): number {
    const errors = data.filter(item => item.event.includes('error') || item.event.includes('crash'));
    return errors.length;
  }
}

export const usageInsights = UsageInsightsService.getInstance();
export default UsageInsightsService;
