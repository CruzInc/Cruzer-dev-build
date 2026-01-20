// Integration Guide - How to use all the new features in the main app

/**
 * INTEGRATION CHECKLIST FOR MAIN APP (app/index.tsx)
 * 
 * Import all services and components:
 * 
 * import { searchService } from '../services/search';
 * import { notificationServiceV2 } from '../services/notificationsV2';
 * import { messageFeaturesService } from '../services/messageFeatures';
 * import { friendsService } from '../services/friends';
 * import { locationSharingService } from '../services/locationSharing';
 * import { musicIntegrationService } from '../services/musicIntegration';
 * import { aiFeaturesService } from '../services/aiFeatures';
 * import { conferenceCallService } from '../services/conferenceCall';
 * import { FriendsAddScreen } from '../components/FriendsAddScreen';
 * import { SearchScreen } from '../components/SearchScreen';
 * import { NotificationSettings } from '../components/NotificationSettings';
 * 
 * IMPLEMENTATION GUIDE:
 * 
 * 1. SEARCH FUNCTIONALITY
 *    - Add 'search' to CalculatorMode type
 *    - When showing messages, call: searchService.addMessage(message)
 *    - When showing contacts, call: searchService.addContact(contact)
 *    - Use SearchScreen component in search mode
 *    
 * 2. NOTIFICATIONS
 *    - Replace old notification calls with notificationServiceV2.sendNotification()
 *    - Example: await notificationServiceV2.sendNotification(title, body, contactId)
 *    - Add NotificationSettings component to settings view
 *    
 * 3. MESSAGE REACTIONS & FEATURES
 *    - Call messageFeaturesService.addReaction(messageId, userId, emoji)
 *    - Call messageFeaturesService.markAsRead(messageId, userId)
 *    - Call messageFeaturesService.setTyping(userId, userName, conversationId, isTyping)
 *    - Display typing indicators: messageFeaturesService.getTypingUsers(conversationId)
 *    
 * 4. FRIENDS MANAGEMENT
 *    - Add 'friends' to CalculatorMode type
 *    - Use FriendsAddScreen component for friend management
 *    - Call friendsService methods for friend operations
 *    - Display friend status updates in real-time
 *    
 * 5. LOCATION SHARING
 *    - Add 'location' to CalculatorMode type for map view
 *    - Call locationSharingService.updateCurrentLocation() periodically
 *    - Call locationSharingService.allowLocationShare(userId) for sharing permission
 *    - Display nearby friends with getNearbyFriends()
 *    
 * 6. MUSIC INTEGRATION
 *    - Add 'music' mode for music player
 *    - Call musicIntegrationService.connectSpotify/Apple/YouTube
 *    - Use fetchSpotifyPlaylists(), fetchAppleMusicPlaylists(), etc.
 *    - Display current playing track with getCurrentTrack()
 *    
 * 7. AI FEATURES
 *    - Add smart replies to message input: aiFeaturesService.generateSmartReplies()
 *    - Show translation option: aiFeaturesService.translateMessage()
 *    - Suggest next actions: aiFeaturesService.predictNextAction()
 *    
 * 8. CONFERENCE CALLS
 *    - Replace single call mode with conference call support
 *    - Call conferenceCallService.initiateConferenceCall()
 *    - Add participants dynamically with addParticipant()
 *    - Display participant list and manage media
 *    
 * 9. TYPING INDICATORS
 *    - Show typing indicator when user types
 *    - Call messageFeaturesService.setTyping(userId, userName, conversationId, true)
 *    - Display indicator above message input using getTypingUsers()
 * 
 * 10. CONTACT SUGGESTIONS
 *     - Use searchService.suggestContacts(query) while user types
 *     - Display autocomplete suggestions below input
 *     - Call searchService.getRecentContacts() for quick access
 */

// Example: Integrating Search into existing messages
export const exampleSearchIntegration = `
  // In your message handler:
  const handleMessageReceived = (message: ChatMessage) => {
    // ... existing message handling
    
    // Add to search index
    searchService.addMessage({
      id: message.id,
      conversationId: conversationId,
      text: message.content,
      timestamp: new Date(),
      sender: message.senderName,
    });
  };

  // When showing search UI:
  const handleShowSearch = () => {
    setCalculatorMode('search');
  };
`;

