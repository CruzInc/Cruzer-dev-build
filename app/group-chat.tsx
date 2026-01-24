import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, StyleSheet, View, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Users, Plus } from 'lucide-react-native';
import { socialDiscoveryService } from '../services/socialDiscovery';
import { useRouter } from 'expo-router';

export default function GroupChatScreen() {
  const router = useRouter();
  const [groupName, setGroupName] = useState('');
  const [userId] = useState('demo-user-123');

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }
    try {
      await socialDiscoveryService.createGroupChat(groupName, userId, [userId]);
      Alert.alert('Success', `Group "${groupName}" created!`);
      setGroupName('');
    } catch (error) {
      Alert.alert('Error', 'Failed to create group');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Group Chat</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.createSection}>
          <View style={styles.icon}>
            <Users size={40} color="#007AFF" />
          </View>
          <Text style={styles.sectionTitle}>Create New Group</Text>
          <TextInput
            style={styles.input}
            placeholder="Group name"
            placeholderTextColor="#666"
            value={groupName}
            onChangeText={setGroupName}
          />
          <TouchableOpacity style={styles.createButton} onPress={handleCreateGroup}>
            <Plus size={20} color="#fff" />
            <Text style={styles.createButtonText}>Create Group</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About Group Chats</Text>
          <Text style={styles.infoText}>• Create multi-user conversations</Text>
          <Text style={styles.infoText}>• Invite friends to join</Text>
          <Text style={styles.infoText}>• Share messages with everyone</Text>
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
  createSection: { backgroundColor: '#1a1a1a', padding: 24, borderRadius: 12, alignItems: 'center', marginBottom: 24 },
  icon: { marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: '#fff', marginBottom: 16 },
  input: { width: '100%', backgroundColor: '#0a0a0a', color: '#fff', fontSize: 16, padding: 12, borderRadius: 8, marginBottom: 16 },
  createButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#007AFF', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  createButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  infoSection: { backgroundColor: '#1a1a1a', padding: 16, borderRadius: 12 },
  infoTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 12 },
  infoText: { fontSize: 15, color: '#bbb', marginBottom: 8 },
});
