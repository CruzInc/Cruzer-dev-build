// Type Definitions - Update these in your main app/index.tsx file

/**
 * Add these types to the TYPE DEFINITIONS section of app/index.tsx
 */

// ==================== CALCULATOR MODES ====================

// Update the existing CalculatorMode type to include new modes:
export type CalculatorMode = 
  | "calculator" 
  | "messages" 
  | "chat" 
  | "videoCall" 
  | "info" 
  | "profile" 
  | "auth" 
  | "developer" 
  | "staff" 
  | "location" 
  | "camera" 
  | "browser" 
  | "phoneDialer" 
  | "activeCall" 
  | "activeVideoCall" 
  | "smsChat" 
  | "settings" 
  | "music" 
  | "crashLogs"
  // NEW MODES:
  | "search"              // Global search across messages/contacts
  | "friends"             // Friends & contact management
  | "notificationSettings" // Notification preferences
  | "conferenceCall"      // Multi-party video calling
  | "locationSharing"     // Location sharing & nearby friends
  | "musicPlayer"         // Music integration player
  | "smartReplies"        // AI quick reply suggestions
  | "contactSuggestions"; // Contact auto-complete

// ==================== MESSAGE TYPES ====================

// Enhanced message type with new features:
export interface EnhancedChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
  
  // Message features
  readBy?: { userId: string; timestamp: Date }[];
  reactions?: { userId: string; emoji: string; timestamp: Date }[];
  screenshotAlertEnabled?: boolean;
  isTranslated?: boolean;
  originalLanguage?: string;
  translatedText?: string;
  
  // Media
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  
  // References
  replyToId?: string;
  editedAt?: Date;
}

// ==================== CONVERSATION TYPES ====================

export interface EnhancedConversation {
  id: string;
  participantIds: string[];
  messages: EnhancedChatMessage[];
  lastMessage?: EnhancedChatMessage;
  lastMessageTime?: Date;
  unreadCount: number;
  isPinned?: boolean;
  isMuted?: boolean;
  isArchived?: boolean;
  createdAt: Date;
}

// ==================== NOTIFICATION TYPES ====================

export interface SmartNotification {
  id: string;
  title: string;
  body: string;
  timestamp: Date;
  contactId?: string;
  type: 'message' | 'call' | 'system' | 'friend-request';
  isBatched?: boolean;
  actionUrl?: string;
}

// ==================== CALL TYPES ====================

export interface EnhancedCallParticipant {
  userId: string;
  username: string;
  profileImage?: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'on-hold';
  audioEnabled: boolean;
  videoEnabled: boolean;
  isMuted: boolean;
  joinedAt: Date;
  speakingTime?: number;
}

export interface EnhancedCallSession {
  id: string;
  type: 'individual' | 'conference' | 'group';
  initiatorId: string;
  participants: EnhancedCallParticipant[];
  startTime: Date;
  endTime?: Date;
  duration?: number;
  isRecording?: boolean;
  recordingUrl?: string;
  qualityMetrics?: {
    bandwidth: number;
    latency: number;
    packetLoss: number;
  };
}

// ==================== STATE MANAGEMENT TYPES ====================

/**
 * Update your main state interface to include:
 */
export interface CruzerAppState {
  // Existing
  calculatorMode: CalculatorMode;
  authToken?: string;
  userProfile?: UserProfile;
  
  // New state properties
  searchQuery: string;
  searchResults?: {
    messages: SearchableMessage[];
    contacts: SearchableContact[];
  };
  
  activeFriendRequests: FriendRequest[];
  friends: Friend[];
  blockedUsers: BlockedUser[];
  
  currentCallSession?: EnhancedCallSession;
  conferenceCallActive?: boolean;
  
  currentLocation?: LocationData;
  nearbyFriends: NearbyFriend[];
  
  currentMusicTrack?: MusicTrackInfo;
  musicPlaylists: Playlist[];
  
  notificationsQueue: SmartNotification[];
  typingIndicators: TypingIndicator[];
  
  showNotificationSettings: boolean;
  showSmartReplies: boolean;
  smartReplySuggestions: SmartReply[];
}

// ==================== CONTEXT TYPES ====================

/**
 * Recommended Context structure for managing new features:
 */
export interface CruzerContextValue {
  // User state
  currentUser: UserProfile | null;
  friends: Friend[];
  blockedUsers: BlockedUser[];
  
