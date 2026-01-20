# Device Checker Quick Reference

## What It Does
Automatically detects your device and disables unsupported features to prevent crashes.

## How to Check Device Info
1. Open app → Settings ⚙️
2. Tap "Developer Panel"
3. Tap "Device: [Your Model]" button
4. View complete device information

## What Gets Checked

### Device Info
- Device name and model
- OS type and version
- Screen size and resolution
- Physical device vs simulator/emulator

### Feature Support (12 Features)
✓ Notifications  
✓ Secure Storage  
✓ Accelerometer  
✓ Location  
✓ Camera  
✓ Microphone  
✓ Contacts  
✓ Audio  
✓ Video  
✓ File System  
✓ WebSocket  
✓ Haptics

## What Doesn't Work On...

### Web Browser
❌ Notifications, Secure Storage, Accelerometer, Camera, Microphone, Contacts, Haptics

### iOS/Android Simulator
❌ Accelerometer (no hardware sensors)

## If a Feature Doesn't Work
This is intentional - your device doesn't support it. Check:
1. Developer Panel → Device Information
2. Look for "❌" next to the feature
3. Either use physical device or update OS version

## For Developers

### Import and Use
```typescript
import { getDeviceCapabilities, isFeatureSupported } from '../services/deviceCapabilities';

// Check if feature is supported
if (isFeatureSupported('enableAccelerometer')) {
  // Safe to use accelerometer
}
```

### Get All Capabilities
```typescript
const caps = await getDeviceCapabilities();
console.log(caps.warnings);              // Warning messages
console.log(caps.unsupportedFeatures);   // List of unsupported features
```

## Console Logs
Check browser console (F12) on startup - device info is logged automatically.

## Files

| File | Purpose |
|------|---------|
| `services/deviceCapabilities.ts` | Device detection logic |
| `app/index.tsx` | App integration |
| `DEVICE_CHECKER_GUIDE.md` | Full documentation |
| `DEVICE_CHECKER_IMPLEMENTATION.md` | Implementation details |

---

**TL;DR**: App automatically detects your device and turns off features that won't work. View device info in Developer Panel. If a feature doesn't work, it's not supported on your platform.
