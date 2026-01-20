import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Track {
  id: string;
  title: string;
  artist: string;
  service: 'spotify' | 'apple' | 'youtube' | 'shazam';
  uri: string;
}

export interface Playlist {
  id: string;
  name: string;
  service: string;
  tracks: Track[];
}

const MUSIC_HISTORY_KEY = 'cruzer:music:history';
const PLAYLISTS_KEY = 'cruzer:playlists';

class MusicIntegrationService {
  private listeningHistory: Track[] = [];
  private playlists: Map<string, Playlist> = new Map();
  private spotifyConnected = false;
  private appleMusicConnected = false;
  private youtubeConnected = false;

  constructor() {
    this.loadMusicData();
  }

  private async loadMusicData() {
    try {
      const [history, playlists] = await Promise.all([
        AsyncStorage.getItem(MUSIC_HISTORY_KEY),
        AsyncStorage.getItem(PLAYLISTS_KEY),
      ]);
      if (history) this.listeningHistory = JSON.parse(history);
      if (playlists) this.playlists = new Map(JSON.parse(playlists));
    } catch (error) {
      console.error('Error loading music data:', error);
    }
  }

  private async saveMusicData() {
    try {
      await Promise.all([
        AsyncStorage.setItem(MUSIC_HISTORY_KEY, JSON.stringify(this.listeningHistory.slice(-500))),
        AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(Array.from(this.playlists.entries()))),
      ]);
    } catch (error) {
      console.error('Error saving music data:', error);
    }
  }

  connectSpotify(accessToken: string): boolean {
    this.spotifyConnected = !!accessToken;
    return this.spotifyConnected;
  }

  connectAppleMusic(token: string): boolean {
    this.appleMusicConnected = !!token;
    return this.appleMusicConnected;
  }

  connectYouTube(token: string): boolean {
    this.youtubeConnected = !!token;
    return this.youtubeConnected;
  }

  recognizeTrack(title: string, artist: string): Track | null {
    const track: Track = {
      id: `${title}-${artist}`,
      title,
      artist,
      service: 'shazam',
      uri: '',
    };
    this.addToHistory(track);
    return track;
  }

  addToHistory(track: Track) {
    this.listeningHistory.unshift(track);
    if (this.listeningHistory.length > 500) this.listeningHistory.pop();
    this.saveMusicData();
  }

  getListeningHistory(): Track[] {
    return this.listeningHistory;
  }

  createPlaylist(name: string, service: string): Playlist {
    const playlist: Playlist = {
      id: `${name}-${Date.now()}`,
      name,
      service,
      tracks: [],
    };
    this.playlists.set(playlist.id, playlist);
    this.saveMusicData();
    return playlist;
  }

  getPlaylists(): Playlist[] {
    return Array.from(this.playlists.values());
  }

  addTrackToPlaylist(playlistId: string, track: Track): boolean {
    const playlist = this.playlists.get(playlistId);
    if (!playlist) return false;
    playlist.tracks.push(track);
    this.saveMusicData();
    return true;
  }

  sharePlaylist(playlistId: string): string {
    return `cruzer://playlist/${playlistId}`;
  }

  isSpotifyConnected(): boolean {
    return this.spotifyConnected;
  }

  isAppleMusicConnected(): boolean {
    return this.appleMusicConnected;
  }

  isYouTubeConnected(): boolean {
    return this.youtubeConnected;
  }
}

export const musicIntegrationService = new MusicIntegrationService();
