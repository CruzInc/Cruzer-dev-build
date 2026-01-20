import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function configureStealthNotifications() {
  try {
    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // Android: use minimal notification style (no content preview)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('stealth', {
        name: 'Stealth',
        importance: Notifications.AndroidImportance.LOW,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
        showBadge: false,
        sound: undefined,
      });
    }
  } catch (error) {
    console.warn('Failed to configure notifications:', error);
    throw error;
  }
}

export async function sendStealthNotification(title: string) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body: 'New activity',
        data: {},
        priority: Notifications.AndroidNotificationPriority.MIN,
      },
      trigger: null,
    });
  } catch (error) {
    console.warn('Failed to send notification:', error);
  }
}
