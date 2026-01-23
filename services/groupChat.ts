import AsyncStorage from '@react-native-async-storage/async-storage';
import { backend } from './backend';
import { realtimeService } from './realtime';

export interface GroupMember {
  userId: string;
  name: string;
  phoneNumber?: string;
  joinedAt: Date;
  role: 'admin' | 'member';
}

export interface GroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  readBy: string[];
  type: 'text' | 'image' | 'file';
  mediaUrl?: string;
}

export interface GroupChat {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  members: GroupMember[];
  messages: GroupMessage[];
  avatar?: string;
  isVipOnly: boolean; // VIP users can create number-to-number groups
}

const GROUPS_KEY = 'cruzer:groups:v1';

class GroupChatService {
  private static instance: GroupChatService;
  private groups: Map<string, GroupChat> = new Map();
  private listeners: Set<(type: 'group' | 'message') => void> = new Set();

  private constructor() {
    this.initializeFromStorage();
  }

  static getInstance(): GroupChatService {
    if (!GroupChatService.instance) {
      GroupChatService.instance = new GroupChatService();
    }
    return GroupChatService.instance;
  }

  private async initializeFromStorage(): Promise<void> {
    try {
      const groupsJson = await AsyncStorage.getItem(GROUPS_KEY);
      if (groupsJson) {
        const groupsArray = JSON.parse(groupsJson);
        groupsArray.forEach((group: any) => {
          this.groups.set(group.id, {
            ...group,
            createdAt: new Date(group.createdAt),
            members: group.members.map((m: any) => ({
              ...m,
              joinedAt: new Date(m.joinedAt),
            })),
            messages: group.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
          });
        });
        console.log('[GroupChat] Loaded groups:', this.groups.size);
      }
    } catch (error) {
      console.error('[GroupChat] Failed to load groups:', error);
    }
  }

  private async saveGroups(): Promise<void> {
    try {
      const groupsArray = Array.from(this.groups.values());
      await AsyncStorage.setItem(GROUPS_KEY, JSON.stringify(groupsArray));
      console.log('[GroupChat] Saved groups:', groupsArray.length);
    } catch (error) {
      console.error('[GroupChat] Failed to save groups:', error);
    }
  }

  private notifyListeners(type: 'group' | 'message'): void {
    this.listeners.forEach(listener => listener(type));
  }

  /**
   * Create a new group chat
   */
  async createGroup(
    name: string,
    creatorId: string,
    creatorName: string,
    memberIds: string[],
    isVipOnly: boolean = false,
    description?: string
  ): Promise<GroupChat> {
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const creator: GroupMember = {
      userId: creatorId,
      name: creatorName,
      joinedAt: new Date(),
      role: 'admin',
    };

    const members: GroupMember[] = [
      creator,
      ...memberIds.map(id => ({
        userId: id,
        name: '', // Will be populated when users join
        joinedAt: new Date(),
        role: 'member' as const,
      })),
    ];

    const group: GroupChat = {
      id: groupId,
      name,
      description,
      createdBy: creatorId,
      createdAt: new Date(),
      members,
      messages: [],
      isVipOnly,
    };

    this.groups.set(groupId, group);
    await this.saveGroups();
    this.notifyListeners('group');

    // Sync with backend
    try {
      await backend.createGroup(group);
    } catch (error) {
      console.error('[GroupChat] Failed to sync with backend:', error);
    }

    console.log('[GroupChat] Created group:', groupId, 'with', members.length, 'members');
    return group;
  }

  /**
   * Add a member to a group
   */
  async addMember(
    groupId: string,
    userId: string,
    userName: string,
    phoneNumber?: string
  ): Promise<boolean> {
    const group = this.groups.get(groupId);
    if (!group) {
      console.error('[GroupChat] Group not found:', groupId);
      return false;
    }

    // Check if member already exists
    if (group.members.some(m => m.userId === userId)) {
      console.warn('[GroupChat] Member already in group:', userId);
      return false;
    }

    const newMember: GroupMember = {
      userId,
      name: userName,
      phoneNumber,
      joinedAt: new Date(),
      role: 'member',
    };

    group.members.push(newMember);
    await this.saveGroups();
    this.notifyListeners('group');

    console.log('[GroupChat] Added member to group:', userId, groupId);
    return true;
  }

