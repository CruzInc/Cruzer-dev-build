# Device Capabilities Checker

The Cruzer app now includes a comprehensive device capability detection system that automatically checks your device and adjusts app features accordingly to prevent crashes.

## Features

### Automatic Device Detection

The app automatically detects:

- **Platform Info**: OS type (iOS, Android, Web), OS version, device model, device name
- **Hardware**: Screen size, resolution, diagonal measurement
- **Device Type**: Physical device, simulator, or emulator detection
- **Feature Support**: Notifications, secure storage, accelerometer, location, camera, microphone, contacts, audio, video, file system, WebSocket, haptics

### Smart Feature Disabling

Features that aren't supported on your device are automatically:
- ✅ Detected during app startup
- ✅ Disabled gracefully (no crashes)
- ✅ Logged with warnings
- ✅ Removed from UI where appropriate

### Examples of Automatic Adjustments

| Scenario | Automatic Adjustment |
|----------|---------------------|
| Running on web | Disables: Notifications, Secure Storage, Accelerometer, Camera, Microphone, Contacts, Haptics |
| Running on simulator | Disables: Accelerometer (no hardware sensors) |
| Old iOS version | Warns about potential compatibility issues |
| Old Android version | Warns about potential compatibility issues |
| No internet | WebSocket falls back to local-only mode |

## How to View Device Information

### Developer Panel

1. Open the app and navigate to **Settings** (⚙️ icon)
2. Look for **Developer Panel** option
3. Tap the **Device Information** button
4. View your device details including:
   - Device name and model
   - Operating system and version
   - Screen resolution and diagonal size
   - Feature support checklist
   - Any warnings or unsupported features
   - App version and build number

### Sample Device Info Output

```
=== DEVICE INFORMATION ===
Device: iPhone 15 Pro
Model: iPhone16,1
OS: iOS 18.2
Is Device: Yes

=== SCREEN INFO ===
Size: phone
Resolution: 1179x2556
Diagonal: 6.3"

=== CAPABILITIES ===
Notifications: ✓
Secure Storage: ✓
Accelerometer: ✓
Location: ✓
Camera: ✓
Microphone: ✓
Contacts: ✓
Audio: ✓
Video: ✓
File System: ✓
WebSocket: ✓
Haptics: ✓

App v1.0.0 (build 100)
```

## API Usage for Developers

### Get All Device Capabilities

```typescript
import { getDeviceCapabilities } from '../services/deviceCapabilities';

const capabilities = await getDeviceCapabilities();

console.log(capabilities.os);                    // 'ios' | 'android' | 'web'
console.log(capabilities.deviceModel);           // 'iPhone16,1'
console.log(capabilities.screenSize);            // 'phone' | 'tablet' | 'web'
console.log(capabilities.supportsAccelerometer); // true | false
console.log(capabilities.warnings);              // Array of warning strings
console.log(capabilities.unsupportedFeatures);   // Array of unsupported feature names
```

### Get Feature Flags

```typescript
import { getFeatureFlags } from '../services/deviceCapabilities';

const flags = await getFeatureFlags();

console.log(flags.enableNotifications);      // true | false
console.log(flags.enableSecureStorage);      // true | false
console.log(flags.enableAccelerometer);      // true | false
// ... etc
```

### Check Individual Feature Support

```typescript
import { isFeatureSupported } from '../services/deviceCapabilities';

if (isFeatureSupported('enableAccelerometer')) {
  // Use accelerometer feature
} else {
  // Show alternative or disable feature
}
```

### Get Formatted Device Info String

```typescript
import { getFormattedDeviceInfo } from '../services/deviceCapabilities';

const info = await getFormattedDeviceInfo();
console.log(info); // Pretty-printed device information
```

## Features Disabled per Platform

### Web Platform
- ❌ Notifications (no native notification API)
- ❌ Secure Storage (no native keychain access)
- ❌ Accelerometer (no hardware sensors)
- ❌ Camera (limited support)
- ❌ Microphone (limited support)
- ❌ Contacts (no access to device contacts)
- ❌ Haptics (no haptic feedback support)

### Simulator/Emulator
- ❌ Accelerometer (sensors not emulated by default)

### Older iOS (< iOS 14)
- ⚠️ Warning: Consider updating for better compatibility

### Older Android (< Android 10)
- ⚠️ Warning: Consider updating for better compatibility

## What Happens When Features Fail?

All features have graceful fallbacks:

| Feature | Failure Behavior |
|---------|-----------------|
| Notifications | Silently skipped; app continues normally |
| Secure Storage | Falls back to in-memory key; encryption still works |
| Accelerometer | Shake-to-hide disabled; other features work |
| Camera | Feature is hidden from UI |
| Location | Feature is hidden from UI |
| WebSocket | Falls back to local-only mode; app works offline |
| Haptics | Silently skipped; no haptic feedback |

## Console Logging

When the app starts, device capabilities are logged to console:

```
=== Device Capabilities ===
Device: iPhone 15 Pro (iPhone16,1)
OS: ios 18.2
Screen: phone (1179x2556)
App: v1.0.0 (build 100)
Warnings: Running on simulator - some features may be limited
Unsupported features: Accelerometer/shake detection
```

Check your console logs to troubleshoot device compatibility issues.

## Future Enhancements

The device checker can be extended to:
- Detect available RAM and storage
- Check battery level and optimization mode
- Detect network speed and connection type
- Check for Dark Mode vs Light Mode preferences
- Detect device orientation lock status
- Implement feature-level permissions checking

## Troubleshooting

### Feature not working?
1. Open Developer Panel
2. Check Device Information
3. Look for the feature in the capabilities list
4. Check console logs for warnings

### Getting "Feature not supported" message?
- This is intentional - your device doesn't support this feature
- Check the device info to see what's supported
- Try on a physical device instead of a simulator
- Update your OS to a newer version

### Need to test unsupported features?
- Use a physical device with the appropriate OS version
- Web features are limited - test on native apps
- Simulator features can be enabled in Xcode/Android Studio settings

## Code References

- Device capabilities service: [services/deviceCapabilities.ts](services/deviceCapabilities.ts)
- App integration: [app/index.tsx](app/index.tsx) (initialized on startup)
- Developer panel: [app/index.tsx](app/index.tsx) (view in settings)
