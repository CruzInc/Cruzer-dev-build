import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, Text, StyleSheet, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Trophy, Star, Zap, TrendingUp } from 'lucide-react-native';
import { gamificationService } from '../services/gamification';
import { useRouter } from 'expo-router';

export default function GamificationScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [userId] = useState('demo-user-123');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const userStats = await gamificationService.getUserStatistics(userId);
      setStats(userStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading your stats...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Gamification</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Zap size={32} color="#FFD700" />
            <Text style={styles.statValue}>{stats?.messagesSent || 0}</Text>
            <Text style={styles.statLabel}>Messages Sent</Text>
          </View>

          <View style={styles.statCard}>
            <Trophy size={32} color="#FF6B6B" />
            <Text style={styles.statValue}>{stats?.callsMade || 0}</Text>
            <Text style={styles.statLabel}>Calls Made</Text>
          </View>

          <View style={styles.statCard}>
            <Star size={32} color="#4ECDC4" />
            <Text style={styles.statValue}>{stats?.badges || 0}</Text>
            <Text style={styles.statLabel}>Badges Earned</Text>
          </View>

          <View style={styles.statCard}>
            <TrendingUp size={32} color="#95E1D3" />
            <Text style={styles.statValue}>{stats?.currentStreak || 0}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          {(!stats?.badges || stats.badges === 0) ? (
            <Text style={styles.emptyText}>No badges yet. Keep chatting to earn rewards!</Text>
          ) : (
            <View style={styles.badgeList}>
              <View style={styles.badge}>
                <Trophy size={20} color="#FFD700" />
                <Text style={styles.badgeText}>First Message</Text>
              </View>
              {stats.messagesSent >= 100 && (
                <View style={styles.badge}>
                  <Star size={20} color="#FFD700" />
                  <Text style={styles.badgeText}>Chatty (100 messages)</Text>
                </View>
              )}
              {stats.callsMade >= 10 && (
                <View style={styles.badge}>
                  <Zap size={20} color="#4ECDC4" />
                  <Text style={styles.badgeText}>Caller (10 calls)</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Milestones</Text>
          <View style={styles.milestone}>
            <Text style={styles.milestoneText}>📱 Send 1,000 messages</Text>
            <Text style={styles.milestoneProgress}>{stats?.messagesSent || 0} / 1000</Text>
          </View>
          <View style={styles.milestone}>
            <Text style={styles.milestoneText}>📞 Make 50 calls</Text>
            <Text style={styles.milestoneProgress}>{stats?.callsMade || 0} / 50</Text>
          </View>
          <View style={styles.milestone}>
            <Text style={styles.milestoneText}>🔥 30-day streak</Text>
            <Text style={styles.milestoneProgress}>{stats?.currentStreak || 0} / 30</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 16, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#999', fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backButton: { width: 60 },
  backText: { fontSize: 17, color: '#007AFF' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginTop: 8 },
  statLabel: { fontSize: 14, color: '#999', marginTop: 4 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: '#fff', marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#666', fontStyle: 'italic' },
  badgeList: { gap: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', padding: 12, borderRadius: 8, gap: 12 },
  badgeText: { fontSize: 16, color: '#fff' },
  milestone: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1a1a', padding: 12, borderRadius: 8, marginBottom: 8 },
  milestoneText: { fontSize: 15, color: '#fff' },
  milestoneProgress: { fontSize: 15, color: '#007AFF', fontWeight: '600' },
});