// Example: Integrating Friend Requests
export const exampleFriendsIntegration = `
  // When user taps on a contact:
  const handleAddFriend = (userProfile: UserProfile) => {
    const request = friendsService.sendFriendRequest(userProfile);
    notificationServiceV2.sendNotification(
      'Friend Request Sent',
      \`You sent a friend request to \${userProfile.username}\`
    );
  };

  // When receiving friend request (from real-time service):
  const handleIncomingFriendRequest = (request: FriendRequest) => {
    notificationServiceV2.sendNotification(
      'Friend Request',
      \`\${request.from.username} sent you a friend request\`,
      request.from.userId
    );
  };
`;

// Example: Integrating Message Reactions
export const exampleReactionsIntegration = `
  // When user long-presses a message:
  const handleShowReactions = (messageId: string) => {
    const emojis = messageFeaturesService.getReactionEmojis();
    // Show emoji picker
    setSelectedEmojis(emojis);
  };

  // When user taps an emoji:
  const handleAddReaction = (messageId: string, emoji: string) => {
    messageFeaturesService.addReaction(messageId, currentUserId, emoji);
  };

  // When rendering message, show reactions:
  const reactions = messageFeaturesService.getMessage(messageId)?.reactions;
`;

// Example: Integrating Location Sharing
export const exampleLocationIntegration = `
  // Start sharing location:
  const handleStartLocationShare = async () => {
    const location = await locationSharingService.updateCurrentLocation();
    
    // Ask friend for permission to see their location
    friendIds.forEach(friendId => {
      locationSharingService.requestLocationShare(friendId, friendName);
    });
  };

  // Show nearby friends:
  const nearby = locationSharingService.getNearbyFriends(5000); // 5km radius
  // Display on map
`;

// Example: Integrating Smart Replies
export const exampleSmartRepliesIntegration = `
  // When message is received:
  const handleMessageReceived = async (message: ChatMessage) => {
    const replies = await aiFeaturesService.generateSmartReplies(
      message.content,
      conversationId
    );
    
    // Display quick reply buttons
    setQuickReplies(replies);
  };

  // When user taps quick reply:
  const handleQuickReply = (reply: SmartReply) => {
    sendMessage(reply.text);
    aiFeaturesService.updateConversationContext(conversationId, {
      role: 'assistant',
      content: reply.text,
    });
  };
`;

// Example: Integrating Conference Calls
export const exampleConferenceCallIntegration = `
  // Start conference call:
  const handleStartConferenceCall = (participantIds: string[]) => {
    const call = conferenceCallService.initiateConferenceCall(
      currentUserId,
      participantIds,
      8 // max participants
    );
    
    setActiveCall(call);
    setCalculatorMode('activeCall'); // or 'activeVideoCall'
  };

  // Add participant during call:
  const handleAddParticipant = (userId: string) => {
    conferenceCallService.addParticipant(activeCall.id, userId, username);
  };

  // Toggle participant audio:
  const handleToggleAudio = (userId: string) => {
    conferenceCallService.toggleAudio(activeCall.id, userId, !isAudioEnabled);
  };
`;

export const integrationNotes = `
  IMPORTANT NOTES:
  
  1. All services persist data to AsyncStorage automatically
  
  2. For real-time features (typing, online status, friend requests),
     integrate with your realtime service:
     - Use realtimeService.on() for incoming events
     - Update services accordingly
  
  3. For music features, users must authenticate with Spotify/Apple/YouTube
     - Handle OAuth flow for each service
     - Store tokens securely in encrypted storage
  
  4. Location sharing requires location permissions
     - Handle both iOS and Android permission requests
     - Respect user privacy settings
  
  5. AI features require API keys (Groq, Google Translate, Shazam)
     - Add to environment variables
     - Have fallbacks for API failures
  
  6. Conference calls require WebRTC integration
     - Use existing signalWireService as base
     - Extend for multi-party support
  
  7. Friend requests integrate with your backend
     - Sync with server when online
     - Queue requests locally if offline
  
  8. All services emit callbacks/observers for real-time updates
     - Listen for changes to update UI
     - Unsubscribe in useEffect cleanup
`;
