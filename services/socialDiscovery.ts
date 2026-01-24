// Social & Discovery Service - User Directory, Activity Feed, Stories, etc.
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DirectoryUser {
  userId: string;
  displayName: string;
  bio?: string;
  profilePicture?: string;
  status: 'online' | 'away' | 'offline';
  joinDate: Date;
  badgeCount: number;
  isVerified?: boolean;
}

export interface ActivityFeedEntry {
  id: string;
  userId: string;
  type: 'badge-earned' | 'level-up' | 'challenge-completed' | 'joined' | 'milestone';
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
}

export interface Story {
  id: string;
  userId: string;
  userDisplayName: string;
  userAvatar?: string;
  content: string;
  attachments?: string[];
  createdAt: Date;
  expiresAt: Date;
  views: string[]; // User IDs who viewed
}

export interface UserDirectory {
  userId: string;
  displayName: string;
  bio: string;
  profilePicture?: string;
  badges: number;
  joinDate: Date;
  isVisible: boolean;
  searchableBy: 'everyone' | 'friends' | 'nobody';
}

export interface GroupChat {
  id: string;
  name: string;
  description?: string;
  members: string[];
  admins: string[];
  createdAt: Date;
  createdBy: string;
  icon?: string;
  rules?: string;
}

export class SocialDiscoveryService {
  private directoryUsers: Map<string, DirectoryUser> = new Map();
  private activityFeed: ActivityFeedEntry[] = [];
  private stories: Map<string, Story[]> = new Map();
  private userDirectories: Map<string, UserDirectory> = new Map();
  private groupChats: Map<string, GroupChat> = new Map();

  async initializeSocialFeatures() {
    await this.loadDirectoryUsers();
    await this.loadActivityFeed();
    await this.loadStories();
    await this.loadUserDirectories();
    await this.loadGroupChats();
    await this.cleanupExpiredStories();
  }

  // ==================== USER DIRECTORY ====================

  async registerInDirectory(user: DirectoryUser): Promise<void> {
    this.directoryUsers.set(user.userId, user);
    await this.saveDirectoryUsers();
  }

  async searchDirectory(query: string): Promise<DirectoryUser[]> {
    const results = Array.from(this.directoryUsers.values()).filter((user) => {
      const matchesName = user.displayName
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesBio = user.bio
        ?.toLowerCase()
        .includes(query.toLowerCase());

      return matchesName || matchesBio;
    });

    return results.sort((a, b) => {
      const aMatch = a.displayName.toLowerCase().startsWith(query.toLowerCase());
      const bMatch = b.displayName.toLowerCase().startsWith(query.toLowerCase());
      return aMatch ? -1 : bMatch ? 1 : 0;
    });
  }

  async getTrendingUsers(limit: number = 10): Promise<DirectoryUser[]> {
    return Array.from(this.directoryUsers.values())
      .sort((a, b) => b.badgeCount - a.badgeCount)
      .slice(0, limit);
  }

  async getNewUsers(limit: number = 10): Promise<DirectoryUser[]> {
    return Array.from(this.directoryUsers.values())
      .sort((a, b) => b.joinDate.getTime() - a.joinDate.getTime())
      .slice(0, limit);
  }

  // ==================== ACTIVITY FEED ====================

  async addActivityFeedEntry(entry: Omit<ActivityFeedEntry, 'id'>): Promise<void> {
    const newEntry: ActivityFeedEntry = {
      id: `activity-${Date.now()}`,
      ...entry,
    };

    this.activityFeed.unshift(newEntry); // Add to front

    // Keep only last 500 entries
    if (this.activityFeed.length > 500) {
      this.activityFeed = this.activityFeed.slice(0, 500);
    }

    await this.saveActivityFeed();
  }

  async getActivityFeedForUser(userId: string): Promise<ActivityFeedEntry[]> {
    // In real app, this would get friends' activities
    // For now, return all recent activities
    return this.activityFeed.slice(0, 20);
  }

  async getFeedByType(type: string, limit: number = 50): Promise<ActivityFeedEntry[]> {
    return this.activityFeed
      .filter((entry) => entry.type === type)
      .slice(0, limit);
  }

  // ==================== STORIES ====================

  async postStory(
    userId: string,
    userDisplayName: string,
    content: string,
    attachments?: string[]
  ): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    const story: Story = {
      id: `story-${Date.now()}`,
      userId,
      userDisplayName,
      content,
      attachments,
      createdAt: now,
      expiresAt,
      views: [],
    };

    const userStories = this.stories.get(userId) || [];
    userStories.push(story);
    this.stories.set(userId, userStories);

