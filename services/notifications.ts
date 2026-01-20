import * as Notifications from 'expo-notifications';

export async function configureStealthNotifications() {
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
  await Notifications.setNotificationChannelAsync('stealth', {
    name: 'Stealth',
    importance: Notifications.AndroidImportance.LOW,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
    showBadge: false,
    sound: undefined,
  });
}

export async function sendStealthNotification(title: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body: 'New activity',
      data: {},
      priority: Notifications.AndroidNotificationPriority.MIN,
    },
    trigger: null,
  });
}
