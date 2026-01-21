import { Platform, Dimensions } from 'react-native';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import Constants from 'expo-constants';

/**
 * Analytics Service
 * Tracks user events, screens, and performance metrics
 */

interface EventParams {
  [key: string]: string | number | boolean | undefined;
}

interface ScreenViewParams {
  screen_name: string;
  screen_class?: string;
}

interface PerformanceMetrics {
  startup_time?: number;
  app_open_time?: number;
  feature_load_time?: number;
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private sessionStartTime: number = 0;
  private isInitialized: boolean = false;

  private constructor() {
    this.sessionStartTime = Date.now();
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Initialize analytics with user properties
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Note: Firebase Analytics (expo-firebase-analytics) is not available
      // This service provides analytics tracking interface
      
      // Set user properties
      await this.setUserProperties();

      // Set device properties
      await this.setDeviceProperties();

      this.isInitialized = true;
      console.log('[Analytics] Initialized successfully');
    } catch (error) {
      console.error('[Analytics] Initialization error:', error);
    }
  }

  /**
   * Track screen views
   */
  async logScreenView(params: ScreenViewParams): Promise<void> {
    if (!this.isInitialized) return;

    try {
      // Log to console instead of Firebase (module not available)
      const eventData = {
        ...params,
        timestamp: new Date().toISOString(),
      };
      console.log('[Analytics] Screen view:', eventData);
    } catch (error) {
      console.error('[Analytics] Screen view error:', error);
    }
  }

  /**
   * Track custom events
   */
  async logEvent(eventName: string, params?: EventParams): Promise<void> {
    if (!this.isInitialized) return;

    try {
      const eventParams = {
        ...params,
        timestamp: new Date().toISOString(),
      };

      // Log to console instead of Firebase (module not available)
      console.log(`[Analytics] Event: ${eventName}`, eventParams);
    } catch (error) {
      console.error('[Analytics] Event logging error:', error);
    }
  }

  /**
   * Track feature usage
   */
  async logFeatureUsage(featureName: string, metadata?: EventParams): Promise<void> {
    await this.logEvent('feature_usage', {
      feature_name: featureName,
      ...metadata,
    });
  }

  /**
   * Track errors and crashes
   */
  async logError(errorName: string, error: Error, context?: EventParams): Promise<void> {
    try {
      const errorParams = {
        error_name: errorName,
        error_message: error.message,
        error_stack: error.stack?.substring(0, 500), // Limit stack trace
        ...context,
      };

      // Log to console instead of Firebase (module not available)
      console.log('[Analytics] Event: app_error', errorParams);
      console.error(`[Analytics] Error: ${errorName}`, error, context);
    } catch (err) {
      console.error('[Analytics] Error logging failed:', err);
    }
  }

  /**
   * Track performance metrics
   */
  async logPerformance(metrics: PerformanceMetrics): Promise<void> {
    try {
      // Log to console instead of Firebase (module not available)
      console.log('[Analytics] Event: app_performance', {
        ...metrics,
        session_duration: Date.now() - this.sessionStartTime,
      });
    } catch (error) {
      console.error('[Analytics] Performance logging error:', error);
    }
  }

  /**
   * Track user engagement
   */
  async logEngagement(action: string, duration?: number): Promise<void> {
    await this.logEvent('user_engagement', {
      action,
      duration: duration || 0,
    });
  }

  /**
   * Log completed transactions
   */
  async logTransaction(transactionId: string, value: number, currency: string = 'USD'): Promise<void> {
    try {
      // Log to console instead of Firebase (module not available)
      console.log('[Analytics] Event: purchase', {
        transaction_id: transactionId,
        value: value,
        currency: currency,
      });
    } catch (error) {
      console.error('[Analytics] Transaction logging error:', error);
    }
  }

  /**
   * Set user properties
   */
  private async setUserProperties(): Promise<void> {
    try {
      const userId = Application.getAndroidId?.();
      if (userId) {
        // Log to console instead of Firebase (module not available)
        console.log('[Analytics] Setting user ID:', userId);
      }

      // Log custom user properties to console
      console.log('[Analytics] Setting user properties:', {
        app_version: Constants.expoConfig?.version || '1.0.0',
        app_name: Constants.expoConfig?.name || 'Cruzer',
        first_open: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[Analytics] User properties error:', error);
    }
  }

  /**
   * Set device properties
   */
  private async setDeviceProperties(): Promise<void> {
    try {
      const { width, height } = Dimensions.get('window');

      const properties = {
        device_name: Device.deviceName,
        device_brand: Device.brand,
        device_model: Device.modelName,
        os: Platform.OS,
        os_version: Platform.Version?.toString(),
        screen_width: width,
        screen_height: height,
        is_device: Device.isDevice,
        is_tablet: false, // Device.isTablet not available in this version
      };

      // Log device properties to console instead of Firebase (module not available)
      console.log('[Analytics] Setting device properties:', properties);
    } catch (error) {
      console.error('[Analytics] Device properties error:', error);
    }
  }

  /**
   * Get session analytics
   */
  getSessionInfo() {
    return {
      session_start: this.sessionStartTime,
      session_duration: Date.now() - this.sessionStartTime,
      is_initialized: this.isInitialized,
    };
  }

  /**
   * Reset session
   */
  resetSession(): void {
    this.sessionStartTime = Date.now();
  }
}

// Export singleton instance
export const analytics = AnalyticsService.getInstance();
export default AnalyticsService;
