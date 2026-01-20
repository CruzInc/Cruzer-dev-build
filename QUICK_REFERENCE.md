// Quick Reference Guide - Copy/Paste Code Snippets

## Quick Import Templates

```typescript
// Copy all these imports to your main app file:

import { searchService, SearchableMessage, SearchableContact } from '../services/search';
import { notificationServiceV2, NotificationPreferences } from '../services/notificationsV2';
import { messageFeaturesService, MessageReaction, TypingIndicator } from '../services/messageFeatures';
import { friendsService, Friend, FriendRequest } from '../services/friends';
import { locationSharingService, LocationData, NearbyFriend } from '../services/locationSharing';
import { musicIntegrationService, Playlist, MusicTrackInfo } from '../services/musicIntegration';
import { aiFeaturesService, SmartReply, PredictedAction } from '../services/aiFeatures';
import { conferenceCallService, ConferenceCall } from '../services/conferenceCall';

import { FriendsAddScreen } from '../components/FriendsAddScreen';
import { SearchScreen } from '../components/SearchScreen';
import { NotificationSettings } from '../components/NotificationSettings';
```

---

## Common Operations Cheat Sheet

### Search Service
```typescript
// Add to index
searchService.addContact({ id, name, phoneNumber, email });
searchService.addMessage({ id, conversationId, text, timestamp, sender });

// Search
const results = searchService.globalSearch('query');
const suggestions = searchService.suggestContacts('Jo');
const recent = searchService.getRecentContacts(10);

// Clear
await searchService.clearIndex();
```

### Notification Service V2
```typescript
// Send notification
await notificationServiceV2.sendNotification('Title', 'Body', 'contact-id');

// DND
await notificationServiceV2.setDndSchedule('22:00', '08:00', true);

// Per-contact
await notificationServiceV2.setContactMuted('contact-id', 'Name', true);

// Get preferences
const prefs = notificationServiceV2.getGlobalPreferences();
```

### Message Features Service
```typescript
// Reactions
messageFeaturesService.addReaction('msg-id', 'user-id', '👍');
messageFeaturesService.removeReaction('msg-id', 'user-id', '👍');

// Read receipts
messageFeaturesService.markAsRead('msg-id', 'user-id');
messageFeaturesService.setReadReceiptEnabled(true);

// Typing
messageFeaturesService.setTyping('user-id', 'John', 'conv-id', true);
const typing = messageFeaturesService.getTypingUsers('conv-id');

// Emojis
const emojis = messageFeaturesService.getReactionEmojis();
```

### Friends Service
```typescript
// Request
const request = friendsService.sendFriendRequest(userProfile);
const pending = friendsService.getPendingRequests();

// Accept/reject
friendsService.acceptFriendRequest('request-id');
friendsService.rejectFriendRequest('request-id');

// Friends list
const friends = friendsService.getFriends();
friendsService.removeFriend('user-id');

// Favorites
friendsService.setFavoriteFriend('user-id', true);
const favorites = friendsService.getFavoriteFriends();

// Blocking
friendsService.blockUser('user-id', 'Username', 'Reason');
friendsService.unblockUser('user-id');
const blocked = friendsService.getBlockedUsers();

// Status
friendsService.setUserStatus('online' | 'busy' | 'away' | 'offline');
friendsService.updateFriendStatus('user-id', 'online');
```

### Location Sharing Service
```typescript
// Location
const location = await locationSharingService.updateCurrentLocation();
const current = locationSharingService.getCurrentLocation();

// History
const history = locationSharingService.getLocationHistory(100);

// Sharing
locationSharingService.requestLocationShare('user-id', 'Username');
locationSharingService.allowLocationShare('user-id', 1); // 1 hour
locationSharingService.revokeLocationShare('user-id');

// Nearby
const nearby = locationSharingService.getNearbyFriends(5000); // 5km
```

### Music Integration Service
```typescript
// Connect
await musicIntegrationService.connectSpotify(token, userId);
await musicIntegrationService.connectAppleMusic(token, userId);
await musicIntegrationService.connectYouTubeMusic(token, userId);

// Playlists
const spotifyPlayl = await musicIntegrationService.fetchSpotifyPlaylists();
const applePlaylists = await musicIntegrationService.fetchAppleMusicPlaylists();
const ytPlaylists = await musicIntegrationService.fetchYouTubePlaylists();

// Track
musicIntegrationService.setCurrentTrack(trackInfo);
const track = musicIntegrationService.getCurrentTrack();

// Recognition
const recognized = await musicIntegrationService.recognizeTrack(audioData);

// Share
musicIntegrationService.sharePlaylist('playlist-id', ['user-1', 'user-2']);

// History
const history = musicIntegrationService.getListeningHistory(50);
```

### AI Features Service
```typescript
// Smart replies
const replies = await aiFeaturesService.generateSmartReplies(message, 'conv-id');

// Prediction
const action = await aiFeaturesService.predictNextAction('user-id', activity, friends);

// Translation
const translation = await aiFeaturesService.translateMessage('Hello', 'es');

// Detection
const language = await aiFeaturesService.detectLanguage('Hola');

// Context
aiFeaturesService.updateConversationContext('conv-id', message);
const context = aiFeaturesService.getConversationContext('conv-id');
```

