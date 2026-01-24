import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { Palette, Bell } from 'lucide-react-native';
import { customizationSecurityService } from '../services/customization';
import { useRouter } from 'expo-router';

export default function ThemesScreen() {
  const router = useRouter();
  const [selectedTheme, setSelectedTheme] = useState('dark');
  const [userId] = useState('demo-user-123');

  const themes = [
    { id: 'dark', name: 'Dark', color: '#0a0a0a' },
    { id: 'blue', name: 'Blue', color: '#1a3a4a' },
    { id: 'purple', name: 'Purple', color: '#2a1a4a' },
    { id: 'green', name: 'Green', color: '#1a3a2a' },
  ];

  const handleSetNotificationSound = () => {
    Alert.alert('Notification Sounds', 'Sound customization coming soon!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Themes</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Palette size={24} color="#FF2D55" />
            <Text style={styles.sectionTitle}>Color Themes</Text>
          </View>
          
          <View style={styles.themeGrid}>
            {themes.map((theme) => (
              <TouchableOpacity
                key={theme.id}
                style={[
                  styles.themeCard,
                  selectedTheme === theme.id && styles.themeCardSelected,
                ]}
                onPress={() => setSelectedTheme(theme.id)}
              >
                <View style={[styles.themePreview, { backgroundColor: theme.color }]} />
                <Text style={styles.themeName}>{theme.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={24} color="#FFD700" />
            <Text style={styles.sectionTitle}>Notification Sounds</Text>
          </View>

          <TouchableOpacity style={styles.soundButton} onPress={handleSetNotificationSound}>
            <Text style={styles.soundButtonText}>Customize Sounds</Text>
          </TouchableOpacity>

          <Text style={styles.helpText}>
            Set custom notification sounds for different contacts and message types.
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
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  themeCard: { width: '47%', backgroundColor: '#1a1a1a', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  themeCardSelected: { borderColor: '#007AFF' },
  themePreview: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  themeName: { fontSize: 16, fontWeight: '600', color: '#fff' },
  soundButton: { backgroundColor: '#007AFF', padding: 16, borderRadius: 12, alignItems: 'center' },
  soundButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  helpText: { fontSize: 13, color: '#666', marginTop: 12, lineHeight: 18 },
});
