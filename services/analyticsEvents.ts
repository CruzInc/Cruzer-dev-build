/**
 * Predefined Analytics Events
 * Centralized event definitions for tracking
 */

export const AnalyticsEvents = {
  // App Lifecycle
  APP_LAUNCH: 'app_launch',
  APP_BACKGROUND: 'app_background',
  APP_FOREGROUND: 'app_foreground',
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',

  // Navigation
  SCREEN_VIEW: 'screen_view',
  NAVIGATION_COMPLETE: 'navigation_complete',

  // Authentication
  LOGIN_ATTEMPT: 'login_attempt',
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILURE: 'login_failure',
  LOGOUT: 'logout',
  SIGNUP: 'signup',

  // Messaging
  MESSAGE_SENT: 'message_sent',
  MESSAGE_RECEIVED: 'message_received',
  MESSAGE_DELETED: 'message_deleted',
  SEARCH_MESSAGE: 'search_message',

  // Friends
  FRIEND_ADDED: 'friend_added',
  FRIEND_REMOVED: 'friend_removed',
  FRIEND_REQUEST_SENT: 'friend_request_sent',
  FRIEND_REQUEST_ACCEPTED: 'friend_request_accepted',

  // Location
  LOCATION_SHARED: 'location_shared',
  LOCATION_REQUEST: 'location_request',
  LOCATION_PERMISSION_GRANTED: 'location_permission_granted',
  LOCATION_PERMISSION_DENIED: 'location_permission_denied',

  // Notifications
  NOTIFICATION_RECEIVED: 'notification_received',
  NOTIFICATION_OPENED: 'notification_opened',
  NOTIFICATION_DISMISSED: 'notification_dismissed',
  NOTIFICATION_SETTINGS_CHANGED: 'notification_settings_changed',

  // Calls
  CALL_INITIATED: 'call_initiated',
  CALL_CONNECTED: 'call_connected',
  CALL_ENDED: 'call_ended',
  CALL_MISSED: 'call_missed',
  CONFERENCE_CALL_STARTED: 'conference_call_started',

  // Media
  MUSIC_PLAYED: 'music_played',
  MUSIC_PAUSED: 'music_paused',
  PHOTO_SHARED: 'photo_shared',
  VIDEO_SHARED: 'video_shared',

  // Search
  SEARCH_PERFORMED: 'search_performed',
  SEARCH_RESULT_CLICKED: 'search_result_clicked',

  // Settings
  SETTINGS_CHANGED: 'settings_changed',
  PRIVACY_SETTING_CHANGED: 'privacy_setting_changed',

  // Errors
  RUNTIME_ERROR: 'runtime_error',
  CRASH: 'crash',
  NETWORK_ERROR: 'network_error',

  // Performance
  FEATURE_LOAD_TIME: 'feature_load_time',
  API_CALL_DURATION: 'api_call_duration',
  SYNC_DURATION: 'sync_duration',

  // Premium/Subscription
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_UPGRADED: 'subscription_upgraded',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',

  // Device Features
  CAMERA_USED: 'camera_used',
  MICROPHONE_USED: 'microphone_used',
  CONTACTS_ACCESSED: 'contacts_accessed',
};

/**
 * Screen names for consistent tracking
 */
export const AnalyticsScreens = {
  HOME: 'Home',
  MESSAGES: 'Messages',
  FRIENDS: 'Friends',
  SETTINGS: 'Settings',
  PROFILE: 'Profile',
  NOTIFICATIONS: 'Notifications',
  LOCATION: 'Location',
  CALLS: 'Calls',
  SEARCH: 'Search',
  DEVICE_CHECKER: 'DeviceChecker',
};

/**
 * Helper function to build event metadata
 */
export function buildEventMetadata(data: Record<string, any>) {
  return {
    ...data,
    timestamp: new Date().toISOString(),
  };
}