### Conference Call Service
```typescript
// Initiate
const call = conferenceCallService.initiateConferenceCall('user-id', ['p1', 'p2'], 8);

// Participants
conferenceCallService.addParticipant('call-id', 'user-id', 'Username');
conferenceCallService.removeParticipant('call-id', 'user-id');
conferenceCallService.setParticipantStatus('call-id', 'user-id', 'connected');

// Media
conferenceCallService.toggleAudio('call-id', 'user-id', true);
conferenceCallService.toggleVideo('call-id', 'user-id', true);
conferenceCallService.toggleMute('call-id', 'user-id', false);

// Lifecycle
const call = conferenceCallService.getActiveCall('call-id');
conferenceCallService.endCall('call-id');

// Recording
conferenceCallService.startRecording('call-id');
conferenceCallService.stopRecording('call-id', 'recording-url');
```

---

## Component Usage

### FriendsAddScreen
```typescript
<FriendsAddScreen
  onClose={() => setCalculatorMode('messages')}
  currentUserId="user-id"
/>
```

### SearchScreen
```typescript
<SearchScreen
  onClose={() => setCalculatorMode('messages')}
  onSelectContact={(contact) => startChat(contact)}
  onSelectMessage={(message) => jumpToMessage(message)}
/>
```

### NotificationSettings
```typescript
<NotificationSettings
  onClose={() => setCalculatorMode('settings')}
/>
```

---

## Common Patterns

### Pattern 1: Add Message to Search Index
```typescript
const handleMessageReceived = (message: ChatMessage) => {
  searchService.addMessage({
    id: message.id,
    conversationId: conversationId,
    text: message.content,
    timestamp: new Date(),
    sender: message.senderName,
  });
};
```

### Pattern 2: Show Smart Replies
```typescript
const handleMessageReceived = async (message: ChatMessage) => {
  const replies = await aiFeaturesService.generateSmartReplies(
    message.content,
    conversationId
  );
  setQuickReplies(replies);
};

const handleQuickReply = (reply: SmartReply) => {
  sendMessage(reply.text);
};
```

### Pattern 3: Handle Typing Indicator
```typescript
const handleTextInput = (text: string) => {
  messageFeaturesService.setTyping(userId, userName, conversationId, text.length > 0);
};

// In message list:
const typingUsers = messageFeaturesService.getTypingUsers(conversationId);
{typingUsers.map(user => <Text>{user.userName} is typing...</Text>)}
```

### Pattern 4: Show Nearby Friends
```typescript
const handleStartLocationShare = async () => {
  await locationSharingService.updateCurrentLocation();
  const nearby = locationSharingService.getNearbyFriends(5000);
  setNearbyFriends(nearby);
  // Display on map
};
```

### Pattern 5: Start Conference Call
```typescript
const handleConferenceCall = (participantIds: string[]) => {
  const call = conferenceCallService.initiateConferenceCall(
    currentUserId,
    participantIds,
    8
  );
  setActiveCall(call);
  setCalculatorMode('conferenceCall');
};
```

---

## State Management Template

```typescript
const [appState, setAppState] = useState({
  // Search
  searchResults: { messages: [], contacts: [] },
  
  // Friends
  activeFriendRequests: [],
  friends: [],
  
  // Notifications
  notificationsQueue: [],
  notificationPrefs: notificationServiceV2.getGlobalPreferences(),
  
  // Messages
  typingIndicators: [],
  
  // Calls
  activeCall: null,
  
  // Location
  currentLocation: null,
  nearbyFriends: [],
  
  // Music
  currentTrack: null,
  playlists: [],
  
  // AI
  smartReplies: [],
});
```

---

## Error Handling Template

```typescript
// Safe wrapper for async operations
async function safeExecute<T>(
  operation: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error('Operation failed:', error);
    return fallback;
  }
}

// Usage
const friends = await safeExecute(
  () => friendsService.getFriends(),
  []
);
```

---

## Permission Checklist

Before using features, ensure you have these permissions:

```typescript
// Location Sharing
{
  "plugins": [
    ["expo-location", {
      "locationAlwaysAndWhenInUsePermissions": true
    }]
  ]
}

// Contacts
{
  "plugins": ["expo-contacts"]
}

// Camera (for music recognition)
{
  "plugins": ["expo-camera"]
}

// Microphone (for music recognition)
{
  "plugins": ["expo-av"]
}
```

---

## Environment Variables Template

```env
# Required for AI features
EXPO_PUBLIC_GROQ_API_KEY=sk_***
EXPO_PUBLIC_SHAZAM_API_KEY=***
EXPO_PUBLIC_GOOGLE_TRANSLATE_API_KEY=***

# Optional for OAuth flows
EXPO_PUBLIC_SPOTIFY_CLIENT_ID=***
EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET=***
EXPO_PUBLIC_APPLE_MUSIC_TOKEN=***
EXPO_PUBLIC_YOUTUBE_API_KEY=***

# Optional backend integration
EXPO_PUBLIC_API_BASE_URL=https://api.cruzer.app
EXPO_PUBLIC_REALTIME_URL=wss://realtime.cruzer.app
```

---

## Testing Checklist

- [ ] Search returns correct results
- [ ] Notifications batch correctly
- [ ] DND prevents notifications
- [ ] Reactions display correctly
- [ ] Typing indicators show/hide
- [ ] Friend requests work both ways
- [ ] Blocking prevents messages
- [ ] Location shares with permissions
- [ ] Music playlists load correctly
- [ ] Translations work for major languages
- [ ] Smart replies are contextual
- [ ] Conference calls with 2+ participants
- [ ] All data persists after restart
- [ ] No memory leaks with listeners

---

That's it! Happy coding! 🚀
