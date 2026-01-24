import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, Text, StyleSheet, View, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Plus, Clock } from 'lucide-react-native';
import { socialDiscoveryService } from '../services/socialDiscovery';
import { useRouter } from 'expo-router';

export default function StoriesScreen() {
  const router = useRouter();
  const [stories, setStories] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [storyContent, setStoryContent] = useState('');
  const [userId] = useState('demo-user-123');
  const [userName] = useState('Demo User');

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const activeStories = await socialDiscoveryService.getActiveStories();
      setStories(activeStories || []);
    } catch (error) {
      console.error('Failed to load stories:', error);
    }
  };

  const handlePostStory = async () => {
    if (!storyContent.trim()) return;
    try {
      await socialDiscoveryService.postStory(userId, userName, storyContent);
      Alert.alert('Story Posted', 'Your story has been shared!');
      setStoryContent('');
      setShowCreate(false);
      loadStories();
    } catch (error) {
      Alert.alert('Error', 'Failed to post story');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Stories</Text>
        <TouchableOpacity onPress={() => setShowCreate(!showCreate)} style={styles.addButton}>
          <Plus size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {showCreate && (
        <View style={styles.createContainer}>
          <TextInput
            style={styles.createInput}
            placeholder="What's on your mind?"
            placeholderTextColor="#666"
            value={storyContent}
            onChangeText={setStoryContent}
            multiline
            maxLength={280}
          />
          <TouchableOpacity onPress={handlePostStory} style={styles.postButton}>
            <Text style={styles.postButtonText}>Post Story</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content}>
        {stories.length > 0 ? (
          stories.map((story, idx) => (
            <View key={idx} style={styles.storyCard}>
              <View style={styles.storyHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{story.userName?.charAt(0) || 'U'}</Text>
                </View>
                <View style={styles.storyInfo}>
                  <Text style={styles.storyUserName}>{story.userName}</Text>
                  <View style={styles.timeContainer}>
                    <Clock size={12} color="#666" />
                    <Text style={styles.storyTime}>{new Date(story.postedAt).toLocaleTimeString()}</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.storyContent}>{story.content}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No active stories</Text>
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
  addButton: { width: 60, alignItems: 'flex-end' },
  createContainer: { backgroundColor: '#1a1a1a', margin: 16, padding: 16, borderRadius: 12 },
  createInput: { color: '#fff', fontSize: 16, minHeight: 80, textAlignVertical: 'top', marginBottom: 12 },
  postButton: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8, alignItems: 'center' },
  postButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  content: { padding: 16, paddingTop: 0 },
  storyCard: { backgroundColor: '#1a1a1a', padding: 16, borderRadius: 12, marginBottom: 12 },
  storyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  storyInfo: { flex: 1 },
  storyUserName: { fontSize: 16, fontWeight: '600', color: '#fff' },
  timeContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  storyTime: { fontSize: 12, color: '#666' },
  storyContent: { fontSize: 15, color: '#ddd', lineHeight: 20 },
  emptyText: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 40 },
});