  // Messaging state
  conversations: EnhancedConversation[];
  activeConversation?: EnhancedConversation;
  messages: EnhancedChatMessage[];
  typingUsers: TypingIndicator[];
  
  // Notifications
  notifications: SmartNotification[];
  notificationPreferences: NotificationPreferences;
  
  // Calls
  activeCall?: EnhancedCallSession;
  callHistory: EnhancedCallSession[];
  
  // Location
  currentLocation?: LocationData;
  nearbyFriends: NearbyFriend[];
  locationHistory: LocationHistoryEntry[];
  
  // Music
  currentTrack?: MusicTrackInfo;
  playlists: Playlist[];
  listeningHistory: MusicTrackInfo[];
  
  // AI
  smartReplies: SmartReply[];
  predictedActions: PredictedAction[];
  
  // Methods
  sendMessage: (text: string) => Promise<void>;
  addFriend: (userId: string) => Promise<void>;
  startCall: (recipientId: string) => Promise<void>;
  startConferenceCall: (participantIds: string[]) => Promise<void>;
  shareLocation: (friendIds: string[], expiresInHours?: number) => Promise<void>;
  playTrack: (track: MusicTrackInfo) => Promise<void>;
  searchGlobally: (query: string) => Promise<void>;
}

// ==================== USAGE EXAMPLE ====================

/**
 * Example of using these types in your app:
 */

export const exampleStateUsage = `
  // In your main app state initialization:
  const [appState, setAppState] = useState<CruzerAppState>({
    calculatorMode: 'messages',
    searchQuery: '',
    activeFriendRequests: [],
    friends: [],
    blockedUsers: [],
    notificationsQueue: [],
    typingIndicators: [],
    nearbyFriends: [],
    musicPlaylists: [],
    showNotificationSettings: false,
    showSmartReplies: false,
    smartReplySuggestions: [],
  });

  // Handle search mode
  const handleSearchMode = () => {
    setAppState(prev => ({
      ...prev,
      calculatorMode: 'search',
      searchQuery: '',
    }));
  };

  // Handle friend request
  const handleReceiveFriendRequest = (request: FriendRequest) => {
    setAppState(prev => ({
      ...prev,
      activeFriendRequests: [...prev.activeFriendRequests, request],
    }));
  };

  // Handle new message with enhanced features
  const handleNewMessage = (message: EnhancedChatMessage) => {
    setAppState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
    
    // Generate smart replies
    aiFeaturesService.generateSmartReplies(
      message.text,
      message.conversationId
    ).then(replies => {
      setAppState(prev => ({
        ...prev,
        smartReplySuggestions: replies,
        showSmartReplies: true,
      }));
    });
  };
`;

// ==================== HOOK TYPES ====================

/**
 * Custom hooks you might want to create:
 */

// Hook for search functionality
export interface UseSearchResult {
  query: string;
  results: {
    messages: SearchableMessage[];
    contacts: SearchableContact[];
  };
  recentContacts: SearchableContact[];
  search: (query: string) => Promise<void>;
  clearSearch: () => void;
}

// Hook for notifications
export interface UseNotificationsResult {
  notifications: SmartNotification[];
  preferences: NotificationPreferences;
  sendNotification: (
    title: string,
    body: string,
    contactId?: string
  ) => Promise<void>;
  updatePreferences: (
    prefs: Partial<NotificationPreferences>
  ) => Promise<void>;
}

// Hook for location sharing
export interface UseLocationSharingResult {
  currentLocation: LocationData | null;
  nearbyFriends: NearbyFriend[];
  locationHistory: LocationHistoryEntry[];
  startSharing: (expiresInHours?: number) => Promise<void>;
  stopSharing: () => Promise<void>;
  updateLocation: () => Promise<void>;
}

// Hook for music integration
export interface UseMusicIntegrationResult {
  currentTrack: MusicTrackInfo | null;
  playlists: Playlist[];
  isPlaying: boolean;
  listeningHistory: MusicTrackInfo[];
  play: (track: MusicTrackInfo) => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  shareTrack: (track: MusicTrackInfo, friendIds: string[]) => Promise<void>;
}

// Hook for AI features
export interface UseAIFeaturesResult {
  smartReplies: SmartReply[];
  predictedAction?: PredictedAction;
  isTranslating: boolean;
  generateSmartReplies: (message: string) => Promise<SmartReply[]>;
  translate: (text: string, targetLanguage: string) => Promise<string>;
  predictNextAction: () => Promise<PredictedAction>;
}
