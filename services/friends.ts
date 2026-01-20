import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  id?: string;
  userId?: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  image?: string;
  profileImage?: string;
  status: 'online' | 'busy' | 'away' | 'offline';
  lastSeen?: Date;
  bio?: string;
}

export interface FriendRequest {
  id: string;
  from: UserProfile;
  to: string;
  timestamp: Date;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
}

export interface Friend {
  id?: string;
  userId?: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  image?: string;
  profileImage?: string;
  status: 'online' | 'busy' | 'away' | 'offline';
  lastSeen?: Date;
  addedAt: Date;
  isFavorite?: boolean;
}

export interface BlockedUser {
  name: string;
  username: string;
  blockedAt: Date;
  reason?: string;
}

const FRIENDS_KEY = 'cruzer:friends:v1';
const REQUESTS_KEY = 'cruzer:friend:requests:v1';
const BLOCKED_KEY = 'cruzer:blocked:users:v1';
const PROFILE_KEY = 'cruzer:user:profile:v1';

class FriendsService {
  private friends: Map<string, Friend> = new Map();
  private requests: Map<string, FriendRequest> = new Map();
  private blocked: Map<string, BlockedUser> = new Map();
  private profile: UserProfile | null = null;

  constructor() {
    this.loadData();
  }

  private async loadData() {
    try {
      const [friendsData, requestsData, blockedData, profileData] = await Promise.all([
        AsyncStorage.getItem(FRIENDS_KEY),
        AsyncStorage.getItem(REQUESTS_KEY),
        AsyncStorage.getItem(BLOCKED_KEY),
        AsyncStorage.getItem(PROFILE_KEY),
      ]);

      if (friendsData) this.friends = new Map(JSON.parse(friendsData));
      if (requestsData) this.requests = new Map(JSON.parse(requestsData));
      if (blockedData) this.blocked = new Map(JSON.parse(blockedData));
      if (profileData) this.profile = JSON.parse(profileData);
    } catch (error) {
      console.error('Error loading friends data:', error);
    }
  }

  private async saveData() {
    try {
      await Promise.all([
        AsyncStorage.setItem(FRIENDS_KEY, JSON.stringify(Array.from(this.friends.entries()))),
        AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(Array.from(this.requests.entries()))),
        AsyncStorage.setItem(BLOCKED_KEY, JSON.stringify(Array.from(this.blocked.entries()))),
        this.profile ? AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(this.profile)) : Promise.resolve(),
      ]);
    } catch (error) {
      console.error('Error saving friends data:', error);
    }
  }

  sendFriendRequest(targetUser: UserProfile): FriendRequest {
    if (!this.profile) throw new Error('User profile not set');
    const request: FriendRequest = {
      id: `${Date.now()}-${Math.random()}`,
      from: this.profile,
      to: targetUser.name,
      timestamp: new Date(),
      status: 'pending',
    };
    this.requests.set(request.id, request);
    this.saveData();
    return request;
  }

  getPendingRequests(): FriendRequest[] {
    return Array.from(this.requests.values()).filter(
      req => req.status === 'pending' && req.to === this.profile?.name
    );
  }

  getSentRequests(): FriendRequest[] {
    return Array.from(this.requests.values()).filter(
      req => req.status === 'pending' && req.from.name === this.profile?.name
    );
  }

  acceptFriendRequest(requestId: string): boolean {
    const request = this.requests.get(requestId);
    if (!request) return false;
    const newFriend: Friend = {
      name: request.from.name,
      username: request.from.username,
      email: request.from.email,
      phone: request.from.phone,
      image: request.from.image,
      status: request.from.status,
      lastSeen: request.from.lastSeen,
      addedAt: new Date(),
    };
    this.friends.set(newFriend.name, newFriend);
    request.status = 'accepted';
    this.saveData();
    return true;
  }

  rejectFriendRequest(requestId: string): boolean {
    const request = this.requests.get(requestId);
    if (!request) return false;
    request.status = 'rejected';
    this.saveData();
    return true;
  }

  addFriend(user: UserProfile): Friend {
    const friend: Friend = {
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      image: user.image,
      status: user.status,
      lastSeen: user.lastSeen,
      addedAt: new Date(),
    };
    this.friends.set(friend.name, friend);
    this.saveData();
    return friend;
  }

  removeFriend(userId: string): boolean {
    if (!this.friends.has(userId)) return false;
    this.friends.delete(userId);
    this.saveData();
    return true;
  }

  getFriends(): Friend[] {
    return Array.from(this.friends.values());
  }

  getFriend(userId: string): Friend | undefined {
    return this.friends.get(userId);
  }

  setFavoriteFriend(userId: string, isFavorite: boolean) {
    const friend = this.friends.get(userId);
    if (friend) {
      friend.isFavorite = isFavorite;
      this.friends.set(userId, friend);
      this.saveData();
    }
  }

  getFavoriteFriends(): Friend[] {
    return Array.from(this.friends.values()).filter(f => f.isFavorite);
  }

  blockUser(userId: string, username: string, reason?: string): boolean {
    if (this.friends.has(userId)) {
      this.friends.delete(userId);
    }
    const blockedUser: BlockedUser = {
      name: userId,
      username: username,
      blockedAt: new Date(),
      reason: reason,
    };
    this.blocked.set(userId, blockedUser);
    this.saveData();
    return true;
  }

  unblockUser(userId: string): boolean {
    if (!this.blocked.has(userId)) return false;
    this.blocked.delete(userId);
    this.saveData();
    return true;
  }

  isUserBlocked(userId: string): boolean {
    return this.blocked.has(userId);
  }

  getBlockedUsers(): BlockedUser[] {
    return Array.from(this.blocked.values());
  }

  setStatus(status: 'online' | 'busy' | 'away' | 'offline') {
    if (this.profile) {
      this.profile.status = status;
      this.profile.lastSeen = new Date();
      this.saveData();
    }
  }

  updateFriendStatus(userId: string, status: 'online' | 'busy' | 'away' | 'offline') {
    const friend = this.friends.get(userId);
    if (friend) {
      friend.status = status;
      friend.lastSeen = new Date();
      this.friends.set(userId, friend);
      this.saveData();
    }
  }

  setUserProfile(userProfile: UserProfile) {
    this.profile = userProfile;
    this.saveData();
  }

  getUserProfile(): UserProfile | null {
    return this.profile;
  }

  getSuggestions(query: string, limit: boolean = false): UserProfile[] {
    const friendIds = Array.from(this.friends.keys());
    return limit ? [].filter(u => !friendIds.includes(u.name)) : [];
  }
}

export const friendsService = new FriendsService();