    await this.saveStories();
  }

  async getActiveStories(): Promise<Story[]> {
    const now = new Date();
    const activeStories: Story[] = [];

    this.stories.forEach((stories) => {
      stories.forEach((story) => {
        if (story.expiresAt > now) {
          activeStories.push(story);
        }
      });
    });

    return activeStories.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async viewStory(storyId: string, viewerId: string): Promise<void> {
    this.stories.forEach((stories) => {
      const story = stories.find((s) => s.id === storyId);
      if (story && !story.views.includes(viewerId)) {
        story.views.push(viewerId);
      }
    });

    await this.saveStories();
  }

  async getUserStories(userId: string): Promise<Story[]> {
    const now = new Date();
    const userStories = this.stories.get(userId) || [];
    return userStories.filter((s) => s.expiresAt > now);
  }

  // ==================== USER DIRECTORY PRIVACY ====================

  async updateDirectoryVisibility(
    userId: string,
    isVisible: boolean,
    searchableBy: 'everyone' | 'friends' | 'nobody'
  ): Promise<void> {
    const directory = this.userDirectories.get(userId);
    if (directory) {
      directory.isVisible = isVisible;
      directory.searchableBy = searchableBy;
      await this.saveUserDirectories();
    }
  }

  // ==================== GROUP CHAT ====================

  async createGroupChat(
    name: string,
    createdBy: string,
    members: string[],
    description?: string
  ): Promise<string> {
    const groupId = `group-${Date.now()}`;

    const group: GroupChat = {
      id: groupId,
      name,
      description,
      members,
      admins: [createdBy],
      createdAt: new Date(),
      createdBy,
    };

    this.groupChats.set(groupId, group);
    await this.saveGroupChats();

    return groupId;
  }

  async addMemberToGroup(groupId: string, userId: string): Promise<void> {
    const group = this.groupChats.get(groupId);
    if (group && !group.members.includes(userId)) {
      group.members.push(userId);
      await this.saveGroupChats();
    }
  }

  async removeMemberFromGroup(groupId: string, userId: string): Promise<void> {
    const group = this.groupChats.get(groupId);
    if (group) {
      group.members = group.members.filter((id) => id !== userId);
      group.admins = group.admins.filter((id) => id !== userId);
      await this.saveGroupChats();
    }
  }

  async getGroupChat(groupId: string): Promise<GroupChat | null> {
    return this.groupChats.get(groupId) || null;
  }

  async getUserGroups(userId: string): Promise<GroupChat[]> {
    return Array.from(this.groupChats.values()).filter((group) =>
      group.members.includes(userId)
    );
  }

  // ==================== PRIVATE HELPERS ====================

  private async saveDirectoryUsers(): Promise<void> {
    const data = Array.from(this.directoryUsers.values());
    await AsyncStorage.setItem('social:directory', JSON.stringify(data));
  }

  private async loadDirectoryUsers(): Promise<void> {
    const data = await AsyncStorage.getItem('social:directory');
    if (data) {
      const users = JSON.parse(data) as DirectoryUser[];
      users.forEach((user) => {
        user.joinDate = new Date(user.joinDate);
        this.directoryUsers.set(user.userId, user);
      });
    }
  }

  private async saveActivityFeed(): Promise<void> {
    await AsyncStorage.setItem('social:feed', JSON.stringify(this.activityFeed));
  }

  private async loadActivityFeed(): Promise<void> {
    const data = await AsyncStorage.getItem('social:feed');
    if (data) {
      this.activityFeed = JSON.parse(data) as ActivityFeedEntry[];
      this.activityFeed.forEach((entry) => {
        entry.timestamp = new Date(entry.timestamp);
      });
    }
  }

  private async saveStories(): Promise<void> {
    const data: { [key: string]: Story[] } = {};
    this.stories.forEach((stories, userId) => {
      data[userId] = stories;
    });
    await AsyncStorage.setItem('social:stories', JSON.stringify(data));
  }

  private async loadStories(): Promise<void> {
    const data = await AsyncStorage.getItem('social:stories');
    if (data) {
      const storyData = JSON.parse(data) as { [key: string]: Story[] };
      Object.entries(storyData).forEach(([userId, stories]) => {
        stories.forEach((story) => {
          story.createdAt = new Date(story.createdAt);
          story.expiresAt = new Date(story.expiresAt);
        });
        this.stories.set(userId, stories);
      });
    }
  }

  private async saveUserDirectories(): Promise<void> {
    const data = Array.from(this.userDirectories.values());
    await AsyncStorage.setItem('social:userdirs', JSON.stringify(data));
  }

  private async loadUserDirectories(): Promise<void> {
    const data = await AsyncStorage.getItem('social:userdirs');
    if (data) {
      const dirs = JSON.parse(data) as UserDirectory[];
      dirs.forEach((dir) => {
        dir.joinDate = new Date(dir.joinDate);
        this.userDirectories.set(dir.userId, dir);
      });
    }
  }

  private async saveGroupChats(): Promise<void> {
    const data = Array.from(this.groupChats.values());
    await AsyncStorage.setItem('social:groups', JSON.stringify(data));
  }

  private async loadGroupChats(): Promise<void> {
    const data = await AsyncStorage.getItem('social:groups');
    if (data) {
      const groups = JSON.parse(data) as GroupChat[];
      groups.forEach((group) => {
        group.createdAt = new Date(group.createdAt);
        this.groupChats.set(group.id, group);
      });
    }
  }

  private async cleanupExpiredStories(): Promise<void> {
    const now = new Date();
    let changed = false;

    this.stories.forEach((stories, userId) => {
      const filtered = stories.filter((s) => s.expiresAt > now);
      if (filtered.length !== stories.length) {
        this.stories.set(userId, filtered);
        changed = true;
      }
    });

    if (changed) {
      await this.saveStories();
    }
  }
}

export const socialDiscoveryService = new SocialDiscoveryService();