  /**
   * Remove a member from a group
   */
  async removeMember(groupId: string, userId: string): Promise<boolean> {
    const group = this.groups.get(groupId);
    if (!group) {
      console.error('[GroupChat] Group not found:', groupId);
      return false;
    }

    group.members = group.members.filter(m => m.userId !== userId);
    await this.saveGroups();
    this.notifyListeners('group');

    console.log('[GroupChat] Removed member from group:', userId, groupId);
    return true;
  }

  /**
   * Send a message to a group
   */
  async sendMessage(
    groupId: string,
    senderId: string,
    senderName: string,
    content: string,
    type: 'text' | 'image' | 'file' = 'text',
    mediaUrl?: string
  ): Promise<GroupMessage | null> {
    const group = this.groups.get(groupId);
    if (!group) {
      console.error('[GroupChat] Group not found:', groupId);
      return null;
    }

    // Check if sender is a member
    if (!group.members.some(m => m.userId === senderId)) {
      console.error('[GroupChat] Sender not a member:', senderId);
      return null;
    }

    const message: GroupMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      groupId,
      senderId,
      senderName,
      content,
      timestamp: new Date(),
      readBy: [senderId],
      type,
      mediaUrl,
    };

    group.messages.push(message);
    await this.saveGroups();
    this.notifyListeners('message');

    // Sync with backend
    try {
      await backend.sendGroupMessage(message);
    } catch (error) {
      console.error('[GroupChat] Failed to sync message with backend:', error);
    }

    console.log('[GroupChat] Sent message to group:', groupId);
    return message;
  }

  /**
   * Mark message as read
   */
  async markAsRead(groupId: string, messageId: string, userId: string): Promise<void> {
    const group = this.groups.get(groupId);
    if (!group) return;

    const message = group.messages.find(m => m.id === messageId);
    if (message && !message.readBy.includes(userId)) {
      message.readBy.push(userId);
      await this.saveGroups();
    }
  }

  /**
   * Get all groups for a user
   */
  getUserGroups(userId: string): GroupChat[] {
    return Array.from(this.groups.values()).filter(group =>
      group.members.some(m => m.userId === userId)
    );
  }

  /**
   * Get a specific group
   */
  getGroup(groupId: string): GroupChat | undefined {
    return this.groups.get(groupId);
  }

  /**
   * Get messages for a group
   */
  getGroupMessages(groupId: string, limit: number = 50): GroupMessage[] {
    const group = this.groups.get(groupId);
    if (!group) return [];
    return group.messages.slice(-limit);
  }

  /**
   * Delete a group (admin only)
   */
  async deleteGroup(groupId: string, userId: string): Promise<boolean> {
    const group = this.groups.get(groupId);
    if (!group) return false;

    // Check if user is admin
    const member = group.members.find(m => m.userId === userId);
    if (!member || member.role !== 'admin') {
      console.error('[GroupChat] User not admin:', userId);
      return false;
    }

    this.groups.delete(groupId);
    await this.saveGroups();
    this.notifyListeners('group');

    console.log('[GroupChat] Deleted group:', groupId);
    return true;
  }

  /**
   * Update group info
   */
  async updateGroup(
    groupId: string,
    updates: Partial<Pick<GroupChat, 'name' | 'description' | 'avatar'>>
  ): Promise<boolean> {
    const group = this.groups.get(groupId);
    if (!group) return false;

    Object.assign(group, updates);
    await this.saveGroups();
    this.notifyListeners('group');

    console.log('[GroupChat] Updated group:', groupId);
    return true;
  }

  /**
   * Subscribe to group changes
   */
  subscribe(listener: (type: 'group' | 'message') => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get unread message count for a user
   */
  getUnreadCount(groupId: string, userId: string): number {
    const group = this.groups.get(groupId);
    if (!group) return 0;

    return group.messages.filter(msg => 
      msg.senderId !== userId && !msg.readBy.includes(userId)
    ).length;
  }
}

export const groupChatService = GroupChatService.getInstance();
