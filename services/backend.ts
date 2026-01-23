import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Backend Service
 * Handles communication with your backend/cloud server for:
 * - User profile persistence
 * - Analytics sync
 * - Cross-user data visibility
 * - Real-time updates
 */

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  phone?: string;
  location?: string;
  createdAt: number;
  updatedAt: number;
  isOnline?: boolean;
  lastSeen?: number;
  [key: string]: any;
}

interface AnalyticsPayload {
  userId: string;
  sessionId: string;
  events: Array<{
    event: string;
    timestamp: number;
    duration?: number;
    metadata?: Record<string, any>;
  }>;
  deviceInfo?: Record<string, any>;
  summary?: Record<string, any>;
}

interface SyncOptions {
  retryCount?: number;
  timeout?: number;
  background?: boolean;
}

class BackendService {
  private static instance: BackendService;
  private baseURL: string = process.env.EXPO_PUBLIC_BACKEND_URL || (__DEV__ 
    ? 'http://localhost:3000/api'
    : 'https://your-production-url.com/api');
  private authToken: string = '';
  private userId: string = '';
  private sessionId: string = '';
  private syncQueue: Array<{ type: string; data: any; timestamp: number }> = [];
  private isSyncing: boolean = false;
  private syncInterval: number = 60000; // Sync every 60 seconds

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.startAutoSync();
  }

  static getInstance(): BackendService {
    if (!BackendService.instance) {
      BackendService.instance = new BackendService();
    }
    return BackendService.instance;
  }

  /**
   * Initialize backend service
   */
  async initialize(baseURL: string, authToken?: string): Promise<void> {
    this.baseURL = baseURL;
    if (authToken) {
      this.authToken = authToken;
      await AsyncStorage.setItem('auth_token', authToken);
    } else {
      const stored = await AsyncStorage.getItem('auth_token');
      if (stored) this.authToken = stored;
    }
    console.log('[Backend] Initialized with URL:', baseURL);
  }

  /**
   * Set current user
   */
  setCurrentUser(userId: string): void {
    this.userId = userId;
  }

  /**
   * Authenticate with backend
   */
  async authenticate(email: string, password: string): Promise<UserProfile | null> {
    try {
      const response = await this.post('/auth/login', {
        email,
        password,
      });

      if (response.token) {
        this.authToken = response.token;
        this.userId = response.user.id;
        await AsyncStorage.setItem('auth_token', response.token);
        await AsyncStorage.setItem('user_id', response.user.id);
        console.log('[Backend] Authenticated:', response.user.id);
      }

      return response.user;
    } catch (error) {
      console.error('[Backend] Authentication error:', error);
      return null;
    }
  }

  /**
   * Register new user
   */
  async register(userData: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      const response = await this.post('/auth/register', {
        ...userData,
        createdAt: Date.now(),
      });

      if (response.token) {
        this.authToken = response.token;
        this.userId = response.user.id;
        await AsyncStorage.setItem('auth_token', response.token);
        await AsyncStorage.setItem('user_id', response.user.id);
      }

      return response.user;
    } catch (error) {
      console.error('[Backend] Registration error:', error);
      return null;
    }
  }

  /**
   * Save user profile to backend
   */
  async saveUserProfile(profile: Partial<UserProfile>): Promise<boolean> {
    try {
      if (!this.userId) {
        console.warn('[Backend] No user ID set');
        return false;
      }

      const updatedProfile = {
        ...profile,
        id: this.userId,
        updatedAt: Date.now(),
      };

      const response = await this.put(`/users/${this.userId}`, updatedProfile);

      if (response.success) {
        // Also save locally
        await AsyncStorage.setItem(`user_profile_${this.userId}`, JSON.stringify(updatedProfile));
        console.log('[Backend] Profile saved:', this.userId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[Backend] Save profile error:', error);
      // Queue for later sync
      this.queueSync('user_profile', profile);
      return false;
    }
  }

  /**
   * Get user profile from backend
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const cached = await AsyncStorage.getItem(`user_profile_${userId}`);
      if (cached) {
        return JSON.parse(cached);
      }

      const response = await this.get(`/users/${userId}`);
      if (response) {
        await AsyncStorage.setItem(`user_profile_${userId}`, JSON.stringify(response));
        return response;
      }
      return null;
    } catch (error) {
      console.error('[Backend] Get profile error:', error);
      // Try local cache
      const cached = await AsyncStorage.getItem(`user_profile_${userId}`);
      return cached ? JSON.parse(cached) : null;
    }
  }

  /**
   * Get all users (for discovery/friends)
   */
  async getAllUsers(filters?: Record<string, any>): Promise<UserProfile[]> {
    try {
      const response = await this.get('/users', filters);
      return response || [];
    } catch (error) {
      console.error('[Backend] Get users error:', error);
      return [];
    }
  }

  /**
   * Search users
   */
  async searchUsers(query: string): Promise<UserProfile[]> {
    try {
      const response = await this.get('/users/search', { q: query });
      return response || [];
    } catch (error) {
      console.error('[Backend] Search error:', error);
      return [];
    }
  }

  /**
   * Sync analytics to backend
   */
  async syncAnalytics(payload: AnalyticsPayload, options?: SyncOptions): Promise<boolean> {
    try {
      const response = await this.post('/analytics', payload, options);
      console.log('[Backend] Analytics synced');
      return response.success === true;
    } catch (error) {
      console.error('[Backend] Analytics sync error:', error);
      // Queue for retry
      this.queueSync('analytics', payload);
      return false;
    }
  }

  /**
   * Update user status (online/offline/last seen)
   */
  async updateUserStatus(status: 'online' | 'offline' | 'away'): Promise<boolean> {
    try {
      const response = await this.post(`/users/${this.userId}/status`, {
        status,
        lastSeen: Date.now(),
      });
      return response.success === true;
    } catch (error) {
      console.error('[Backend] Status update error:', error);
      return false;
    }
  }

  /**
   * Queue sync operation for later
   */
  private queueSync(type: string, data: any): void {
    this.syncQueue.push({
      type,
      data,
      timestamp: Date.now(),
    });

    // Limit queue size
    if (this.syncQueue.length > 100) {
      this.syncQueue.shift();
    }

    console.log('[Backend] Queued sync:', type, 'Queue size:', this.syncQueue.length);
  }

  /**
   * Start automatic sync interval
   */
  private startAutoSync(): void {
    setInterval(() => {
      if (this.syncQueue.length > 0 && !this.isSyncing) {
        this.processSyncQueue();
      }
    }, this.syncInterval);
  }

  /**
   * Process queued sync operations
   */
  private async processSyncQueue(): Promise<void> {
    if (this.isSyncing || this.syncQueue.length === 0) return;

    this.isSyncing = true;
    try {
      const batch = this.syncQueue.splice(0, 10); // Process 10 at a time

      for (const item of batch) {
        try {
          if (item.type === 'user_profile') {
            await this.saveUserProfile(item.data);
          } else if (item.type === 'analytics') {
            await this.syncAnalytics(item.data);
          }
        } catch (error) {
          console.error('[Backend] Sync item error:', error);
          // Re-queue if failed
          this.syncQueue.push(item);
        }
      }

      console.log('[Backend] Sync queue processed. Remaining:', this.syncQueue.length);
    } catch (error) {
      console.error('[Backend] Sync queue error:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Get sync queue status
   */
  getSyncQueueStatus() {
    return {
      queue_size: this.syncQueue.length,
      is_syncing: this.isSyncing,
      pending_items: this.syncQueue,
    };
  }

  // ==================== HTTP Methods ====================

  private async request(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    options?: SyncOptions
  ): Promise<any> {
    if (!this.baseURL) {
      throw new Error('[Backend] Not initialized. Call initialize() first.');
    }

    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    try {
      const fetchOptions: RequestInit = {
        method,
        headers,
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        fetchOptions.body = JSON.stringify(data);
      }

      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        if (response.status === 401) {
          this.authToken = '';
          await AsyncStorage.removeItem('auth_token');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[Backend] Request failed:', method, endpoint, error);
      throw error;
    }
  }

  private async get(endpoint: string, params?: Record<string, any>): Promise<any> {
    let url = endpoint;
    if (params) {
      const query = new URLSearchParams(params).toString();
      url = `${endpoint}?${query}`;
    }
    return this.request('GET', url);
  }

  private async post(endpoint: string, data: any, options?: SyncOptions): Promise<any> {
    return this.request('POST', endpoint, data, options);
  }

  // Public post method for services that need external access
  public async publicPost(endpoint: string, data: any, options?: SyncOptions): Promise<any> {
    return this.request('POST', endpoint, data, options);
  }

  private async put(endpoint: string, data: any, options?: SyncOptions): Promise<any> {
    return this.request('PUT', endpoint, data, options);
  }

  private async delete(endpoint: string): Promise<any> {
    return this.request('DELETE', endpoint);
  }

  // ==================== Helpers ====================

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * MongoDB-specific methods for Cruzer app
   */

  // Messages
  async getMessages(userId: string, contactId?: string, limit: number = 100, skip: number = 0): Promise<any[]> {
    try {
      const params: any = { limit, skip };
      if (contactId) params.contactId = contactId;
      const response = await this.get(`/messages/${userId}`, params);
      return response?.data || [];
    } catch (error) {
      console.error('[Backend] Get messages error:', error);
      return [];
    }
  }

  async createMessage(messageData: any): Promise<any> {
    try {
      const response = await this.post('/messages', messageData);
      return response?.data;
    } catch (error) {
      console.error('[Backend] Create message error:', error);
      this.queueSync('message', messageData);
      return null;
    }
  }

  async syncMessages(userId: string, localMessages: any[] = []): Promise<any[]> {
    try {
      // Push local messages to server
      if (localMessages.length > 0) {
        await this.post('/messages/bulk', { messages: localMessages });
      }

      // Pull messages from server
      const serverMessages = await this.getMessages(userId);
      return serverMessages;
    } catch (error) {
      console.error('[Backend] Message sync error:', error);
      throw error;
    }
  }

  // Contacts
  async getContacts(userId: string): Promise<any[]> {
    try {
      const response = await this.get(`/contacts/${userId}`);
      return response?.data || [];
    } catch (error) {
      console.error('[Backend] Get contacts error:', error);
      return [];
    }
  }

  async createContact(contactData: any): Promise<any> {
    try {
      const response = await this.post('/contacts', contactData);
      return response?.data;
    } catch (error) {
      console.error('[Backend] Create contact error:', error);
      this.queueSync('contact', contactData);
      return null;
    }
  }

  async syncContacts(userId: string, localContacts: any[] = []): Promise<any[]> {
    try {
      // Push local contacts to server
      if (localContacts.length > 0) {
        await this.post('/contacts/bulk', { contacts: localContacts });
      }

      // Pull contacts from server
      const serverContacts = await this.getContacts(userId);
      return serverContacts;
    } catch (error) {
      console.error('[Backend] Contact sync error:', error);
      throw error;
    }
  }

  async updateContact(contactId: string, updates: any): Promise<any> {
    try {
      const response = await this.put(`/contacts/${contactId}`, updates);
      return response?.data;
    } catch (error) {
      console.error('[Backend] Update contact error:', error);
      return null;
    }
  }

  // Calculations
  async getCalculations(userId: string, limit: number = 50, skip: number = 0): Promise<any[]> {
    try {
      const response = await this.get(`/calculations/${userId}`, { limit, skip });
      return response?.data || [];
    } catch (error) {
      console.error('[Backend] Get calculations error:', error);
      return [];
    }
  }

  async saveCalculation(calculationData: any): Promise<any> {
    try {
      const response = await this.post('/calculations', calculationData);
      return response?.data;
    } catch (error) {
      console.error('[Backend] Save calculation error:', error);
      return null;
    }
  }

  async clearCalculations(userId: string): Promise<boolean> {
    try {
      const response = await this.delete(`/calculations/user/${userId}`);
      return response?.success === true;
    } catch (error) {
      console.error('[Backend] Clear calculations error:', error);
      return false;
    }
  }

  /**
   * VIP/Whitelist Management
   */
  async syncWhitelist(data: {
    devWhitelist: string[];
    staffWhitelist: string[];
    timestamp: string;
  }): Promise<boolean> {
    try {
      const response = await this.post('/vip/whitelist/sync', data);
      console.log('[Backend] Whitelist synced');
      return response?.success !== false;
    } catch (error) {
      console.error('[Backend] Whitelist sync error:', error);
      return false;
    }
  }

  async getWhitelist(type: 'developer' | 'staff'): Promise<string[]> {
    try {
      const response = await this.get(`/vip/whitelist/${type}`);
      return response?.userIds || [];
    } catch (error) {
      console.error('[Backend] Get whitelist error:', error);
      return [];
    }
  }

  async addWhitelistUser(userId: string, type: 'developer' | 'staff', adminId: string): Promise<boolean> {
    try {
      const response = await this.post(`/vip/whitelist/${type}`, {
        userId,
        adminId,
        timestamp: new Date().toISOString(),
      });
      console.log('[Backend] User added to whitelist:', type, userId);
      return response?.success !== false;
    } catch (error) {
      console.error('[Backend] Add whitelist error:', error);
      return false;
    }
  }

  async removeWhitelistUser(userId: string, type: 'developer' | 'staff', adminId: string): Promise<boolean> {
    try {
      const response = await this.delete(`/vip/whitelist/${type}/${userId}`);
      console.log('[Backend] User removed from whitelist:', type, userId);
      return response?.success !== false;
    } catch (error) {
      console.error('[Backend] Remove whitelist error:', error);
      return false;
    }
  }

  async sendAuditLog(auditData: any): Promise<boolean> {
    try {
      const response = await this.post('/vip/audit/log', auditData);
      console.log('[Backend] Audit log recorded');
      return response?.success !== false;
    } catch (error) {
      console.error('[Backend] Send audit log error:', error);
      return false;
    }
  }

  async getAuditLogs(limit: number = 100): Promise<any[]> {
    try {
      const response = await this.get('/vip/audit/logs', { limit });
      return response?.logs || [];
    } catch (error) {
      console.error('[Backend] Get audit logs error:', error);
      return [];
    }
  }

  /**
   * Clear all authentication
   */
  async logout(): Promise<void> {
    try {
      if (this.userId) {
        await this.updateUserStatus('offline');
      }
    } catch (error) {
      console.error('[Backend] Logout error:', error);
    }

    this.authToken = '';
    this.userId = '';
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_id');
    console.log('[Backend] Logged out');
  }

  /**
   * Check connection status
   */
  async checkConnection(): Promise<boolean> {
    try {
      const response = await this.get('/health');
      return response.status === 'ok';
    } catch {
      return false;
    }
  }

  /**
   * Get current session info
   */
  getSessionInfo() {
    return {
      session_id: this.sessionId,
      user_id: this.userId,
      auth_token: this.authToken ? '***' : 'not_set',
      base_url: this.baseURL,
      queue_size: this.syncQueue.length,
    };
  }

  /**
   * Get server version for debug monitoring
   */
  async getVersion(): Promise<string> {
    try {
      const data = await this.get('/version');
      return data.version || '1.0.0';
    } catch (error) {
      return '1.0.0';
    }
  }

  /**
   * Group Chat Methods
   */
  async createGroup(groupData: any): Promise<any> {
    try {
      const response = await this.post('/groups', groupData);
      console.log('[Backend] Group created:', response?.data?.id);
      return response?.data;
    } catch (error) {
      console.error('[Backend] Create group error:', error);
      this.queueSync('group', groupData);
      return null;
    }
  }

  async getUserGroups(userId: string): Promise<any[]> {
    try {
      const response = await this.get(`/groups/user/${userId}`);
      return response?.data || [];
    } catch (error) {
      console.error('[Backend] Get user groups error:', error);
      return [];
    }
  }

  async sendGroupMessage(messageData: any): Promise<any> {
    try {
      const response = await this.post('/groups/messages', messageData);
      return response?.data;
    } catch (error) {
      console.error('[Backend] Send group message error:', error);
      this.queueSync('group_message', messageData);
      return null;
    }
  }

  async getGroupMessages(groupId: string, limit: number = 50, skip: number = 0): Promise<any[]> {
    try {
      const response = await this.get(`/groups/${groupId}/messages`, { limit, skip });
      return response?.data || [];
    } catch (error) {
      console.error('[Backend] Get group messages error:', error);
      return [];
    }
  }

  async addGroupMember(groupId: string, userId: string): Promise<boolean> {
    try {
      const response = await this.post(`/groups/${groupId}/members`, { userId });
      return response?.success !== false;
    } catch (error) {
      console.error('[Backend] Add group member error:', error);
      return false;
    }
  }

  async removeGroupMember(groupId: string, userId: string): Promise<boolean> {
    try {
      const response = await this.delete(`/groups/${groupId}/members/${userId}`);
      return response?.success !== false;
    } catch (error) {
      console.error('[Backend] Remove group member error:', error);
      return false;
    }
  }
}

export const backend = BackendService.getInstance();
export default BackendService;
