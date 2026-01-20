# Cruzer App - New Features Documentation

## Overview
This document outlines all the new features implemented to enhance user experience and engagement.

## 1. Search & Discovery

### Quick Search
- **File**: `services/search.ts`
- **Component**: `components/SearchScreen.tsx`
- **Features**:
  - Search across all messages, contacts, and conversations
  - Auto-suggest contacts as user types
  - Recent contacts quick access
  - Search history and indexing

### Usage
```typescript
import { searchService } from '../services/search';

// Add contact to index
searchService.addContact({
  id: 'user-1',
  name: 'John Doe',
  phoneNumber: '+1234567890',
  email: 'john@example.com',
});

// Search
const results = searchService.globalSearch('John');

// Get suggestions
const suggestions = searchService.suggestContacts('Jo');

// Get recent
const recent = searchService.getRecentContacts(10);
```

---

## 2. Advanced Notifications

### Smart Notification Batching
- **File**: `services/notificationsV2.ts`
- **Component**: `components/NotificationSettings.tsx`
- **Features**:
  - Intelligently batch multiple notifications
  - Configurable batch delay (default 5 seconds)
  - Do Not Disturb with custom schedules
  - Per-contact muting preferences

### Features
- **Global Settings**:
  - Sound enable/disable
  - Vibration enable/disable
  - Smart batching toggle
  - Batch delay customization

- **DND Scheduling**:
  - Set quiet hours (e.g., 22:00 to 08:00)
  - Works across midnight
  - Automatically suppress notifications

- **Per-Contact Settings**:
  - Mute individual contacts
  - Custom sounds per contact
  - Custom vibration patterns

### Usage
```typescript
import { notificationServiceV2 } from '../services/notificationsV2';

// Send notification
await notificationServiceV2.sendNotification(
  'Message Title',
  'Message body',
  'contact-id' // optional contact ID
);

// Set DND
await notificationServiceV2.setDndSchedule('22:00', '08:00', true);

// Mute contact
await notificationServiceV2.setContactMuted('contact-id', 'John Doe', true);

// Get preferences
const prefs = notificationServiceV2.getGlobalPreferences();
```

---

## 3. Message Features

### Read Receipts
- Show when messages are read
- Toggle read receipt visibility
- Privacy control for users

### Message Reactions
- Add emoji reactions to messages
- Pre-defined emoji set (10 common emojis)
- Remove reactions

### Typing Indicators
- Real-time typing status
- Auto-clear after 3 seconds
- Show multiple users typing

### Screenshot Alerts
- Optional screenshot detection
- Notify sender when message is screenshotted
- Toggle per-message

### Message Search
- Search within conversations
- Filter by sender, date, or keyword
- Quick access to specific messages

### Usage
```typescript
import { messageFeaturesService } from '../services/messageFeatures';

// Add reaction
messageFeaturesService.addReaction('message-id', 'user-id', '👍');

// Mark as read
messageFeaturesService.markAsRead('message-id', 'user-id');

// Set typing
messageFeaturesService.setTyping('user-id', 'John', 'conv-id', true);

// Get typing users
const typingUsers = messageFeaturesService.getTypingUsers('conv-id');

// Get emojis
const emojis = messageFeaturesService.getReactionEmojis();
```

---

## 4. Friends & Contact Management

### Friend Requests
- Send friend requests
- Accept/reject requests
- View pending requests
- Sent requests tracking

### Friends List
- View all friends
- Mark favorites
- Quick actions (call, message, share)
- Friend status indicators (online, busy, away, offline)

### Blocking
- Block users
- View blocked list
- Unblock anytime
- Block reason tracking

### User Profiles
- Username and profile image
- Status and last seen
- Email and phone
- Bio/description

### Usage
```typescript
import { friendsService } from '../services/friends';

// Send friend request
const request = friendsService.sendFriendRequest(userProfile);

// Get pending requests
const requests = friendsService.getPendingRequests();

// Accept request
friendsService.acceptFriendRequest('request-id');

// Get friends
const friends = friendsService.getFriends();

// Block user
friendsService.blockUser('user-id', 'Username', 'Reason');

// Get blocked users
const blocked = friendsService.getBlockedUsers();
```

---

## 5. Location Sharing

### Real-time Location Sharing
- Share current location with friends
- Request location access
- Time-limited sharing (optional expiration)
- Precise or approximate location sharing

### Location History
- Track location history (30-day limit)
- View past locations
- Accuracy indicators

### Nearby Friends
- Find friends within radius (default 5km)
- Distance calculation
- Map visualization support
- Real-time updates

### Privacy Controls
- Grant/revoke location access per friend
- Expiring permissions
- Granular privacy settings

### Usage
```typescript
import { locationSharingService } from '../services/locationSharing';

// Update current location
const location = await locationSharingService.updateCurrentLocation();

// Request to share with friend
locationSharingService.requestLocationShare('friend-id', 'Friend Name');

// Allow location share (1 hour)
locationSharingService.allowLocationShare('friend-id', 1);

// Get nearby friends (5km)
const nearby = locationSharingService.getNearbyFriends(5000);

// Get location history
const history = locationSharingService.getLocationHistory(100);
```

---

## 6. Music Integration

### Spotify Integration
- Connect Spotify account
- Fetch user playlists
- Share current track
- Now playing status

### Apple Music Integration
- Connect Apple Music account
- Access library
- Share playlists
- Music status synchronization

### YouTube Music Integration
- Connect YouTube account
- Fetch playlists
- Integration with music player

### Music Recognition (Shazam)
- Identify songs from audio
- Save recognized tracks
- Quick sharing

### Playlist Management
- Create playlists
- Share playlists with friends
- Pull playlists from multiple sources
- Listening history

