import { Platform, Dimensions, DeviceEventEmitter } from 'react-native';
import * as Application from 'expo-application';
import Constants from 'expo-constants';

// Try to import expo-device, but provide safe fallbacks
let Device: any = null;
try {
  Device = require('expo-device');
} catch (e) {
  console.warn('expo-device not available');
  Device = {
    modelName: null,
    deviceName: null,
    isDevice: null,
  };
}

export interface DeviceCapabilities {
  // Platform info
  os: 'ios' | 'android' | 'web';
  osVersion: string;
  deviceModel: string;
  deviceName: string;
  
  // Device hardware
  screenSize: 'phone' | 'tablet' | 'web';
  screenWidth: number;
  screenHeight: number;
  screenDiagonal: number;
  
  // Capabilities
  supportsNotifications: boolean;
  supportsSecureStorage: boolean;
  supportsAccelerometer: boolean;
  supportsLocation: boolean;
  supportsCamera: boolean;
  supportsMicrophone: boolean;
  supportsContacts: boolean;
  supportsAudio: boolean;
  supportsVideo: boolean;
  supportsFileSystem: boolean;
  supportsWebSocket: boolean;
  supportsHaptics: boolean;
  
  // Device info
  isSimulator: boolean;
  isEmulator: boolean;
  isTrustedDevice: boolean;
  
  // App info
  appVersion: string;
  appBuildNumber: string;
  
  // Warnings/issues
  warnings: string[];
  unsupportedFeatures: string[];
}

export interface FeatureFlags {
  enableNotifications: boolean;
  enableSecureStorage: boolean;
  enableAccelerometer: boolean;
  enableLocation: boolean;
  enableCamera: boolean;
  enableMicrophone: boolean;
  enableContacts: boolean;
  enableAudio: boolean;
  enableVideo: boolean;
  enableFileSystem: boolean;
  enableWebSocket: boolean;
  enableHaptics: boolean;
}

let cachedCapabilities: DeviceCapabilities | null = null;
let cachedFeatureFlags: FeatureFlags | null = null;

export async function getDeviceCapabilities(): Promise<DeviceCapabilities> {
  if (cachedCapabilities) {
    return cachedCapabilities;
  }

  try {
    const warnings: string[] = [];
    const unsupportedFeatures: string[] = [];

    // Get basic device info
    const os = Platform.OS as 'ios' | 'android' | 'web';
    const osVersion = Platform.Version?.toString() || 'unknown';
    const deviceModel = Device?.modelName || 'unknown';
    const deviceName = Device?.deviceName || 'unknown';
    const isSimulator = Device?.isDevice === false;
    const isEmulator = os === 'android' && isSimulator;
    const isTrustedDevice = Device?.isDevice === true;

    // Get screen dimensions
    const { width, height } = Dimensions.get('window');
    const screenDiagonal = Math.sqrt(width * width + height * height) / 160; // Convert to inches
    const screenSize = screenDiagonal > 6.5 ? 'tablet' : screenDiagonal < 3.5 ? 'phone' : 'tablet';

    // Determine capabilities based on platform
    const supportsNotifications = os !== 'web';
    const supportsSecureStorage = os !== 'web';
    const supportsAccelerometer = os !== 'web' && !isSimulator;
    const supportsLocation = os !== 'web';
    const supportsCamera = os !== 'web';
    const supportsMicrophone = os !== 'web';
    const supportsContacts = os !== 'web';
    const supportsAudio = true; // Available on all platforms
    const supportsVideo = os !== 'web'; // Web has limited video support
    const supportsFileSystem = true; // Available on all platforms
    const supportsWebSocket = true; // Available on all platforms
    const supportsHaptics = os !== 'web' && os !== 'android'; // Better on iOS

    // Add warnings
    if (isSimulator) {
      warnings.push('Running on simulator/emulator - some features may be limited');
      if (!supportsAccelerometer) {
        unsupportedFeatures.push('Accelerometer/shake detection');
      }
    }

    if (os === 'web') {
      warnings.push('Running on web - native features will be limited');
      unsupportedFeatures.push(
        'Notifications',
        'Secure storage',
        'Accelerometer',
        'Camera',
        'Microphone',
        'Contacts',
        'Haptics'
      );
    }

    // Check OS version compatibility
    if (os === 'ios') {
      const majorVersion = parseInt(osVersion.split('.')[0]);
      if (majorVersion < 14) {
        warnings.push(`iOS ${majorVersion} is outdated - consider updating for better compatibility`);
      }
    } else if (os === 'android') {
      const majorVersion = parseInt(osVersion.toString());
      if (majorVersion < 10) {
        warnings.push(`Android ${majorVersion} is outdated - consider updating for better compatibility`);
      }
    }

    // Get app version
    const appVersion = Application.nativeApplicationVersion || '1.0.0';
    const appBuildNumber = Application.nativeBuildVersion || '1';

    cachedCapabilities = {
      os,
      osVersion,
      deviceModel,
      deviceName,
      screenSize: screenSize as 'phone' | 'tablet' | 'web',
      screenWidth: Math.round(width),
      screenHeight: Math.round(height),
      screenDiagonal: Math.round(screenDiagonal * 100) / 100,
      supportsNotifications,
      supportsSecureStorage,
      supportsAccelerometer,
      supportsLocation,
      supportsCamera,
      supportsMicrophone,
      supportsContacts,
      supportsAudio,
      supportsVideo,
      supportsFileSystem,
      supportsWebSocket,
      supportsHaptics,
      isSimulator,
      isEmulator,
      isTrustedDevice,
      appVersion,
      appBuildNumber,
      warnings,
      unsupportedFeatures,
    };

    // Log capabilities on first load
    console.log('=== Device Capabilities ===');
    console.log(`Device: ${deviceName} (${deviceModel})`);
    console.log(`OS: ${os} ${osVersion}`);
    console.log(`Screen: ${screenSize} (${Math.round(width)}x${Math.round(height)})`);
    console.log(`App: v${appVersion} (build ${appBuildNumber})`);
    if (warnings.length > 0) {
      console.warn('Warnings:', warnings);
    }
    if (unsupportedFeatures.length > 0) {
      console.warn('Unsupported features:', unsupportedFeatures);
    }

    return cachedCapabilities;
  } catch (error) {
    console.error('Failed to get device capabilities:', error);
    // Return safe defaults
    const isSimulator = Device?.isDevice === false;
    return {
      os: Platform.OS as 'ios' | 'android' | 'web',
      osVersion: 'unknown',
      deviceModel: 'unknown',
      deviceName: 'unknown',
      screenSize: 'phone',
      screenWidth: Dimensions.get('window').width,
      screenHeight: Dimensions.get('window').height,
      screenDiagonal: 5,
      supportsNotifications: Platform.OS !== 'web',
      supportsSecureStorage: Platform.OS !== 'web',
      supportsAccelerometer: Platform.OS !== 'web',
      supportsLocation: Platform.OS !== 'web',
      supportsCamera: Platform.OS !== 'web',
      supportsMicrophone: Platform.OS !== 'web',
      supportsContacts: Platform.OS !== 'web',
      supportsAudio: true,
      supportsVideo: Platform.OS !== 'web',
      supportsFileSystem: true,
      supportsWebSocket: true,
      supportsHaptics: Platform.OS === 'ios',
      isSimulator,
      isEmulator: false,
      isTrustedDevice: Device?.isDevice === true,
      appVersion: '1.0.0',
      appBuildNumber: '1',
      warnings: [],
      unsupportedFeatures: [],
    };
  }
}

