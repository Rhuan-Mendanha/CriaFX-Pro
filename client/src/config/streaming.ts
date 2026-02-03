// API Configuration for Spotify and YouTube
export const API_CONFIG = {
  spotify: {
    clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID || '',
    redirectUri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'http://localhost:3000/callback',
    scopes: [
      'streaming',
      'user-read-email',
      'user-read-private',
      'user-library-read',
      'user-library-modify',
      'user-read-playback-state',
      'user-modify-playback-state',
    ].join(' '),
  },
  youtube: {
    apiKey: import.meta.env.VITE_YOUTUBE_API_KEY || '',
  },
};

export interface StreamingTrack {
  id: string;
  name: string;
  artist: string;
  album?: string;
  duration: number;
  coverUrl: string;
  source: 'spotify' | 'youtube' | 'local';
  externalId: string; // Spotify URI or YouTube video ID
  previewUrl?: string;
}

export interface SearchResult {
  tracks: StreamingTrack[];
  source: 'spotify' | 'youtube';
}
