# Microphone Muting Fix

## Problem
The native phone microphone was being muted while the app was open, even when no media was playing. This was caused by the audio session being configured with `allowsRecordingIOS: false`.

## Solution
Implemented proper audio initialization and configuration to keep the microphone functional:

### 1. **Audio Mode Initialization on App Startup**
- Added `initAudio()` useEffect hook that runs once on app mount
- Sets `allowsRecordingIOS: true` to enable microphone access
- Runs only on native platforms (iOS/Android), not web

**Configuration:**
```tsx
await Audio.setAudioModeAsync({
  allowsRecordingIOS: true,      // ✅ Allows microphone recording
  playsInSilentModeIOS: true,    // Play audio in silent mode
  staysActiveInBackground: false, // Don't stay active in background
  shouldDuckAndroid: true,        // Reduce other audio on Android when recording
});
```

### 2. **Fixed Music Playback Audio Mode**
- Changed `playMusic()` function to also use `allowsRecordingIOS: true`
- Allows microphone to work while music is playing
- Added comment explaining why recording is allowed during playback

**Key Changes:**
- Line 446-469: New audio initialization useEffect
- Line 717-727: Updated playMusic audio mode configuration

## Benefits
✅ Microphone stays functional while app is open  
✅ Microphone works even during music playback  
✅ Proper audio ducking on Android  
✅ Silent mode respected on iOS  
✅ No muting of native system audio  

## Testing
1. Open the app
2. Try recording audio/using microphone
3. Try playing music and then recording
4. Verify microphone works in both cases

## Files Changed
- [app/index.tsx](app/index.tsx#L446-L469) - Audio initialization
- [app/index.tsx](app/index.tsx#L715-L727) - Music playback audio mode
