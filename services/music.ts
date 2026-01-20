// Free music service using Jamendo API (free for non-commercial use)
// No API key required for basic search

export interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  duration: number; // seconds
  audioUrl: string;
  imageUrl?: string;
}

const JAMENDO_BASE = 'https://api.jamendo.com/v3.0';
const CLIENT_ID = '5cb17e72'; // Public demo client ID for Jamendo

export const searchTracks = async (query: string, limit: number = 20): Promise<MusicTrack[]> => {
  try {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      format: 'json',
      limit: limit.toString(),
      namesearch: query,
      include: 'musicinfo',
      audioformat: 'mp32',
    });

    const response = await fetch(`${JAMENDO_BASE}/tracks/?${params.toString()}`);
    
    if (!response.ok) {
      console.warn('Jamendo search failed:', response.status);
      return [];
    }

    const data = await response.json();
    
    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.map((track: any) => ({
      id: track.id?.toString() || Date.now().toString(),
      name: track.name || 'Unknown Track',
      artist: track.artist_name || 'Unknown Artist',
      duration: parseInt(track.duration) || 0,
      audioUrl: track.audio || track.audiodownload || '',
      imageUrl: track.image || track.album_image || undefined,
    }));
  } catch (error) {
    console.error('Music search error:', error);
    return [];
  }
};

export const getPopularTracks = async (limit: number = 20): Promise<MusicTrack[]> => {
  try {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      format: 'json',
      limit: limit.toString(),
      order: 'popularity_total',
      include: 'musicinfo',
      audioformat: 'mp32',
    });

    const response = await fetch(`${JAMENDO_BASE}/tracks/?${params.toString()}`);
    
    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    
    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.map((track: any) => ({
      id: track.id?.toString() || Date.now().toString(),
      name: track.name || 'Unknown Track',
      artist: track.artist_name || 'Unknown Artist',
      duration: parseInt(track.duration) || 0,
      audioUrl: track.audio || track.audiodownload || '',
      imageUrl: track.image || track.album_image || undefined,
    }));
  } catch (error) {
    console.error('Popular tracks error:', error);
    return [];
  }
};

export const musicService = {
  searchTracks,
  getPopularTracks,
};
