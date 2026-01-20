// Search Screen Component - Quick search across messages, contacts, and conversations
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Search as SearchIcon, Clock, MessageSquare, Users, X } from 'lucide-react-native';
import { searchService, SearchableContact, SearchableMessage } from '../services/search';

const { width } = Dimensions.get('window');

interface SearchScreenProps {
  onClose?: () => void;
  onSelectContact?: (contact: SearchableContact) => void;
  onSelectMessage?: (message: SearchableMessage) => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({
  onClose,
  onSelectContact,
  onSelectMessage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({
    messages: [] as SearchableMessage[],
    contacts: [] as SearchableContact[],
  });
  const [recentContacts, setRecentContacts] = useState<SearchableContact[]>([]);
  const [suggestedContacts, setSuggestedContacts] = useState<SearchableContact[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = () => {
    setRecentContacts(searchService.getRecentContacts(5));
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (query.length === 0) {
      setSearchResults({ messages: [], contacts: [] });
      setSuggestedContacts([]);
      return;
    }

    if (query.length < 2) {
      setSuggestedContacts(searchService.suggestContacts(query, 5));
      return;
    }

    const results = searchService.globalSearch(query);
    setSearchResults(results);
  };

  const handleSelectContact = (contact: SearchableContact) => {
    if (onSelectContact) {
      onSelectContact(contact);
    }
    setSearchQuery('');
    setSearchResults({ messages: [], contacts: [] });
  };

  const handleSelectMessage = (message: SearchableMessage) => {
    if (onSelectMessage) {
      onSelectMessage(message);
    }
    setSearchQuery('');
    setSearchResults({ messages: [], contacts: [] });
  };

  const displayContacts =
    searchQuery.length === 0 ? recentContacts : searchResults.contacts;
  const displayMessages =
    searchQuery.length === 0 ? [] : searchResults.messages;
  const displaySuggestions =
    searchQuery.length > 0 && searchQuery.length < 2 ? suggestedContacts : [];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <SearchIcon color="#007AFF" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search messages, contacts..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <X color="#999" size={20} />
            </TouchableOpacity>
          )}
        </View>

        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X color="#666" size={24} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {searchQuery.length === 0 ? (
          <>
            {/* Recent Contacts */}
            {recentContacts.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Clock color="#999" size={16} />
                  <Text style={styles.sectionTitle}>Recent Contacts</Text>
                </View>

                {recentContacts.map(contact => (
                  <TouchableOpacity
                    key={contact.id}
                    style={styles.contactItem}
                    onPress={() => handleSelectContact(contact)}
                  >
                    {contact.profileImage ? (
                      <Image
                        source={{ uri: contact.profileImage }}
                        style={styles.contactImage}
                      />
                    ) : (
                      <View style={[styles.contactImage, styles.placeholderImage]}>
                        <Text style={styles.placeholder}>
                          {contact.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}

                    <View style={styles.contactInfo}>
                      <Text style={styles.contactName}>{contact.name}</Text>
                      {contact.phoneNumber || contact.phone && (
                        <Text style={styles.contactPhone}>{contact.phoneNumber || contact.phone}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <TouchableOpacity style={styles.actionItem}>
                <View style={styles.actionIcon}>
                  <MessageSquare color="#007AFF" size={20} />
                </View>
                <Text style={styles.actionText}>New Message</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionItem}>
                <View style={styles.actionIcon}>
                  <Users color="#34C759" size={20} />
                </View>
                <Text style={styles.actionText}>New Group</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {/* Contact Suggestions */}
            {displaySuggestions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Suggested Contacts</Text>
                {displaySuggestions.map(contact => (
                  <TouchableOpacity
                    key={contact.id}
                    style={styles.contactItem}
                    onPress={() => handleSelectContact(contact)}
                  >
                    {contact.profileImage ? (
                      <Image
                        source={{ uri: contact.profileImage }}
                        style={styles.contactImage}
                      />
                    ) : (
                      <View style={[styles.contactImage, styles.placeholderImage]}>
                        <Text style={styles.placeholder}>
                          {contact.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}

                    <View style={styles.contactInfo}>
                      <Text style={styles.contactName}>{contact.name}</Text>
                      <Text style={styles.contactPhone}>{contact.phoneNumber || contact.phone}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Search Results - Contacts */}
            {displayContacts.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Contacts ({displayContacts.length})
                </Text>
                {displayContacts.map(contact => (
                  <TouchableOpacity
                    key={contact.id}
                    style={styles.contactItem}
                    onPress={() => handleSelectContact(contact)}
                  >
                    {contact.profileImage ? (
                      <Image
                        source={{ uri: contact.profileImage }}
                        style={styles.contactImage}
                      />
                    ) : (
                      <View style={[styles.contactImage, styles.placeholderImage]}>
                        <Text style={styles.placeholder}>
                          {contact.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}

                    <View style={styles.contactInfo}>
                      <Text style={styles.contactName}>{contact.name}</Text>
                      <Text style={styles.contactPhone}>{contact.phoneNumber || contact.phone}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Search Results - Messages */}
            {displayMessages.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Messages ({displayMessages.length})
                </Text>
                {displayMessages.map(message => (
                  <TouchableOpacity
                    key={message.id}
                    style={styles.messageItem}
                    onPress={() => handleSelectMessage(message)}
                  >
                    <View style={styles.messageContent}>
                      <Text style={styles.messageSender}>{message.senderId}</Text>
                      <Text style={styles.messageText} numberOfLines={2}>
                        {message.content}
                      </Text>
                      <Text style={styles.messageTime}>
                        {new Date(message.timestamp).toLocaleDateString()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* No Results */}
            {displayContacts.length === 0 && displayMessages.length === 0 && searchQuery.length > 2 && (
              <View style={styles.emptyState}>
                <SearchIcon color="#CCC" size={48} />
                <Text style={styles.emptyText}>No results found</Text>
                <Text style={styles.emptySubtext}>Try a different search term</Text>
              </View>
            )}
          </>
        )}
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 14,
    color: '#000',
  },
  closeButton: {
    marginLeft: 12,
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
    textTransform: 'uppercase',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  contactImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#E0E0E0',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    fontSize: 18,
    fontWeight: '700',
    color: '#999',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  contactPhone: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  messageItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  messageContent: {
    flex: 1,
  },
  messageSender: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  messageText: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
  },
  emptySubtext: {
    marginTop: 6,
    fontSize: 14,
    color: '#CCC',
  },
});
