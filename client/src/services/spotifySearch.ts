import { StreamingTrack } from '@/config/streaming';
import { SpotifyAuthService } from './spotifyAuth';

export class SpotifySearchService {
  private static instance: SpotifySearchService;
  private auth: SpotifyAuthService;

  private constructor() {
    this.auth = SpotifyAuthService.getInstance();
  }

  static getInstance(): SpotifySearchService {
    if (!SpotifySearchService.instance) {
      SpotifySearchService.instance = new SpotifySearchService();
    }
    return SpotifySearchService.instance;
  }

  async search(query: string, limit: number = 20): Promise<StreamingTrack[]> {
    const token = this.auth.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated with Spotify');
    }

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Spotify search failed');
      }

      const data = await response.json();
      return this.formatTracks(data.tracks.items);
    } catch (error) {
      console.error('Spotify search error:', error);
      return [];
    }
  }

  private formatTracks(spotifyTracks: any[]): StreamingTrack[] {
    return spotifyTracks.map(track => ({
      id: `spotify-${track.id}`,
      name: track.name,
      artist: track.artists.map((a: any) => a.name).join(', '),
      album: track.album.name,
      duration: Math.floor(track.duration_ms / 1000),
      coverUrl: track.album.images[0]?.url || '',
      source: 'spotify' as const,
      externalId: track.uri,
      previewUrl: track.preview_url,
    }));
  }

  async getTrack(trackId: string): Promise<StreamingTrack | null> {
    const token = this.auth.getAccessToken();
    if (!token) return null;

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/tracks/${trackId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) return null;

      const track = await response.json();
      return this.formatTracks([track])[0];
    } catch (error) {
      console.error('Get track error:', error);
      return null;
    }
  }
}
