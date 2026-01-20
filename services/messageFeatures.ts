
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Reaction {
  userId: string;
  emoji: string;
  timestamp: Date;
}

export interface MessageFeatureSet {
  id: string;
  conversationId: string;
  messageId: string;
  messageText: string;
  timestamp: Date;
  readBy?: { userId: string; timestamp: Date }[];
}

const REACTIONS_KEY = 'cruzer:reactions:v1';
const READ_RECEIPTS_KEY = 'cruzer:read:receipts:v1';
const TYPING_KEY = 'cruzer:typing:indicators:v1';

class MessageFeaturesService {
  private reactions: Map<string, Reaction[]> = new Map();
  private readReceipts: Map<string, MessageFeatureSet> = new Map();
  private typingUsers: Map<string, { userId: string; timestamp: Date }> = new Map();

  constructor() {
    this.loadData();
  }

  private async loadData() {
    try {
      const [reactions, reads] = await Promise.all([
        AsyncStorage.getItem(REACTIONS_KEY),
        AsyncStorage.getItem(READ_RECEIPTS_KEY),
      ]);
      if (reactions) this.reactions = new Map(JSON.parse(reactions));
      if (reads) this.readReceipts = new Map(JSON.parse(reads));
    } catch (error) {
      console.error('Error loading message features:', error);
    }
  }

  private async saveData() {
    try {
      await Promise.all([
        AsyncStorage.setItem(REACTIONS_KEY, JSON.stringify(Array.from(this.reactions.entries()))),
        AsyncStorage.setItem(READ_RECEIPTS_KEY, JSON.stringify(Array.from(this.readReceipts.entries()))),
      ]);
    } catch (error) {
      console.error('Error saving message features:', error);
    }
  }

  addReaction(messageId: string, userId: string, emoji: string) {
    const reactions = this.reactions.get(messageId) || [];
    reactions.push({ userId, emoji, timestamp: new Date() });
    this.reactions.set(messageId, reactions);
    this.saveData();
  }

  getReactions(messageId: string): Reaction[] {
    return this.reactions.get(messageId) || [];
  }

  removeReaction(messageId: string, userId: string, emoji: string) {
    const reactions = this.reactions.get(messageId) || [];
    const filtered = reactions.filter(r => !(r.userId === userId && r.emoji === emoji));
    this.reactions.set(messageId, filtered);
    this.saveData();
  }

  markAsRead(messageId: string, userId: string) {
    const message = this.readReceipts.get(messageId);
    if (message) {
      if (!message.readBy) message.readBy = [];
      message.readBy.push({ userId, timestamp: new Date() });
      this.readReceipts.set(messageId, message);
      this.saveData();
    }
  }

  getReadReceipts(messageId: string) {
    const message = this.readReceipts.get(messageId);
    return message?.readBy || [];
  }

  setTypingStatus(conversationId: string, userId: string, isTyping: boolean) {
    const key = `${conversationId}:${userId}`;
    if (isTyping) {
      this.typingUsers.set(key, { userId, timestamp: new Date() });
    } else {
      this.typingUsers.delete(key);
    }
  }

  getTypingUsers(conversationId: string): string[] {
    return Array.from(this.typingUsers.entries())
      .filter(([key]) => key.startsWith(conversationId))
      .map(([, user]) => user.userId);
  }

  getReactionEmojis(): string[] {
    return ['👍', '❤️', '😂', '😢', '😡', '🔥', '🎉', '😍', '🤔', '👏'];
  }
}

export const messageFeaturesService = new MessageFeaturesService();