### Usage
```typescript
import { musicIntegrationService } from '../services/musicIntegration';

// Connect services
await musicIntegrationService.connectSpotify(token, userId);
await musicIntegrationService.connectAppleMusic(token, userId);
await musicIntegrationService.connectYouTubeMusic(token, userId);

// Fetch playlists
const spotifyPlaylists = await musicIntegrationService.fetchSpotifyPlaylists();
const applePlaylists = await musicIntegrationService.fetchAppleMusicPlaylists();
const ytPlaylists = await musicIntegrationService.fetchYouTubePlaylists();

// Set current track
musicIntegrationService.setCurrentTrack(trackInfo);

// Music recognition
const track = await musicIntegrationService.recognizeTrack(audioData);

// Share playlist
musicIntegrationService.sharePlaylist('playlist-id', ['user-id-1', 'user-id-2']);

// Listening history
const history = musicIntegrationService.getListeningHistory(50);
```

---

## 7. AI Features

### Smart Replies
- AI-generated quick replies
- Context-aware suggestions
- Confidence scoring
- Natural language generation

### Predictive Actions
- Predict likely next action (call/message/share)
- Behavior pattern analysis
- Contextual suggestions
- Confidence-based ranking

### Real-time Translation
- Translate messages between languages
- Language auto-detection
- Multiple language support
- Free translation API (with Google Translate option)

### Conversation Context
- Maintain conversation context
- Smart reply generation based on history
- Context-aware suggestions

### Usage
```typescript
import { aiFeaturesService } from '../services/aiFeatures';

// Generate smart replies
const replies = await aiFeaturesService.generateSmartReplies(
  'Hello, how are you?',
  'conversation-id'
);

// Predict next action
const action = await aiFeaturesService.predictNextAction(
  'user-id',
  recentActivity,
  friends
);

// Translate message
const translation = await aiFeaturesService.translateMessage(
  'Hello', 
  'es' // Spanish
);

// Detect language
const language = await aiFeaturesService.detectLanguage('Hola mundo');

// Update conversation context
aiFeaturesService.updateConversationContext('conv-id', message);
```

---

## 8. Conference Calling

### Multi-party Calls
- Support up to 8 participants (configurable)
- Add/remove participants during call
- Automatic participant management

### Media Controls
- Toggle audio on/off per participant
- Toggle video on/off
- Mute/unmute
- Real-time media state tracking

### Call Management
- Initiate conference calls
- Join/leave tracking
- Call duration calculation
- Call recording (optional)

### Participant Management
- Display all participants
- Show participant status
- Track connection time
- Display participant count

### Usage
```typescript
import { conferenceCallService } from '../services/conferenceCall';

// Initiate conference
const call = conferenceCallService.initiateConferenceCall(
  'initiator-id',
  ['participant-1', 'participant-2'],
  8 // max participants
);

// Add participant
conferenceCallService.addParticipant('call-id', 'new-user-id', 'Username');

// Toggle audio
conferenceCallService.toggleAudio('call-id', 'user-id', true);

// End call
conferenceCallService.endCall('call-id');

// Get active calls
const calls = conferenceCallService.getAllActiveCalls();
```

---

## 9. UI Components

### FriendsAddScreen
**Location**: `components/FriendsAddScreen.tsx`

Features:
- Friends list with status
- Favorite friends
- Friend requests tab
- User search tab
- Blocked users management
- Quick actions (call, message, block)
- Profile images and user info

### SearchScreen
**Location**: `components/SearchScreen.tsx`

Features:
- Real-time search
- Recent contacts display
- Contact suggestions
- Message search results
- Quick access actions
- Empty states

### NotificationSettings
**Location**: `components/NotificationSettings.tsx`

Features:
- Global notification settings
- DND scheduling
- Per-contact preferences
- Sound and vibration controls
- Smart batching configuration
- Advanced settings

---

## 10. Integration Steps

See `INTEGRATION_GUIDE.md` for detailed integration instructions.

### Quick Start
1. Import all services
2. Add new modes to `CalculatorMode` type
3. Display UI components for each feature
4. Call service methods as needed
5. Listen for callbacks/observers for real-time updates

### Environment Variables
Add to `.env` or `env.example`:
```
EXPO_PUBLIC_GROQ_API_KEY=your_groq_key
EXPO_PUBLIC_SHAZAM_API_KEY=your_shazam_key
EXPO_PUBLIC_GOOGLE_TRANSLATE_API_KEY=your_google_key
```

---

## 11. Data Persistence

All services use AsyncStorage for local persistence:
- Search index
- Notification preferences
- Message features (reactions, read receipts)
- Friends and contacts
- Location history
- Music playlists and connections
- Blocked users

---

## 12. Performance Considerations

- Search index kept in memory with periodic persistence
- Typing indicators auto-clear after 3 seconds
- Location history limited to 30 days
- Listening history limited to 500 tracks
- Message conversation context limited to 10 messages
- Notification batching configurable (default 5 seconds)

---

## 13. Privacy & Security

- Location sharing with granular controls
- Screenshot alerts for sensitive content
- Blocking system for harassment prevention
- Read receipt toggle for privacy
- DND respects user preferences
- Per-contact notification settings
- Encrypted storage for sensitive data

---

## 14. Future Enhancements

- End-to-end encrypted messaging for sensitive chats
- Advanced AI with GPT-4 integration
- Voice commands for hands-free operation
- Photo/video sharing with privacy options
- Group management features
- Call analytics and history
- Playlist recommendations based on listening
- Mood-based emoji suggestions
- Advanced language translation with context

---

## Support & Issues

For implementation questions, refer to:
1. Service files for detailed method documentation
2. Component files for UI integration
3. INTEGRATION_GUIDE.md for step-by-step instructions
4. Example code in service comments