export async function getFeatureFlags(): Promise<FeatureFlags> {
  if (cachedFeatureFlags) {
    return cachedFeatureFlags;
  }

  const capabilities = await getDeviceCapabilities();

  cachedFeatureFlags = {
    enableNotifications: capabilities.supportsNotifications,
    enableSecureStorage: capabilities.supportsSecureStorage,
    enableAccelerometer: capabilities.supportsAccelerometer,
    enableLocation: capabilities.supportsLocation,
    enableCamera: capabilities.supportsCamera,
    enableMicrophone: capabilities.supportsMicrophone,
    enableContacts: capabilities.supportsContacts,
    enableAudio: capabilities.supportsAudio,
    enableVideo: capabilities.supportsVideo,
    enableFileSystem: capabilities.supportsFileSystem,
    enableWebSocket: capabilities.supportsWebSocket,
    enableHaptics: capabilities.supportsHaptics,
  };

  return cachedFeatureFlags;
}

export function isFeatureSupported(feature: keyof FeatureFlags): boolean {
  if (!cachedFeatureFlags) {
    return true; // Assume supported if not initialized yet
  }
  return cachedFeatureFlags[feature];
}

export function clearCapabilityCache(): void {
  cachedCapabilities = null;
  cachedFeatureFlags = null;
}

export async function getFormattedDeviceInfo(): Promise<string> {
  const capabilities = await getDeviceCapabilities();
  const lines = [
    '=== DEVICE INFORMATION ===',
    `Device: ${capabilities.deviceName}`,
    `Model: ${capabilities.deviceModel}`,
    `OS: ${capabilities.os.toUpperCase()} ${capabilities.osVersion}`,
    `Is Device: ${capabilities.isTrustedDevice ? 'Yes' : 'No (Simulator/Emulator)'}`,
    '',
    '=== SCREEN INFO ===',
    `Size: ${capabilities.screenSize}`,
    `Resolution: ${capabilities.screenWidth}x${capabilities.screenHeight}`,
    `Diagonal: ${capabilities.screenDiagonal}"`,
    '',
    '=== CAPABILITIES ===',
    `Notifications: ${capabilities.supportsNotifications ? '✓' : '✗'}`,
    `Secure Storage: ${capabilities.supportsSecureStorage ? '✓' : '✗'}`,
    `Accelerometer: ${capabilities.supportsAccelerometer ? '✓' : '✗'}`,
    `Location: ${capabilities.supportsLocation ? '✓' : '✗'}`,
    `Camera: ${capabilities.supportsCamera ? '✓' : '✗'}`,
    `Microphone: ${capabilities.supportsMicrophone ? '✓' : '✗'}`,
    `Contacts: ${capabilities.supportsContacts ? '✓' : '✗'}`,
    `Audio: ${capabilities.supportsAudio ? '✓' : '✗'}`,
    `Video: ${capabilities.supportsVideo ? '✓' : '✗'}`,
    `File System: ${capabilities.supportsFileSystem ? '✓' : '✗'}`,
    `WebSocket: ${capabilities.supportsWebSocket ? '✓' : '✗'}`,
    `Haptics: ${capabilities.supportsHaptics ? '✓' : '✗'}`,
  ];

  if (capabilities.warnings.length > 0) {
    lines.push('', '=== WARNINGS ===');
    capabilities.warnings.forEach((w) => lines.push(`⚠️ ${w}`));
  }

  if (capabilities.unsupportedFeatures.length > 0) {
    lines.push('', '=== UNSUPPORTED FEATURES ===');
    capabilities.unsupportedFeatures.forEach((f) => lines.push(`✗ ${f}`));
  }

  lines.push('', `App v${capabilities.appVersion} (build ${capabilities.appBuildNumber})`);

  return lines.join('\n');
}
