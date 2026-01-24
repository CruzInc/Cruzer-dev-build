import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, StyleSheet, View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Search, MessageSquare, User, Phone } from 'lucide-react-native';
import { searchPerformanceService } from '../services/searchPerformance';
import { useRouter } from 'expo-router';

export default function SearchAdvancedScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any>({ messages: [], contacts: [], calls: [] });
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const searchResults = await searchPerformanceService.globalSearch(searchQuery);
      setResults(searchResults || { messages: [], contacts: [], calls: [] });
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalResults = (results.messages?.length || 0) + (results.contacts?.length || 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Search</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages, contacts..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => { setSearchQuery(''); setResults({ messages: [], contacts: [], calls: [] }); }}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
        ) : totalResults > 0 ? (
          <>
            {results.messages && results.messages.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <MessageSquare size={18} color="#007AFF" />
                  <Text style={styles.sectionTitle}>Messages ({results.messages.length})</Text>
                </View>
                {results.messages.slice(0, 5).map((msg: any, idx: number) => (
                  <View key={idx} style={styles.resultCard}>
                    <Text style={styles.resultText} numberOfLines={2}>{msg.content || msg.text}</Text>
                    <Text style={styles.resultMeta}>{new Date(msg.timestamp).toLocaleDateString()}</Text>
                  </View>
                ))}
              </View>
            )}

            {results.contacts && results.contacts.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <User size={18} color="#34C759" />
                  <Text style={styles.sectionTitle}>Contacts ({results.contacts.length})</Text>
                </View>
                {results.contacts.slice(0, 5).map((contact: any, idx: number) => (
                  <View key={idx} style={styles.resultCard}>
                    <Text style={styles.resultText}>{contact.name}</Text>
                    <Text style={styles.resultMeta}>{contact.phone || contact.phoneNumber}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : searchQuery ? (
          <Text style={styles.emptyText}>No results found</Text>
        ) : (
          <View style={styles.hintContainer}>
            <Search size={48} color="#333" />
            <Text style={styles.hintText}>Search across all messages and contacts</Text>
          </View>
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
  clearText: { fontSize: 20, color: '#666', paddingHorizontal: 8 },
  content: { padding: 16, paddingTop: 0 },
  loader: { marginTop: 40 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  resultCard: { backgroundColor: '#1a1a1a', padding: 12, borderRadius: 8, marginBottom: 8 },
  resultText: { fontSize: 15, color: '#fff', marginBottom: 4 },
  resultMeta: { fontSize: 13, color: '#666' },
  emptyText: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 40 },
  hintContainer: { alignItems: 'center', marginTop: 80 },
  hintText: { fontSize: 16, color: '#666', marginTop: 16 },
});
