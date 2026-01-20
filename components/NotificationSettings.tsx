// Notification Settings Component - DND, batching, and per-contact preferences
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  StatusBar,
  Alert,
} from 'react-native';
import { Bell, Clock, Zap, Users, Sliders, ChevronRight } from 'lucide-react-native';
import {
  notificationServiceV2,
  NotificationPreferences,
  ContactNotificationPrefs,
} from '../services/notificationsV2';

interface NotificationSettingsProps {
  onClose?: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onClose }) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    notificationServiceV2.getGlobalPreferences()
  );
  const [contactPrefs, setContactPrefs] = useState<ContactNotificationPrefs[]>(
    notificationServiceV2.getContactPreferences()
  );
  const [expandedContactId, setExpandedContactId] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = () => {
    setPreferences(notificationServiceV2.getGlobalPreferences());
    setContactPrefs(notificationServiceV2.getContactPreferences());
  };

  const handleGlobalPreferenceChange = async (
    key: keyof NotificationPreferences,
    value: any
  ) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    await notificationServiceV2.setGlobalPreferences(updated);
  };

  const handleDndTimeChange = async (startTime: string, endTime: string) => {
    setPreferences(prev => ({ ...prev, dndStartTime: startTime, dndEndTime: endTime }));
    await notificationServiceV2.setDndSchedule(startTime, endTime, preferences.globalDndEnabled);
  };

  const handleContactMuteToggle = async (contactId: string, contactName: string, muted: boolean) => {
    await notificationServiceV2.setContactMuted(contactId, contactName, muted);
    loadPreferences();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Bell color="#007AFF" size={24} />
        <Text style={styles.headerTitle}>Notification Settings</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Done</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Global Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Zap color="#FF9500" size={20} />
            <Text style={styles.sectionTitle}>General</Text>
          </View>

          {/* Sound */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingName}>Sound</Text>
              <Text style={styles.settingDescription}>Play notification sounds</Text>
            </View>
            <Switch
              value={preferences.soundEnabled}
              onValueChange={value => handleGlobalPreferenceChange('soundEnabled', value)}
              trackColor={{ false: '#E0E0E0', true: '#B3E5FC' }}
              thumbColor={preferences.soundEnabled ? '#2196F3' : '#F5F5F5'}
            />
          </View>

          {/* Vibration */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingName}>Vibration</Text>
              <Text style={styles.settingDescription}>Vibrate on notifications</Text>
            </View>
            <Switch
              value={preferences.vibrateEnabled}
              onValueChange={value => handleGlobalPreferenceChange('vibrateEnabled', value)}
              trackColor={{ false: '#E0E0E0', true: '#B3E5FC' }}
              thumbColor={preferences.vibrateEnabled ? '#2196F3' : '#F5F5F5'}
            />
          </View>

          {/* Batching */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingName}>Smart Batching</Text>
              <Text style={styles.settingDescription}>Group notifications together</Text>
            </View>
            <Switch
              value={preferences.batchingEnabled}
              onValueChange={value => handleGlobalPreferenceChange('batchingEnabled', value)}
              trackColor={{ false: '#E0E0E0', true: '#B3E5FC' }}
              thumbColor={preferences.batchingEnabled ? '#2196F3' : '#F5F5F5'}
            />
          </View>

          {preferences.batchingEnabled && (
            <View style={styles.nestledSetting}>
              <Text style={styles.nestledLabel}>Batch Delay (ms)</Text>
              <TextInput
                style={styles.nestledInput}
                keyboardType="number-pad"
                value={preferences.batchingDelayMs.toString()}
                onChangeText={value =>
                  handleGlobalPreferenceChange('batchingDelayMs', parseInt(value) || 5000)
                }
              />
              <Text style={styles.nestledHint}>Default: 5000ms (5 seconds)</Text>
            </View>
          )}
        </View>

        {/* Do Not Disturb */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock color="#8E44AD" size={20} />
            <Text style={styles.sectionTitle}>Do Not Disturb</Text>
          </View>

          {/* DND Toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingName}>Enable DND Schedule</Text>
              <Text style={styles.settingDescription}>Quiet hours</Text>
            </View>
            <Switch
              value={preferences.globalDndEnabled}
              onValueChange={value =>
                handleGlobalPreferenceChange('globalDndEnabled', value)
              }
              trackColor={{ false: '#E0E0E0', true: '#B3E5FC' }}
              thumbColor={preferences.globalDndEnabled ? '#2196F3' : '#F5F5F5'}
            />
          </View>

          {preferences.globalDndEnabled && (
            <>
              {/* Start Time */}
              <View style={styles.timeRow}>
                <View style={styles.timeSection}>
                  <Text style={styles.timeLabel}>Start Time</Text>
                  <View style={styles.timeDisplay}>
                    <Text style={styles.timeText}>{preferences.dndStartTime}</Text>
                  </View>
                </View>

                {/* End Time */}
                <View style={styles.timeSection}>
                  <Text style={styles.timeLabel}>End Time</Text>
                  <View style={styles.timeDisplay}>
                    <Text style={styles.timeText}>{preferences.dndEndTime}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.dndHint}>
                Example: 22:00 to 08:00 = Quiet from 10 PM to 8 AM
              </Text>
            </>
          )}
        </View>

        {/* Per-Contact Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users color="#E74C3C" size={20} />
            <Text style={styles.sectionTitle}>Contact Preferences</Text>
          </View>

          {contactPrefs.length > 0 ? (
            contactPrefs.map(contact => (
              <View key={contact.contactId} style={styles.contactSettingCard}>
                <TouchableOpacity
                  style={styles.contactSettingHeader}
                  onPress={() =>
                    setExpandedContactId(
                      expandedContactId === contact.contactId ? null : contact.contactId
                    )
                  }
                >
                  <View style={styles.contactSettingInfo}>
                    <Text style={styles.contactSettingName}>{contact.contactName}</Text>
                    <Text style={styles.contactSettingStatus}>
                      {contact.muted ? 'Muted' : 'Notifications on'}
                    </Text>
                  </View>
                  <ChevronRight
                    color="#999"
                    size={20}
                    style={{
                      transform: [
                        { rotate: expandedContactId === contact.contactId ? '90deg' : '0deg' },
                      ],
                    }}
                  />
                </TouchableOpacity>

                {expandedContactId === contact.contactId && (
                  <View style={styles.contactSettingOptions}>
                    <View style={styles.settingRow}>
                      <View style={styles.settingInfo}>
                        <Text style={styles.settingName}>Mute Notifications</Text>
                        <Text style={styles.settingDescription}>
                          Don't show notifications from this contact
                        </Text>
                      </View>
                      <Switch
                        value={contact.muted}
                        onValueChange={value =>
                          handleContactMuteToggle(
                            contact.contactId,
                            contact.contactName,
                            value
                          )
                        }
                        trackColor={{ false: '#E0E0E0', true: '#B3E5FC' }}
                        thumbColor={contact.muted ? '#2196F3' : '#F5F5F5'}
                      />
                    </View>
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No contacts with custom settings yet</Text>
              <Text style={styles.emptySubtext}>
                Custom preferences will appear here as you add them
              </Text>
            </View>
          )}
        </View>

        {/* Advanced Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sliders color="#3498DB" size={20} />
            <Text style={styles.sectionTitle}>Advanced</Text>
          </View>

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingName}>Notification Priority</Text>
              <Text style={styles.settingDescription}>High, Normal, or Low</Text>
            </View>
            <Text style={styles.settingValue}>Normal</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingName}>Badge Count</Text>
              <Text style={styles.settingDescription}>Show unread count</Text>
            </View>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: '#E0E0E0', true: '#B3E5FC' }}
              thumbColor={'#2196F3'}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    flex: 1,
    marginLeft: 12,
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  closeButton: {
    paddingHorizontal: 12,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionTitle: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  settingDescription: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  nestledSetting: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  nestledLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  nestledInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000',
    marginBottom: 8,
  },
  nestledHint: {
    fontSize: 12,
    color: '#999',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 12,
  },
  timeSection: {
    flex: 1,
    marginHorizontal: 6,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  timeDisplay: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  dndHint: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  contactSettingCard: {
    marginBottom: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  contactSettingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  contactSettingInfo: {
    flex: 1,
  },
  contactSettingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  contactSettingStatus: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  contactSettingOptions: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#CCC',
    marginTop: 6,
    textAlign: 'center',
  },
});
