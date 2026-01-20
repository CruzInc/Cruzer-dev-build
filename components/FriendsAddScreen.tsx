// Friends & Add UI Component - Friend requests, friend management, and user search
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  FlatList,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import {
  UserPlus,
  Users,
  X,
  Check,
  Mail,
  Phone,
  MessageSquare,
  PhoneCall,
  Heart,
  Trash2,
  Search as SearchIcon,
} from 'lucide-react-native';
import { friendsService, Friend, FriendRequest, UserProfile } from '../services/friends';

const { width } = Dimensions.get('window');

interface FriendsAddScreenProps {
  onClose?: () => void;
  currentUserId?: string;
}

export const FriendsAddScreen: React.FC<FriendsAddScreenProps> = ({
  onClose,
  currentUserId = 'user-1',
}) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search' | 'blocked'>(
    'friends'
  );
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  useEffect(() => {
    loadFriendsData();
  }, []);

  const loadFriendsData = () => {
    setFriends(friendsService.getFriends());
    setPendingRequests(friendsService.getPendingRequests());
    setBlockedUsers(friendsService.getBlockedUsers());
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      // Search for users (would call backend API in production)
      // For now, returning empty results
      setSearchResults([]);
    }
  };

  const handleSendFriendRequest = (userProfile: UserProfile) => {
    friendsService.sendFriendRequest(userProfile);
    Alert.alert('Friend Request Sent', `You sent a friend request to ${userProfile.username}`);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleAcceptRequest = (requestId: string) => {
    const success = friendsService.acceptFriendRequest(requestId);
    if (success) {
      Alert.alert('Friend Request Accepted', 'You are now friends!');
      loadFriendsData();
    }
  };

  const handleRejectRequest = (requestId: string) => {
    const success = friendsService.rejectFriendRequest(requestId);
    if (success) {
      Alert.alert('Friend Request Rejected');
      loadFriendsData();
    }
  };

  const handleRemoveFriend = (userId: string, username: string) => {
    Alert.alert('Remove Friend', `Remove ${username} from your friends?`, [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Remove',
        onPress: () => {
          friendsService.removeFriend(userId);
          loadFriendsData();
        },
        style: 'destructive',
      },
    ]);
  };

  const handleBlockUser = (userId: string, username: string) => {
    friendsService.blockUser(userId, username, 'User blocked');
    loadFriendsData();
    Alert.alert('User Blocked', `${username} has been blocked.`);
  };

  const handleUnblockUser = (userId: string) => {
    friendsService.unblockUser(userId);
    loadFriendsData();
    Alert.alert('User Unblocked');
  };

  const handleToggleFavorite = (userId: string) => {
    const friend = friends.find(f => f.id || f.userId === userId);
    if (friend) {
      friendsService.setFavoriteFriend(userId, !friend.isFavorite);
      loadFriendsData();
    }
  };

  const displayedFriends = favoritesOnly ? friends.filter(f => f.isFavorite) : friends;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Friends & Contacts</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X color="#666" size={24} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(['friends', 'requests', 'search', 'blocked'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[styles.tabText, activeTab === tab && styles.activeTabText]}
            >
              {tab === 'friends' && `Friends (${displayedFriends.length})`}
              {tab === 'requests' && `Requests (${pendingRequests.length})`}
              {tab === 'search' && 'Add'}
              {tab === 'blocked' && `Blocked (${blockedUsers.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <View>
            {displayedFriends.length > 0 ? (
              <>
                {/* Favorites Filter */}
                {friends.some(f => f.isFavorite) && (
                  <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setFavoritesOnly(!favoritesOnly)}
                  >
                    <Heart
                      color={favoritesOnly ? '#FF6B6B' : '#999'}
                      size={16}
                      fill={favoritesOnly ? '#FF6B6B' : 'transparent'}
                    />
                    <Text style={styles.filterText}>
                      {favoritesOnly ? 'Favorites Only' : 'Show All Friends'}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Friends List */}
                {displayedFriends.map(friend => (
                  <View key={friend.id || friend.userId} style={styles.friendCard}>
                    {/* Profile Image */}
                    {friend.image || friend.profileImage ? (
                      <Image
                        source={{ uri: friend.image || friend.profileImage }}
                        style={styles.friendImage}
                      />
                    ) : (
                      <View style={[styles.friendImage, styles.placeholderImage]}>
                        <Text style={styles.placeholder}>
                          {friend.username.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}

                    {/* Friend Info */}
                    <View style={styles.friendInfo}>
                      <View style={styles.friendNameContainer}>
                        <Text style={styles.friendName}>{friend.username}</Text>
                        {friend.isFavorite && <Heart color="#FF6B6B" size={14} fill="#FF6B6B" />}
                      </View>

                      {/* Status Badge */}
                      <View style={styles.statusContainer}>
                        <View
                          style={[
                            styles.statusDot,
                            friend.status === 'online' && styles.statusOnline,
                            friend.status === 'busy' && styles.statusBusy,
                            friend.status === 'away' && styles.statusAway,
                          ]}
                        />
                        <Text style={styles.statusText}>{friend.status}</Text>
                      </View>

                      {friend.email && (
                        <View style={styles.contactInfo}>
                          <Mail color="#999" size={12} />
                          <Text style={styles.contactText} numberOfLines={1}>
                            {friend.email}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Actions */}
                    <View style={styles.friendActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleToggleFavorite(friend.id || friend.userId)}
                      >
                        <Heart
                          color={friend.isFavorite ? '#FF6B6B' : '#999'}
                          size={18}
                          fill={friend.isFavorite ? '#FF6B6B' : 'transparent'}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.actionButton}>
                        <MessageSquare color="#007AFF" size={18} />
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.actionButton}>
                        <PhoneCall color="#34C759" size={18} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleRemoveFriend(friend.id || friend.userId, friend.username)}
                      >
                        <Trash2 color="#FF3B30" size={18} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            ) : (
              <View style={styles.emptyState}>
                <Users color="#CCC" size={48} />
                <Text style={styles.emptyText}>No friends yet</Text>
                <Text style={styles.emptySubtext}>Add friends to get started</Text>
              </View>
            )}
          </View>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <View>
            {pendingRequests.length > 0 ? (
              pendingRequests.map(request => (
                <View key={request.id} style={styles.requestCard}>
                  {request.from.image || request.from.profileImage ? (
                    <Image
                      source={{ uri: request.from.image || request.from.profileImage }}
                      style={styles.requestImage}
                    />
                  ) : (
                    <View style={[styles.requestImage, styles.placeholderImage]}>
                      <Text style={styles.placeholder}>
                        {request.from.username.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}

                  <View style={styles.requestInfo}>
                    <Text style={styles.requestName}>{request.from.username}</Text>
                    <Text style={styles.requestEmail}>{request.from.email}</Text>
                    <Text style={styles.requestTime}>
                      Sent {new Date(request.timestamp).toLocaleDateString()}
                    </Text>
                  </View>

                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={[styles.requestActionBtn, styles.acceptBtn]}
                      onPress={() => handleAcceptRequest(request.id)}
                    >
                      <Check color="#FFF" size={20} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.requestActionBtn, styles.rejectBtn]}
                      onPress={() => handleRejectRequest(request.id)}
                    >
                      <X color="#FFF" size={20} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Mail color="#CCC" size={48} />
                <Text style={styles.emptyText}>No pending requests</Text>
              </View>
            )}
          </View>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <View>
            {/* Search Input */}
            <View style={styles.searchContainer}>
              <SearchIcon color="#999" size={20} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by username or email..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={handleSearch}
              />
            </View>

            {searchResults.length > 0 ? (
              searchResults.map(user => (
                <View key={user.id || user.userId} style={styles.searchResultCard}>
                  {user.image || user.profileImage ? (
                    <Image source={{ uri: user.image || user.profileImage }} style={styles.searchResultImage} />
                  ) : (
                    <View style={[styles.searchResultImage, styles.placeholderImage]}>
                      <Text style={styles.placeholder}>
                        {user.username.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}

                  <View style={styles.searchResultInfo}>
                    <Text style={styles.searchResultName}>{user.username}</Text>
                    <View style={styles.statusContainer}>
                      <View
                        style={[
                          styles.statusDot,
                          user.status === 'online' && styles.statusOnline,
                        ]}
                      />
                      <Text style={styles.statusText}>{user.status}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handleSendFriendRequest(user)}
                  >
                    <UserPlus color="#FFF" size={20} />
                  </TouchableOpacity>
                </View>
              ))
            ) : searchQuery.length > 2 ? (
              <View style={styles.emptyState}>
                <SearchIcon color="#CCC" size={48} />
                <Text style={styles.emptyText}>No users found</Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <SearchIcon color="#CCC" size={48} />
                <Text style={styles.emptyText}>Search for users</Text>
                <Text style={styles.emptySubtext}>Type username or email to add friends</Text>
              </View>
            )}
          </View>
        )}

        {/* Blocked Tab */}
        {activeTab === 'blocked' && (
          <View>
            {blockedUsers.length > 0 ? (
              blockedUsers.map((blocked: any) => (
                <View key={blocked.userId} style={styles.blockedCard}>
                  <View style={styles.blockedInfo}>
                    <Text style={styles.blockedName}>{blocked.username}</Text>
                    {blocked.reason && (
                      <Text style={styles.blockedReason}>Reason: {blocked.reason}</Text>
                    )}
                    <Text style={styles.blockedDate}>
                      Blocked {new Date(blocked.blockedAt).toLocaleDateString()}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.unblockButton}
                    onPress={() => handleUnblockUser(blocked.userId)}
                  >
                    <Text style={styles.unblockText}>Unblock</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Users color="#CCC" size={48} />
                <Text style={styles.emptyText}>No blocked users</Text>
              </View>
            )}
          </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  closeButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#007AFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  friendImage: {
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
    fontSize: 20,
    fontWeight: '700',
    color: '#999',
  },
  friendInfo: {
    flex: 1,
  },
  friendNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginRight: 6,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
    backgroundColor: '#999',
  },
  statusOnline: {
    backgroundColor: '#34C759',
  },
  statusBusy: {
    backgroundColor: '#FF9500',
  },
  statusAway: {
    backgroundColor: '#999',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  contactText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#999',
  },
  friendActions: {
    flexDirection: 'row',
    marginLeft: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  requestImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#E0E0E0',
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  requestEmail: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  requestTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
    marginLeft: 12,
  },
  requestActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  acceptBtn: {
    backgroundColor: '#34C759',
  },
  rejectBtn: {
    backgroundColor: '#FF3B30',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#000',
  },
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  searchResultImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#E0E0E0',
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  blockedInfo: {
    flex: 1,
  },
  blockedName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  blockedReason: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  blockedDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  unblockButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
  },
  unblockText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
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
