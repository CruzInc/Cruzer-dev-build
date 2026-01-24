// Gamification & Engagement Service - Streaks, Challenges, Badges, Statistics
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserStatistics {
  userId: string;
  messagesSent: number;
  callsMade: number;
  callDuration: number; // in seconds
  videoCallsMade: number;
  videoDuration: number; // in seconds
  contactsAdded: number;
  groupsCreated: number;
  lastUpdated: Date;
}

export interface Streak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  startDate: Date;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  category: 'messaging' | 'social' | 'time' | 'special';
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  rewards: number; // Points or currency
  startDate: Date;
  endDate: Date;
  completed: boolean;
  completedAt?: Date;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: Date;
}

export class GamificationService {
  private statsMap: Map<string, UserStatistics> = new Map();
  private streaksMap: Map<string, Streak> = new Map();
  private badgesMap: Map<string, Badge[]> = new Map();
  private challengesMap: Map<string, Challenge[]> = new Map();

  async initializeGamification() {
    await this.loadStatistics();
    await this.loadStreaks();
    await this.loadBadges();
    await this.loadChallenges();
  }

  // Statistics
  async incrementMessagesSent(userId: string, count: number = 1): Promise<void> {
    const stats = this.statsMap.get(userId) || this.createDefaultStats(userId);
    stats.messagesSent += count;
    stats.lastUpdated = new Date();
    this.statsMap.set(userId, stats);
    await this.saveStatistics();
    await this.checkBadgesAndChallenges(userId);
  }

  async incrementCallsMade(userId: string, duration: number = 0): Promise<void> {
    const stats = this.statsMap.get(userId) || this.createDefaultStats(userId);
    stats.callsMade += 1;
    stats.callDuration += duration;
    stats.lastUpdated = new Date();
    this.statsMap.set(userId, stats);
    await this.saveStatistics();
    await this.checkBadgesAndChallenges(userId);
  }

  async incrementVideoCallsMade(userId: string, duration: number = 0): Promise<void> {
    const stats = this.statsMap.get(userId) || this.createDefaultStats(userId);
    stats.videoCallsMade += 1;
    stats.videoDuration += duration;
    stats.lastUpdated = new Date();
    this.statsMap.set(userId, stats);
    await this.saveStatistics();
    await this.checkBadgesAndChallenges(userId);
  }

  async getUserStatistics(userId: string): Promise<UserStatistics> {
    return this.statsMap.get(userId) || this.createDefaultStats(userId);
  }

  // Streaks
  async updateStreak(userId: string): Promise<number> {
    const streak = this.streaksMap.get(userId) || {
      userId,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: new Date(0),
      startDate: new Date(),
    };

    const lastActivity = streak.lastActivityDate;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if activity is today or yesterday
    const isToday = lastActivity.toDateString() === today.toDateString();
    const isYesterday =
      lastActivity.toDateString() === yesterday.toDateString();

    if (isToday) {
      // Already counted today
      return streak.currentStreak;
    }

    if (isYesterday) {
      // Continue streak
      streak.currentStreak += 1;
    } else {
      // Break streak, restart
      streak.currentStreak = 1;
      streak.startDate = new Date();
    }

    streak.lastActivityDate = today;
    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }

    this.streaksMap.set(userId, streak);
    await this.saveStreaks();
    return streak.currentStreak;
  }

  async getStreak(userId: string): Promise<Streak | null> {
    return this.streaksMap.get(userId) || null;
  }

  // Badges
  async awardBadge(userId: string, badgeId: string, name: string, description: string, icon: string, category: 'messaging' | 'social' | 'time' | 'special'): Promise<void> {
    const badges = this.badgesMap.get(userId) || [];

    // Check if already awarded
    if (badges.some((b) => b.id === badgeId)) {
      return;
    }

    const badge: Badge = {
      id: badgeId,
      name,
      description,
      icon,
      unlockedAt: new Date(),
      category,
    };

    badges.push(badge);
    this.badgesMap.set(userId, badges);
    await this.saveBadges();
  }

  async getUserBadges(userId: string): Promise<Badge[]> {
    return this.badgesMap.get(userId) || [];
  }

  async getBadgeCount(userId: string): Promise<number> {
    return (this.badgesMap.get(userId) || []).length;
  }

  // Challenges
  async createChallenge(
    userId: string,
    challenge: Omit<Challenge, 'completed' | 'completedAt'>
  ): Promise<void> {
    const challenges = this.challengesMap.get(userId) || [];
    challenges.push({ ...challenge, completed: false });
    this.challengesMap.set(userId, challenges);
    await this.saveChallenges();
  }

  async updateChallengeProgress(
    userId: string,
    challengeId: string,
    progress: number
  ): Promise<void> {
    const challenges = this.challengesMap.get(userId) || [];
    const challenge = challenges.find((c) => c.id === challengeId);

    if (challenge) {
      challenge.current = Math.min(progress, challenge.target);

      if (challenge.current >= challenge.target && !challenge.completed) {
        challenge.completed = true;
        challenge.completedAt = new Date();
        await this.awardBadge(
          userId,
          `challenge-${challengeId}`,
          `Completed: ${challenge.title}`,
          challenge.description,
          '🏆',
          'special'
        );
      }

      this.challengesMap.set(userId, challenges);
      await this.saveChallenges();
    }
  }

  async getUserChallenges(userId: string): Promise<Challenge[]> {
    const challenges = this.challengesMap.get(userId) || [];
    const now = new Date();

    // Filter out expired challenges
    return challenges.filter((c) => c.endDate > now);
  }

  async getActiveChallenges(userId: string): Promise<Challenge[]> {
    const challenges = await this.getUserChallenges(userId);
    return challenges.filter((c) => !c.completed);
  }

  // Private helpers
  private createDefaultStats(userId: string): UserStatistics {
    return {
      userId,
      messagesSent: 0,
      callsMade: 0,
      callDuration: 0,
      videoCallsMade: 0,
      videoDuration: 0,
      contactsAdded: 0,
      groupsCreated: 0,
      lastUpdated: new Date(),
    };
  }

  private async checkBadgesAndChallenges(userId: string): Promise<void> {
    const stats = this.statsMap.get(userId);
    if (!stats) return;

    // Check for message badges
    if (stats.messagesSent === 100) {
      await this.awardBadge(userId, 'msg-100', '100 Messages', 'Sent 100 messages', '💬', 'messaging');
    }
    if (stats.messagesSent === 1000) {
      await this.awardBadge(userId, 'msg-1000', '1000 Messages', 'Sent 1000 messages', '📬', 'messaging');
    }

    // Check for call badges
    if (stats.callsMade === 10) {
      await this.awardBadge(userId, 'call-10', 'Phone Master', 'Made 10 calls', '☎️', 'social');
    }

    // Check for video badges
    if (stats.videoCallsMade === 5) {
      await this.awardBadge(userId, 'video-5', 'Video Star', 'Made 5 video calls', '🎥', 'social');
    }
  }

  private async saveStatistics(): Promise<void> {
    const data = Array.from(this.statsMap.values());
    await AsyncStorage.setItem('gamification:stats', JSON.stringify(data));
  }

  private async loadStatistics(): Promise<void> {
    const data = await AsyncStorage.getItem('gamification:stats');
    if (data) {
      const stats = JSON.parse(data) as UserStatistics[];
      stats.forEach((s) => {
        s.lastUpdated = new Date(s.lastUpdated);
        this.statsMap.set(s.userId, s);
      });
    }
  }

  private async saveStreaks(): Promise<void> {
    const data = Array.from(this.streaksMap.values());
    await AsyncStorage.setItem('gamification:streaks', JSON.stringify(data));
  }

  private async loadStreaks(): Promise<void> {
    const data = await AsyncStorage.getItem('gamification:streaks');
    if (data) {
      const streaks = JSON.parse(data) as Streak[];
      streaks.forEach((s) => {
        s.lastActivityDate = new Date(s.lastActivityDate);
        s.startDate = new Date(s.startDate);
        this.streaksMap.set(s.userId, s);
      });
    }
  }

  private async saveBadges(): Promise<void> {
    const data: { [key: string]: Badge[] } = {};
    this.badgesMap.forEach((badges, userId) => {
      data[userId] = badges;
    });
    await AsyncStorage.setItem('gamification:badges', JSON.stringify(data));
  }

  private async loadBadges(): Promise<void> {
    const data = await AsyncStorage.getItem('gamification:badges');
    if (data) {
      const badgeData = JSON.parse(data) as { [key: string]: Badge[] };
      Object.entries(badgeData).forEach(([userId, badges]) => {
        badges.forEach((b) => {
          b.unlockedAt = new Date(b.unlockedAt);
        });
        this.badgesMap.set(userId, badges);
      });
    }
  }

  private async saveChallenges(): Promise<void> {
    const data: { [key: string]: Challenge[] } = {};
    this.challengesMap.forEach((challenges, userId) => {
      data[userId] = challenges;
    });
    await AsyncStorage.setItem('gamification:challenges', JSON.stringify(data));
  }

  private async loadChallenges(): Promise<void> {
    const data = await AsyncStorage.getItem('gamification:challenges');
    if (data) {
      const challengeData = JSON.parse(data) as { [key: string]: Challenge[] };
      Object.entries(challengeData).forEach(([userId, challenges]) => {
        challenges.forEach((c) => {
          c.startDate = new Date(c.startDate);
          c.endDate = new Date(c.endDate);
          if (c.completedAt) c.completedAt = new Date(c.completedAt);
        });
        this.challengesMap.set(userId, challenges);
      });
    }
  }
}

export const gamificationService = new GamificationService();
