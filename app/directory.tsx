import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, StyleSheet, View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Search, User } from 'lucide-react-native';
import { socialDiscoveryService } from '../services/socialDiscovery';
import { useRouter } from 'expo-router';

export default function DirectoryScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const users = await socialDiscoveryService.searchDirectory(searchQuery);
      setResults(users || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Directory</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
        ) : results.length > 0 ? (
          results.map((user, idx) => (
            <View key={idx} style={styles.userCard}>
              <View style={styles.avatar}>
                <User size={24} color="#fff" />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name || 'Unknown User'}</Text>
                <Text style={styles.userStatus}>{user.status || 'Available'}</Text>
              </View>
              <TouchableOpacity style={styles.connectButton}>
                <Text style={styles.connectButtonText}>Connect</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : searchQuery ? (
          <Text style={styles.emptyText}>No users found</Text>
        ) : (
          <Text style={styles.emptyText}>Search for users to connect</Text>
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
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 16, backgroundColor: '#1a1a1a', borderRadius: 10, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: '#fff', fontSize: 16, paddingVertical: 12 },
  searchButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#007AFF', borderRadius: 6 },
  searchButtonText: { color: '#fff', fontWeight: '600' },
  content: { padding: 16, paddingTop: 0 },
  loader: { marginTop: 40 },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', padding: 16, borderRadius: 12, marginBottom: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  userInfo: { flex: 1 },
  userName: { fontSize: 17, fontWeight: '600', color: '#fff' },
  userStatus: { fontSize: 14, color: '#999', marginTop: 2 },
  connectButton: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#34C759', borderRadius: 8 },
  connectButtonText: { color: '#fff', fontWeight: '600' },
  emptyText: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 40 },
});
