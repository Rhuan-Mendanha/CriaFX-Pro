import { StreamingTrack } from '@/config/streaming';
import { API_CONFIG } from '@/config/streaming';

export class YouTubeSearchService {
  private static instance: YouTubeSearchService;

  private constructor() {}

  static getInstance(): YouTubeSearchService {
    if (!YouTubeSearchService.instance) {
      YouTubeSearchService.instance = new YouTubeSearchService();
    }
    return YouTubeSearchService.instance;
  }

  async search(query: string, limit: number = 20): Promise<StreamingTrack[]> {
    const apiKey = API_CONFIG.youtube.apiKey;
    if (!apiKey) {
      console.warn('YouTube API key not configured');
      return [];
    }

    try {
      // Search for videos
      const searchResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query + ' audio')}&type=video&videoCategoryId=10&videoEmbeddable=true&videoSyndicated=true&maxResults=${limit}&key=${apiKey}`
      );

      if (!searchResponse.ok) {
        throw new Error('YouTube search failed');
      }

      const searchData = await searchResponse.json();
      
      if (!searchData.items || searchData.items.length === 0) {
        return [];
      }

      // Get video details (for duration)
      const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
      const detailsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet,status&id=${videoIds}&key=${apiKey}`
      );

      if (!detailsResponse.ok) {
        throw new Error('YouTube details failed');
      }

      const detailsData = await detailsResponse.json();
      const embeddable = (detailsData.items || []).filter((v: any) => v.status?.embeddable !== false && v.status?.privacyStatus === 'public');
      return this.formatTracks(embeddable);
    } catch (error) {
      console.error('YouTube search error:', error);
      return [];
    }
  }

  private formatTracks(youtubeVideos: any[]): StreamingTrack[] {
    return youtubeVideos.map(video => ({
      id: `youtube-${video.id}`,
      name: this.cleanTitle(video.snippet.title),
      artist: video.snippet.channelTitle,
      duration: this.parseDuration(video.contentDetails.duration),
      coverUrl: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default.url,
      source: 'youtube' as const,
      externalId: video.id,
    }));
  }

  private cleanTitle(title: string): string {
    // Remove common suffixes like (Official Video), [Official Audio], etc
    return title
      .replace(/\(Official.*?\)/gi, '')
      .replace(/\[Official.*?\]/gi, '')
      .replace(/\(Lyric.*?\)/gi, '')
      .replace(/\[Lyric.*?\]/gi, '')
      .replace(/\(Audio.*?\)/gi, '')
      .replace(/\[Audio.*?\]/gi, '')
      .trim();
  }

  private parseDuration(duration: string): number {
    // Parse ISO 8601 duration (PT1M30S -> 90 seconds)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    return hours * 3600 + minutes * 60 + seconds;
  }
}


// --- Added: resolve a playable/embeddable YouTube video id (avoids Error 150 / embed-blocked "Topic/VEVO") ---
export async function searchPlayableVideoId(searchTerm: string): Promise<{ videoId: string; isAlternative: boolean } | null> {
  // We bias toward embeddable "audio/lyrics/visualizer" uploads that usually work in iframe.
  const variants = [
    searchTerm,
    `${searchTerm} audio`,
    `${searchTerm} lyrics`,
    `${searchTerm} visualizer`,
    `${searchTerm} unofficial audio`,
  ];

  for (const q of variants) {
    try {
      const results = await searchYouTube(q);
      // Prefer non-Topic / non-VEVO channels first
      const preferred = results
        .filter(r => r?.id)
        .filter(r => {
          const ch = (r.channelTitle || '').toLowerCase();
          return !ch.includes('topic') && !ch.includes('vevo');
        });

      const pick = (preferred[0] || results[0]) as any;
      if (pick?.id) {
        // If it came from a modified query, treat as alternative
        return { videoId: pick.id, isAlternative: q !== searchTerm };
      }
    } catch {
      // keep trying next variant
    }
  }
  return null;
}
