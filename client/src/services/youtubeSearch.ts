import { StreamingTrack, API_CONFIG } from '@/config/streaming';

/**
 * ✅ Read key from Vite env (GitHub Actions injects it via Secrets)
 * Fallback to API_CONFIG.youtube.apiKey if you still use it locally (optional).
 */
function getYouTubeApiKey(): string | null {
  const fromEnv = (import.meta as any)?.env?.VITE_YOUTUBE_API_KEY;
  const key = (fromEnv || API_CONFIG?.youtube?.apiKey || '').trim();
  return key.length ? key : null;
}

/** ✅ Extract clean videoId (handles youtube- prefixes / urls / etc) */
function extractYouTubeId(input?: string): string {
  if (!input) return '';
  let s = String(input).trim();

  s = s.replace(/^youtube-/, '').replace(/^yt-/, '').trim();

  try {
    if (s.startsWith('http://') || s.startsWith('https://')) {
      const u = new URL(s);
      const v = u.searchParams.get('v');
      if (v) return v;

      const parts = u.pathname.split('/').filter(Boolean);
      if (u.hostname.includes('youtu.be') && parts[0]) return parts[0];

      const embedIdx = parts.indexOf('embed');
      if (embedIdx !== -1 && parts[embedIdx + 1]) return parts[embedIdx + 1];

      const shortsIdx = parts.indexOf('shorts');
      if (shortsIdx !== -1 && parts[shortsIdx + 1]) return parts[shortsIdx + 1];
    }
  } catch {}

  s = s.split('&')[0].split('?')[0].split('#')[0].trim();
  s = s.replace(/[^a-zA-Z0-9_-]/g, '');
  return s;
}

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
    const apiKey = getYouTubeApiKey();
    if (!apiKey) {
      console.warn('YouTube API key not configured (VITE_YOUTUBE_API_KEY)');
      (window as any).toast?.error?.('Configure VITE_YOUTUBE_API_KEY to enable YouTube search.');
      return [];
    }

    const q = query.trim();
    if (!q) return [];

    try {
      // Search for videos (music-focused)
      const searchResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
          q + ' audio'
        )}&type=video&videoCategoryId=10&videoEmbeddable=true&videoSyndicated=true&maxResults=${limit}&key=${apiKey}`
      );

      if (!searchResponse.ok) {
        throw new Error('YouTube search failed');
      }

      const searchData = await searchResponse.json();

      if (!searchData.items || searchData.items.length === 0) {
        return [];
      }

      // Get video details (duration + embeddable/public check)
      const videoIds = searchData.items
        .map((item: any) => extractYouTubeId(item?.id?.videoId))
        .filter(Boolean)
        .join(',');

      if (!videoIds) return [];

      const detailsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet,status&id=${videoIds}&key=${apiKey}`
      );

      if (!detailsResponse.ok) {
        throw new Error('YouTube details failed');
      }

      const detailsData = await detailsResponse.json();

      const playable = (detailsData.items || []).filter(
        (v: any) =>
          v?.status?.embeddable !== false &&
          v?.status?.privacyStatus === 'public' &&
          v?.id
      );

      return this.formatTracks(playable);
    } catch (error) {
      console.error('YouTube search error:', error);
      return [];
    }
  }

  private formatTracks(youtubeVideos: any[]): StreamingTrack[] {
    return youtubeVideos
      .map((video) => {
        const videoId = extractYouTubeId(video?.id);
        if (!videoId) return null;

        return {
          // ✅ IMPORTANT: keep id stable and clean
          id: videoId,
          name: this.cleanTitle(video.snippet?.title || 'Unknown'),
          artist: video.snippet?.channelTitle || 'YouTube',
          duration: this.parseDuration(video.contentDetails?.duration || 'PT0S'),
          coverUrl:
            video.snippet?.thumbnails?.high?.url ||
            video.snippet?.thumbnails?.medium?.url ||
            video.snippet?.thumbnails?.default?.url ||
            `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          source: 'youtube' as const,
          // ✅ externalId must be pure videoId (player uses it!)
          externalId: videoId,
          // optional url if your app expects it
          url: `https://www.youtube.com/watch?v=${videoId}`,
        } as StreamingTrack;
      })
      .filter(Boolean) as StreamingTrack[];
  }

  private cleanTitle(title: string): string {
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
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    return hours * 3600 + minutes * 60 + seconds;
  }
}

// --- Added: resolve a playable/embeddable YouTube video id (avoids Error 150 / embed-blocked) ---
export async function searchPlayableVideoId(
  searchTerm: string
): Promise<{ videoId: string; isAlternative: boolean } | null> {
  const service = YouTubeSearchService.getInstance();

  const variants = [
    searchTerm,
    `${searchTerm} audio`,
    `${searchTerm} lyrics`,
    `${searchTerm} visualizer`,
    `${searchTerm} unofficial audio`,
  ];

  for (const q of variants) {
    try {
      const results = await service.search(q, 12);

      // Prefer non-Topic / non-VEVO channels first
      const preferred = results.filter((r) => {
        const ch = (r.artist || '').toLowerCase();
        return !ch.includes('topic') && !ch.includes('vevo');
      });

      const pick = preferred[0] || results[0];
      const vid = extractYouTubeId(pick?.externalId || pick?.id);

      if (vid) {
        return { videoId: vid, isAlternative: q !== searchTerm };
      }
    } catch {
      // try next variant
    }
  }

  return null;
}
