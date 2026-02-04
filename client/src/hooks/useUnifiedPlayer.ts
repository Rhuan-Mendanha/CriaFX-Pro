import { useEffect, useRef, useState, useCallback } from 'react';
import { useMusicPlayer, type Track } from './useMusicPlayer';
import type { StreamingTrack } from '@/config/streaming';

export type SourceType = 'youtube' | 'local';

export interface UnifiedTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
  sourceType: SourceType;
  externalId?: string; // YouTube video ID (PURE)
  albumCover?: string;
  duration?: number;
}

interface UnifiedPlayerState {
  currentTrack: UnifiedTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  queue: UnifiedTrack[];
}

// ✅ Extracts a clean YouTube videoId from many possible formats
function extractYouTubeId(input?: string): string {
  if (!input) return '';

  let s = String(input).trim();

  // remove internal prefixes
  s = s.replace(/^youtube-/, '').replace(/^yt-/, '').trim();

  // handle full youtube urls
  // examples:
  // https://www.youtube.com/watch?v=VIDEOID
  // https://youtu.be/VIDEOID
  // https://www.youtube.com/embed/VIDEOID
  // https://music.youtube.com/watch?v=VIDEOID
  try {
    if (s.startsWith('http://') || s.startsWith('https://')) {
      const u = new URL(s);
      const v = u.searchParams.get('v');
      if (v) return v;
      // youtu.be/<id>
      const parts = u.pathname.split('/').filter(Boolean);
      if (u.hostname.includes('youtu.be') && parts[0]) return parts[0];
      // /embed/<id>
      const embedIdx = parts.indexOf('embed');
      if (embedIdx !== -1 && parts[embedIdx + 1]) return parts[embedIdx + 1];
      // /shorts/<id>
      const shortsIdx = parts.indexOf('shorts');
      if (shortsIdx !== -1 && parts[shortsIdx + 1]) return parts[shortsIdx + 1];
    }
  } catch {
    // ignore URL parsing errors
  }

  // fallback: keep only typical id characters
  // YouTube IDs are 11 chars, but we won’t hard-fail if longer (some APIs append stuff)
  s = s.split('&')[0].split('?')[0].split('#')[0].trim();
  s = s.replace(/[^a-zA-Z0-9_-]/g, '');

  return s;
}

