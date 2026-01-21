import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { usageInsights } from '../services/usageInsights';
import { analytics } from '../services/analytics';

const { width } = Dimensions.get('window');

export default function AnalyticsDashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [dailyBreakdown, setDailyBreakdown] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const [summaryData, dailyData] = await Promise.all([
        usageInsights.getInsightsSummary(),
        usageInsights.getDailyBreakdown(),
      ]);

      setSummary(summaryData);
      setDailyBreakdown(dailyData);

      // Track analytics view
      analytics.logEvent('analytics_dashboard_viewed');
    } catch (error) {
      console.error('Error loading insights:', error);
      analytics.logError('AnalyticsDashboardError', error as Error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInsights();
    setRefreshing(false);
  }, []);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const handleExport = async () => {
    try {
      const exported = await usageInsights.exportInsights();
      analytics.logEvent('analytics_exported');
      // In a real app, you'd share or save this file
      console.log('Exported analytics:', exported);
    } catch (error) {
      console.error('Export error:', error);
      analytics.logError('AnalyticsExportError', error as Error);
    }
  };

  const handleClearData = async () => {
    try {
      await usageInsights.clearData();
      setSummary(null);
      setDailyBreakdown({});
      analytics.logEvent('analytics_data_cleared');
    } catch (error) {
      console.error('Clear error:', error);
      analytics.logError('AnalyticsClearError', error as Error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Analytics Dashboard</Text>
        <Text style={styles.subtitle}>Your Usage Insights</Text>
      </View>

      {/* Overview Section */}
      <Section
        title="📊 Overview"
        expanded={expandedSections.has('overview')}
        onToggle={() => toggleSection('overview')}
      >
        {summary && (
          <View style={styles.statsGrid}>
            <StatCard
              label="Total Sessions"
              value={summary.total_sessions.toString()}
              icon="📱"
            />
            <StatCard
              label="Total App Time"
              value={formatTime(summary.total_app_time)}
              icon="⏱️"
            />
            <StatCard
              label="Avg Session Time"
              value={formatTime(summary.total_app_time / Math.max(summary.total_sessions, 1))}
              icon="⌚"
            />
            <StatCard
              label="Errors Detected"
              value={summary.error_frequency.toString()}
              icon="⚠️"
            />
          </View>
        )}
      </Section>

      {/* Top Features Section */}
      <Section
        title="⭐ Top Features"
        expanded={expandedSections.has('features')}
        onToggle={() => toggleSection('features')}
      >
        {summary && summary.most_used_features.length > 0 ? (
          <View style={styles.featuresList}>
            {summary.most_used_features.map((feature, index) => (
              <FeatureItem
                key={index}
                rank={index + 1}
                feature={feature.feature}
                count={feature.count}
                avgDuration={formatTime(feature.avg_duration)}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No feature data yet</Text>
        )}
      </Section>

      {/* Engagement Section */}
      <Section
        title="💪 Engagement Rate"
        expanded={expandedSections.has('engagement')}
        onToggle={() => toggleSection('engagement')}
      >
        {summary && Object.keys(summary.feature_engagement_rate).length > 0 ? (
          <View style={styles.engagementList}>
            {Object.entries(summary.feature_engagement_rate)
              .sort((a, b) => (b[1] as number) - (a[1] as number))
              .slice(0, 5)
              .map(([feature, rate], index) => (
                <EngagementItem
                  key={index}
                  feature={feature}
                  rate={(rate as number).toFixed(1)}
                />
              ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No engagement data yet</Text>
        )}
      </Section>

      {/* Daily Activity Section */}
      <Section
        title="📅 Daily Activity"
        expanded={expandedSections.has('daily')}
        onToggle={() => toggleSection('daily')}
      >
        {Object.keys(dailyBreakdown).length > 0 ? (
          <View style={styles.dailyList}>
            {Object.entries(dailyBreakdown)
              .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
              .slice(0, 7)
              .map(([date, duration], index) => (
                <DailyItem key={index} date={date} events={duration} />
              ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No daily data yet</Text>
        )}
      </Section>

      {/* Session Info */}
      <Section
        title="🔍 Session Info"
        expanded={expandedSections.has('session')}
        onToggle={() => toggleSection('session')}
      >
        <SessionInfo />
      </Section>

      {/* Actions Section */}
      <View style={styles.actionsSection}>
        <ActionButton
          label="Export Data"
          onPress={handleExport}
          style={styles.exportButton}
        />
        <ActionButton
          label="Clear Data"
          onPress={handleClearData}
          style={styles.clearButton}
          textColor="#FF3B30"
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Last updated: {new Date().toLocaleTimeString()}
        </Text>
      </View>
    </ScrollView>
  );
}

// Reusable Components
function Section({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <TouchableOpacity style={styles.sectionHeader} onPress={onToggle}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.expandIcon}>{expanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>
      {expanded && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function FeatureItem({
  rank,
  feature,
  count,
  avgDuration,
}: {
  rank: number;
  feature: string;
  count: number;
  avgDuration: string;
}) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureRank}>
        <Text style={styles.featureRankText}>#{rank}</Text>
      </View>
      <View style={styles.featureDetails}>
        <Text style={styles.featureName}>{feature}</Text>
        <Text style={styles.featureStats}>
          Used {count} times • Avg {avgDuration}
        </Text>
      </View>
    </View>
  );
}

function EngagementItem({ feature, rate }: { feature: string; rate: string }) {
  return (
    <View style={styles.engagementItem}>
      <Text style={styles.engagementFeature}>{feature}</Text>
      <View style={styles.engagementBar}>
        <View
          style={[
            styles.engagementBarFill,
            { width: `${Math.min(parseFloat(rate), 100)}%` },
          ]}
        />
      </View>
      <Text style={styles.engagementRate}>{rate}%</Text>
    </View>
  );
}

function DailyItem({ date, events }: { date: string; events: number }) {
  return (
    <View style={styles.dailyItem}>
      <Text style={styles.dailyDate}>{new Date(date).toLocaleDateString()}</Text>
      <View style={styles.dailyBar}>
        <View
          style={[
            styles.dailyBarFill,
            { height: Math.min(events / 100, 30) || 2 },
          ]}
        />
      </View>
      <Text style={styles.dailyCount}>{events} events</Text>
    </View>
  );
}

function SessionInfo() {
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  useEffect(() => {
    const info = analytics.getSessionInfo ? (analytics as any).getSessionInfo() : null;
    setSessionInfo(info);
  }, []);

  if (!sessionInfo) {
    return <Text style={styles.emptyText}>Session data unavailable</Text>;
  }

  return (
    <View style={styles.sessionInfo}>
      <InfoRow
        label="Session Started"
        value={new Date(sessionInfo.session_start).toLocaleTimeString()}
      />
      <InfoRow
        label="Current Duration"
        value={`${Math.floor(sessionInfo.session_duration / 1000)}s`}
      />
      <InfoRow
        label="Status"
        value={sessionInfo.is_initialized ? 'Active ✓' : 'Initializing...'}
      />
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  style,
  textColor,
}: {
  label: string;
  onPress: () => void;
  style?: any;
  textColor?: string;
}) {
  return (
    <TouchableOpacity style={[styles.actionButton, style]} onPress={onPress}>
      <Text style={[styles.actionButtonText, { color: textColor || '#007AFF' }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    backgroundColor: '#007AFF',
    paddingVertical: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  section: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  expandIcon: {
    fontSize: 12,
    color: '#666666',
  },
  sectionContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  featureRank: {
    width: 32,
    height: 32,
    backgroundColor: '#007AFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureRankText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  featureDetails: {
    flex: 1,
  },
  featureName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  featureStats: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  engagementList: {
    gap: 12,
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  engagementFeature: {
    width: 80,
    fontSize: 12,
    color: '#000000',
  },
  engagementBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  engagementBarFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 4,
  },
  engagementRate: {
    width: 40,
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'right',
  },
  dailyList: {
    gap: 16,
  },
  dailyItem: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  dailyDate: {
    width: 80,
    fontSize: 12,
    color: '#000000',
    fontWeight: '500',
  },
  dailyBar: {
    flex: 1,
    height: 30,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    justifyContent: 'flex-end',
  },
  dailyBarFill: {
    width: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  dailyCount: {
    width: 50,
    fontSize: 12,
    color: '#666666',
    textAlign: 'right',
  },
  sessionInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginVertical: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  exportButton: {
    borderColor: '#007AFF',
  },
  clearButton: {
    borderColor: '#FF3B30',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999999',
  },
});
