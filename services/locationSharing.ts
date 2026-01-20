import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

export interface LocationCoord {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
}

export interface LocationHistory {
  userId: string;
  location: LocationCoord;
  sharedWith: string[];
}

export interface SharedLocation {
  userId: string;
  location: LocationCoord;
}

const LOCATION_KEY = 'cruzer:locations:v1';
const HISTORY_KEY = 'cruzer:location:history:v1';

class LocationSharingService {
  private userLocation: LocationCoord | null = null;
  private sharedWithUsers: Map<string, SharedLocation> = new Map();
  private locationHistory: LocationHistory[] = [];

  constructor() {
    this.loadLocation();
    this.startTracking();
  }

  private async loadLocation() {
    try {
      const [location, history] = await Promise.all([
        AsyncStorage.getItem(LOCATION_KEY),
        AsyncStorage.getItem(HISTORY_KEY),
      ]);
      if (location) this.userLocation = JSON.parse(location);
      if (history) this.locationHistory = JSON.parse(history);
    } catch (error) {
      console.error('Error loading location:', error);
    }
  }

  private async saveLocation() {
    try {
      await Promise.all([
        this.userLocation ? AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(this.userLocation)) : Promise.resolve(),
        AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(this.locationHistory.slice(-30))),
      ]);
    } catch (error) {
      console.error('Error saving location:', error);
    }
  }

  private startTracking() {
    setInterval(() => this.updateLocation(), 60000);
  }

  async updateLocation() {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) return;
      const location = await Location.getCurrentPositionAsync({});
      this.userLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        timestamp: new Date(),
      };
      this.locationHistory.push({
        userId: 'current',
        location: this.userLocation,
        sharedWith: Array.from(this.sharedWithUsers.keys()),
      });
      this.saveLocation();
    } catch (error) {
      console.error('Error updating location:', error);
    }
  }

  requestLocationShare(userId: string): boolean {
    return true;
  }

  allowLocationShare(userId: string): boolean {
    if (!this.userLocation) return false;
    this.sharedWithUsers.set(userId, { userId, location: this.userLocation });
    this.saveLocation();
    return true;
  }

  getAllSharedLocations(): SharedLocation[] {
    return Array.from(this.sharedWithUsers.values());
  }

  revokeLocationShare(userId: string): boolean {
    return this.sharedWithUsers.delete(userId);
  }

  getNearbyFriends(radiusMiles: number = 1): SharedLocation[] {
    if (!this.userLocation) return [];
    return this.getAllSharedLocations().filter(friend => {
      const distance = this.calculateDistance(
        this.userLocation!.latitude,
        this.userLocation!.longitude,
        friend.location.latitude,
        friend.location.longitude
      );
      return distance <= radiusMiles;
    });
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  getLocationHistory(): LocationHistory[] {
    return this.locationHistory;
  }

  getCurrentLocation(): LocationCoord | null {
    return this.userLocation;
  }
}

export const locationSharingService = new LocationSharingService();
