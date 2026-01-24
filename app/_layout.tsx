// template
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Platform, UIManager, View, Text, StyleSheet, LogBox, AppState } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { analytics } from "../services/analytics";
import { usageInsights } from "../services/usageInsights";
import { AnalyticsEvents } from "../services/analyticsEvents";

// Suppress specific warnings that don't affect functionality
LogBox.ignoreLogs([
  'Require cycle:',
  'Non-serializable values were found in the navigation state',
]);

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    },
  },
});

// Error boundary for catching startup crashes
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>Something went wrong</Text>
          <Text style={errorStyles.message}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <Text style={errorStyles.hint}>Please restart the app</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  hint: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});

function RootLayoutNav() {
  return (
    <Stack 
      screenOptions={{ 
        headerBackTitle: "Back",
        animation: Platform.OS === 'android' ? 'fade' : 'default',
        animationDuration: 200,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="gamification" options={{ title: 'Gamification' }} />
      <Stack.Screen name="directory" options={{ title: 'Directory' }} />
      <Stack.Screen name="activity-feed" options={{ title: 'Activity Feed' }} />
      <Stack.Screen name="stories" options={{ title: 'Stories' }} />
      <Stack.Screen name="group-chat" options={{ title: 'Group Chat' }} />
      <Stack.Screen name="themes" options={{ title: 'Themes & Sounds' }} />
      <Stack.Screen name="search-advanced" options={{ title: 'Advanced Search' }} />
      <Stack.Screen name="security" options={{ title: 'Security & Devices' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const appStateRef = useRef(useRef(AppState.currentState).current);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize analytics
        await analytics.initialize();
        await analytics.logEvent(AnalyticsEvents.APP_LAUNCH);

        // Record app open event for insights
        await usageInsights.recordEvent(AnalyticsEvents.APP_LAUNCH, 0, {
          app_launch_time: new Date().toISOString(),
        });

        // Pre-load any resources or perform initialization here
        // Add a small delay for Android to properly initialize
        if (Platform.OS === 'android') {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (e) {
        console.warn('Error during app preparation:', e);
        await analytics.logError('AppPrepareError', e instanceof Error ? e : new Error(String(e)));
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  // Track app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const handleAppStateChange = (nextAppState: string) => {
    if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to foreground
      analytics.logEvent(AnalyticsEvents.APP_FOREGROUND);
      usageInsights.recordEvent(AnalyticsEvents.APP_FOREGROUND);
    } else if (nextAppState.match(/inactive|background/)) {
      // App has gone to background
      analytics.logEvent(AnalyticsEvents.APP_BACKGROUND);
      usageInsights.recordEvent(AnalyticsEvents.APP_BACKGROUND);
      // Flush analytics data when going to background
      usageInsights.flushBuffer();
    }

    appStateRef.current = nextAppState;
  };

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // Hide splash screen after a small delay for smoother transition
      await new Promise(resolve => setTimeout(resolve, 50));
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
            <RootLayoutNav />
          </GestureHandlerRootView>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
