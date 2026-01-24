import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, StyleSheet, View, TouchableOpacity, Switch, TextInput, Alert } from 'react-native';
import { Shield, Moon, MessageCircle, UserX } from 'lucide-react-native';
import { presenceService } from '../services/presence';
import { customizationSecurityService } from '../services/customization';
import { useRouter } from 'expo-router';

export default function SecurityScreen() {
  const router = useRouter();
  const [dndEnabled, setDndEnabled] = useState(false);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [autoReplyMessage, setAutoReplyMessage] = useState('I\'m away, I\'ll reply soon!');
  const [userId] = useState('demo-user-123');

  const handleToggleDND = async (value: boolean) => {
    setDndEnabled(value);
    try {
      await presenceService.setDoNotDisturb(userId, value, '22:00', '08:00');
      Alert.alert('DND Updated', value ? 'Enabled (10 PM - 8 AM)' : 'Disabled');
    } catch (error) {
      console.error('Failed to toggle DND:', error);
    }
  };

  const handleToggleAutoReply = async (value: boolean) => {
    setAutoReplyEnabled(value);
    try {
      await presenceService.setAutoReply(userId, value, autoReplyMessage);
      Alert.alert('Auto-Reply Updated', value ? 'Enabled' : 'Disabled');
    } catch (error) {
      console.error('Failed to toggle auto-reply:', error);
    }
  };

  const handleBlockUser = () => {
    Alert.prompt('Block User', 'Enter user ID to block', async (userIdToBlock) => {
      if (userIdToBlock) {
        try {
          await customizationSecurityService.blockUser(userId, userIdToBlock);
          Alert.alert('User Blocked', `User ${userIdToBlock} has been blocked`);
        } catch (error) {
          Alert.alert('Error', 'Failed to block user');
        }
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Security</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={24} color="#34C759" />
            <Text style={styles.sectionTitle}>Privacy Settings</Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Moon size={20} color="#5856D6" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Do Not Disturb</Text>
                <Text style={styles.settingDescription}>10 PM - 8 AM daily</Text>
              </View>
            </View>
            <Switch
              value={dndEnabled}
              onValueChange={handleToggleDND}
              trackColor={{ false: '#3e3e3e', true: '#34C759' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MessageCircle size={20} color="#007AFF" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Auto-Reply</Text>
                <Text style={styles.settingDescription}>Send automatic responses</Text>
              </View>
            </View>
            <Switch
              value={autoReplyEnabled}
              onValueChange={handleToggleAutoReply}
              trackColor={{ false: '#3e3e3e', true: '#34C759' }}
              thumbColor="#fff"
            />
          </View>

          {autoReplyEnabled && (
            <View style={styles.autoReplyInput}>
              <TextInput
                style={styles.input}
                placeholder="Auto-reply message"
                placeholderTextColor="#666"
                value={autoReplyMessage}
                onChangeText={setAutoReplyMessage}
                multiline
              />
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <UserX size={24} color="#FF3B30" />
            <Text style={styles.sectionTitle}>User Management</Text>
          </View>

          <TouchableOpacity style={styles.dangerButton} onPress={handleBlockUser}>
            <Text style={styles.dangerButtonText}>Block User</Text>
          </TouchableOpacity>

          <Text style={styles.helpText}>
            Blocked users cannot send you messages or see your status.
          </Text>
        </View>
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
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: '#fff' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1a1a', padding: 16, borderRadius: 12, marginBottom: 12 },
  settingInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  settingText: { flex: 1 },
  settingLabel: { fontSize: 16, fontWeight: '600', color: '#fff' },
  settingDescription: { fontSize: 13, color: '#999', marginTop: 2 },
  autoReplyInput: { backgroundColor: '#1a1a1a', padding: 16, borderRadius: 12 },
  input: { color: '#fff', fontSize: 15, minHeight: 60, textAlignVertical: 'top' },
  dangerButton: { backgroundColor: '#FF3B30', padding: 16, borderRadius: 12, alignItems: 'center' },
  dangerButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  helpText: { fontSize: 13, color: '#666', marginTop: 12, lineHeight: 18 },
});
