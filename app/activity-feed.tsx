import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, Text, StyleSheet, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MessageSquare, Phone, Star, CheckCircle } from 'lucide-react-native';
import { socialDiscoveryService } from '../services/socialDiscovery';
import { useRouter } from 'expo-router';

export default function ActivityFeedScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [userId] = useState('demo-user-123');

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const feed = await socialDiscoveryService.getActivityFeedForUser(userId, 20);
      setActivities(feed || []);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'message': return <MessageSquare size={20} color="#007AFF" />;
      case 'call': return <Phone size={20} color="#34C759" />;
      case 'milestone': return <Star size={20} color="#FFD700" />;
      default: return <CheckCircle size={20} color="#999" />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Activity Feed</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
        ) : activities.length > 0 ? (
          activities.map((activity, idx) => (
            <View key={idx} style={styles.activityCard}>
              <View style={styles.iconContainer}>
                {getIcon(activity.type)}
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityDescription}>{activity.description}</Text>
                <Text style={styles.activityTime}>
                  {new Date(activity.timestamp).toLocaleDateString()} at {new Date(activity.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No recent activity</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  backButton: { width: 60 },
  backText: { fontSize: 17, color: '#007AFF' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  content: { padding: 16, paddingTop: 0 },
  loader: { marginTop: 40 },
  activityCard: { flexDirection: 'row', backgroundColor: '#1a1a1a', padding: 16, borderRadius: 12, marginBottom: 12 },
  iconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  activityInfo: { flex: 1 },
  activityTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  activityDescription: { fontSize: 14, color: '#bbb', marginTop: 4 },
  activityTime: { fontSize: 12, color: '#666', marginTop: 6 },
  emptyText: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 40 },
});
