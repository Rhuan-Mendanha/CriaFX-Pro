import { useEffect, useState } from 'react';

export interface AudioMetadata {
  title?: string;
  artist?: string;
  album?: string;
  albumCover?: string;
  duration?: number;
}

export function useAudioMetadata(audioUrl: string) {
  const [metadata, setMetadata] = useState<AudioMetadata>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!audioUrl) {
      setMetadata({});
      return;
    }

    setLoading(true);

    const extractMetadata = async () => {
      try {
        // Try to extract metadata using jsmediatags library
        // For now, we'll use a simple approach with fetch
        const response = await fetch(audioUrl);
        const blob = await response.blob();

        // Create a temporary audio element to get duration
        const audio = new Audio();
        audio.src = audioUrl;

        audio.onloadedmetadata = () => {
          setMetadata(prev => ({
            ...prev,
            duration: audio.duration,
          }));
        };

        // Try to extract ID3 tags if available
        // This is a simplified approach - for production, use a library like jsmediatags
        const fileName = audioUrl.split('/').pop() || '';
        const nameWithoutExt = fileName.replace(/\.[^.]+$/, '');

        setMetadata(prev => ({
          ...prev,
          title: prev.title || nameWithoutExt,
          artist: prev.artist || 'Unknown Artist',
        }));

        setLoading(false);
      } catch (error) {
        console.error('Error extracting metadata:', error);
        setLoading(false);
      }
    };

    extractMetadata();
  }, [audioUrl]);

  return { metadata, loading };
}

/**
 * Extract YouTube thumbnail from video URL
 * Supports formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
export function getYouTubeThumbnail(youtubeUrl: string): string | null {
  try {
    let videoId = '';

    // Extract video ID from different YouTube URL formats
    if (youtubeUrl.includes('youtube.com/watch')) {
      const url = new URL(youtubeUrl);
      videoId = url.searchParams.get('v') || '';
    } else if (youtubeUrl.includes('youtu.be')) {
      videoId = youtubeUrl.split('youtu.be/')[1]?.split('?')[0] || '';
    } else if (youtubeUrl.includes('youtube.com/embed')) {
      videoId = youtubeUrl.split('embed/')[1]?.split('?')[0] || '';
    }

    if (!videoId) return null;

    // Return high-quality thumbnail
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  } catch {
    return null;
  }
}

/**
 * Extract metadata from file name
 * Supports formats like: "Artist - Song Title.mp3"
 */
export function parseFileNameMetadata(fileName: string): { artist?: string; title?: string } {
  const nameWithoutExt = fileName.replace(/\.[^.]+$/, '');

  if (nameWithoutExt.includes(' - ')) {
    const [artist, title] = nameWithoutExt.split(' - ').map(s => s.trim());
    return { artist, title };
  }

  return { title: nameWithoutExt };
}
