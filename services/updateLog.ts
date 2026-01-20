// Update Log data structure and display component
export interface UpdateEntry {
  version: string;
  date: string;
  title: string;
  features: string[];
  bugFixes?: string[];
  notes?: string;
}

export const updateLog: UpdateEntry[] = [
  {
    version: "1.0.0",
    date: "January 20, 2026",
    title: "Foundation Release - Full Feature Launch",
    features: [
      "Calculator application with scientific functions",
      "Advanced messaging system with contacts and effects",
      "AI Chat assistant (Cruz's Helper) with Groq API",
      "Phone dialer with call logs and duration tracking",
      "SMS/Text messaging with conversation management",
      "Location sharing with real-time updates and maps",
      "Camera with photo and video capture",
      "Web browser with URL history and navigation",
      "Music player with search and playlist management",
      "User authentication with Google OAuth",
      "Profile management with customization",
      "Account security with lock codes",
      "Comprehensive settings panel",
      "App information with update log",
      "Developer panel with device capabilities",
      "Staff administration panel (hidden)",
      "Crash logging and error tracking",
      "Message effects with animations",
      "Location visibility controls",
      "Video call support",
      "Message editing and deletion",
      "Contact management and import",
      "Responsive UI for all screen sizes",
      "Dark mode throughout",
    ],
    bugFixes: [
      "Fixed startup crashes on unsupported devices",
      "Fixed notification permission handling on web",
      "Fixed secure storage fallback for web platform",
      "Fixed accelerometer availability on simulators",
      "Fixed platform compatibility checks",
      "Fixed memory leaks in message handling",
      "Fixed location permission requests",
    ],
    notes: "Beta release with all core features implemented. VIP subscription coming soon.",
  },
];

export const disabledFeaturesPerPlatform = {
  web: [
    "Notifications (no native notification API)",
    "Secure Storage (no keychain access)",
    "Accelerometer (no hardware sensors)",
    "Camera (limited support)",
    "Microphone (limited support)",
    "Contacts (no device contact access)",
    "Haptics (no vibration feedback)",
  ],
  simulator: [
    "Accelerometer (sensors not emulated)",
  ],
  oldIOS: [
    "⚠️ Some features may not work on iOS < 14",
  ],
  oldAndroid: [
    "⚠️ Some features may not work on Android < 10",
  ],
};

export function getDisabledFeaturesMessage(os: string, osVersion: string | number, isSimulator: boolean): string[] {
  const disabled: string[] = [];

  if (os === "web") {
    disabled.push(...disabledFeaturesPerPlatform.web);
  } else if (isSimulator && os !== "web") {
    disabled.push(...disabledFeaturesPerPlatform.simulator);
  }

  if (os === "ios") {
    const version = parseInt(osVersion.toString().split(".")[0]);
    if (version < 14) {
      disabled.push(...disabledFeaturesPerPlatform.oldIOS);
    }
  } else if (os === "android") {
    const version = parseInt(osVersion.toString());
    if (version < 10) {
      disabled.push(...disabledFeaturesPerPlatform.oldAndroid);
    }
  }

  return disabled;
}