export const useUnifiedPlayer = () => {
  const localPlayer = useMusicPlayer();
  const [queue, setQueue] = useState<UnifiedTrack[]>([]);
  const [state, setState] = useState<UnifiedPlayerState>({
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    queue: [],
  });

  const youtubePlayerRef = useRef<any>(null);
  const youtubeContainerRef = useRef<HTMLDivElement | null>(null);
  const [youtubeReady, setYoutubeReady] = useState(false);
  const progressIntervalRef = useRef<number>();
  const retryCountRef = useRef(0);

  // Sync volume
  useEffect(() => {
    localPlayer.setVolume(state.volume);
    if (youtubePlayerRef.current?.setVolume) {
      try {
        youtubePlayerRef.current.setVolume(state.volume * 100);
      } catch (e) {}
    }
  }, [state.volume, localPlayer]);

  // Initialize YouTube API
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ((window as any).YT && (window as any).YT.Player) {
      setYoutubeReady(true);
      return;
    }

    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }

    // avoid overwriting if already set by something else
    const prev = (window as any).onYouTubeIframeAPIReady;
    (window as any).onYouTubeIframeAPIReady = () => {
      try {
        if (typeof prev === 'function') prev();
      } catch {}
      setYoutubeReady(true);
    };
  }, []);

  const createYoutubePlayer = useCallback(() => {
    if (!youtubeReady || !youtubeContainerRef.current) return;

    // Cleanup existing player if any
    if (youtubePlayerRef.current) {
      try {
        youtubePlayerRef.current.destroy();
      } catch (e) {}
      youtubePlayerRef.current = null;
    }

    const origin = window.location.origin;

    youtubePlayerRef.current = new (window as any).YT.Player(youtubeContainerRef.current, {
      height: '100%',
      width: '100%',
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        playsinline: 1,
        enablejsapi: 1,
        origin: origin,
        widget_referrer: origin,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        cc_load_policy: 0,
        autohide: 1,
      },
      events: {
        onReady: () => {
          // If we already set a YT track as current, load again on ready
          const tr = state.currentTrack;
          if (tr?.sourceType === 'youtube') {
            const vid = extractYouTubeId(tr.externalId || tr.id || tr.url);
            if (vid) {
              try {
                youtubePlayerRef.current.loadVideoById({ videoId: vid, suggestedQuality: 'default' });
                if (state.isPlaying) youtubePlayerRef.current.playVideo();
              } catch {}
            }
          }
        },
        onStateChange: (event: any) => {
          // 1 playing, 2 paused, 0 ended
          if (event.data === 1) setState((p) => ({ ...p, isPlaying: true }));
          else if (event.data === 2) setState((p) => ({ ...p, isPlaying: false }));
          else if (event.data === 0) handleTrackEnd();
        },
        onError: (e: any) => {
          console.error('YT Error:', e.data);

          // Error 150/101/5/2: restricted/unavailable/invalid
          if (e.data === 150 || e.data === 101 || e.data === 5 || e.data === 2) {
            const errorMessages: { [key: number]: string } = {
              150: 'This video cannot be played in embedded players',
              101: 'This video is not available',
              5: 'HTML5 player error',
              2: 'Invalid video ID',
            };

            const message = errorMessages[e.data] || 'Video playback error';
            console.warn(`${message}. Skipping to next track...`);

            if (typeof window !== 'undefined' && (window as any).toast) {
              (window as any).toast.error(`${message} - Skipping to next track`);
            }

            retryCountRef.current = 0;
            setTimeout(() => handleTrackEnd(), 500);
          }
        },
      },
    });
  }, [youtubeReady, state.currentTrack, state.isPlaying]);

  useEffect(() => {
    if (youtubeReady && youtubeContainerRef.current && !youtubePlayerRef.current) {
      createYoutubePlayer();
    }
  }, [youtubeReady, createYoutubePlayer]);

  const handleTrackEnd = useCallback(() => {
    setQueue((currentQueue) => {
      const idx = currentQueue.findIndex((t) => t.id === state.currentTrack?.id);
      if (idx !== -1 && idx < currentQueue.length - 1) {
        setTimeout(() => playTrack(currentQueue[idx + 1]), 100);
      }
      return currentQueue;
    });
  }, [state.currentTrack]);

  // Unified Progress Sync
  useEffect(() => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    progressIntervalRef.current = window.setInterval(() => {
      if (state.currentTrack?.sourceType === 'youtube') {
        if (youtubePlayerRef.current?.getCurrentTime) {
          try {
            setState((p) => ({
              ...p,
              currentTime: youtubePlayerRef.current.getCurrentTime() || 0,
              duration: youtubePlayerRef.current.getDuration() || 0,
            }));
          } catch (e) {}
        }
      } else if (state.currentTrack?.sourceType === 'local') {
        setState((p) => ({
          ...p,
          currentTime: localPlayer.currentTime,
          duration: localPlayer.duration,
          isPlaying: localPlayer.isPlaying,
        }));
      }
    }, 200);

    return () => clearInterval(progressIntervalRef.current);
  }, [localPlayer.currentTime, localPlayer.duration, localPlayer.isPlaying, state.currentTrack]);

  const playTrack = useCallback(
    (track: UnifiedTrack) => {
      retryCountRef.current = 0;

      // Stop other engine cleanly
      if (track.sourceType === 'youtube') {
        // pause local if needed (don’t toggle blindly)
        try {
          if (localPlayer.isPlaying) localPlayer.togglePlayPause();
        } catch {}
      } else {
        // stop YT if needed
        if (youtubePlayerRef.current?.stopVideo) {
          try {
            youtubePlayerRef.current.stopVideo();
          } catch (e) {}
        }
      }

      setState((prev) => ({ ...prev, currentTrack: track, isPlaying: true, currentTime: 0 }));

      if (track.sourceType === 'youtube') {
        const vid = extractYouTubeId(track.externalId || track.id || track.url);

        if (!vid) {
          console.warn('Invalid YouTube videoId. Skipping...');
          setTimeout(() => handleTrackEnd(), 200);
          return;
        }

        // ensure we always keep externalId clean
        if (track.externalId !== vid) {
          // not mutating original, just helpful for state reads
          track = { ...track, externalId: vid, id: `youtube-${vid}` };
          setState((p) => ({ ...p, currentTrack: track }));
        }

        if (youtubePlayerRef.current?.loadVideoById) {
          try {
            youtubePlayerRef.current.loadVideoById({ videoId: vid, suggestedQuality: 'default' });
            youtubePlayerRef.current.playVideo();
          } catch (e) {
            console.error('Failed to load YT video:', e);
            createYoutubePlayer();
          }
        } else {
          // Player might not be ready yet; onReady will load if currentTrack is youtube
        }
      } else {
        const idx = localPlayer.tracks.findIndex((t) => t.id === track.id);
        if (idx !== -1) localPlayer.playTrack(idx);
      }
    },
    [localPlayer, createYoutubePlayer, handleTrackEnd]
  );

  const togglePlayPause = useCallback(() => {
    if (!state.currentTrack) return;

    if (state.currentTrack.sourceType === 'youtube') {
      if (state.isPlaying) youtubePlayerRef.current?.pauseVideo();
      else youtubePlayerRef.current?.playVideo();
      setState((p) => ({ ...p, isPlaying: !p.isPlaying }));
    } else {
      localPlayer.togglePlayPause();
    }
  }, [state.currentTrack, state.isPlaying, localPlayer]);

  const nextTrack = useCallback(() => {
    const idx = queue.findIndex((t) => t.id === state.currentTrack?.id);
    if (idx !== -1 && queue.length > 0) playTrack(queue[(idx + 1) % queue.length]);
  }, [queue, state.currentTrack, playTrack]);

  const previousTrack = useCallback(() => {
    const idx = queue.findIndex((t) => t.id === state.currentTrack?.id);
    if (idx !== -1 && queue.length > 0) playTrack(queue[(idx - 1 + queue.length) % queue.length]);
  }, [queue, state.currentTrack, playTrack]);

  const seek = useCallback(
    (time: number) => {
      if (state.currentTrack?.sourceType === 'youtube') {
        youtubePlayerRef.current?.seekTo(time, true);
      } else {
        localPlayer.seek(time);
      }
    },
    [state.currentTrack, localPlayer]
  );

  const setVolume = useCallback(
    (v: number) => {
      setState((p) => ({ ...p, volume: v }));
      localPlayer.setVolume(v);
      if (youtubePlayerRef.current?.setVolume) {
        try {
          youtubePlayerRef.current.setVolume(v * 100);
        } catch (e) {}
      }
    },
    [localPlayer]
  );

  const addToQueue = useCallback((track: UnifiedTrack) => {
    setQueue((prev) => {
      if (prev.find((t) => t.id === track.id)) return prev;
      const nq = [...prev, track];
      setState((s) => ({ ...s, queue: nq }));
      return nq;
    });
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setQueue((prev) => {
      const nq = prev.filter((t) => t.id !== id);
      setState((s) => ({ ...s, queue: nq }));
      return nq;
    });
  }, []);

  // ✅ FIXED: always use clean videoId as externalId + consistent id
  const convertStreamingTrack = (t: StreamingTrack): UnifiedTrack => {
    const raw =
      (t as any).videoId ||
      (t as any).youtubeVideoId ||
      (t as any).externalId ||
      t.id ||
      t.url;

    const videoId = extractYouTubeId(raw);

    const cover =
      (t as any).coverUrl ||
      (t as any).albumCover ||
      (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : undefined);

    return {
      id: `youtube-${videoId || t.id}`,
      title: t.name,
      artist: t.artist || 'YouTube',
      url: t.url || '',
      sourceType: 'youtube',
      externalId: videoId || undefined, // ✅ PURE
      albumCover: cover,
      duration: (t as any).duration,
    };
  };

  const convertLocalTrack = (t: Track): UnifiedTrack => ({
    id: t.id,
    title: t.name,
    artist: t.artist || 'Unknown',
    url: t.url,
    sourceType: 'local',
    albumCover: (t as any).albumCover,
    duration: (t as any).duration,
  });

  const loadLocalTracks = (ts: Track[]) => {
    localPlayer.setTracks(ts);
    const unified = ts.map(convertLocalTrack);

    setQueue((prev) => {
      const nq = [...prev.filter((t) => t.sourceType !== 'local'), ...unified];
      setState((s) => ({ ...s, queue: nq }));
      return nq;
    });
  };

  return {
    ...state,
    queue,
    localPlayer,
    youtubeContainerRef,
    playTrack,
    togglePlayPause,
    nextTrack,
    previousTrack,
    seek,
    setVolume,
    addToQueue,
    removeFromQueue,
    convertStreamingTrack,
    convertLocalTrack,
    loadLocalTracks,
    getFrequencyData: () => localPlayer.getFrequencyData(),
    canUseEqualizer: state.currentTrack?.sourceType === 'local',
  };
};
