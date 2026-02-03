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
  externalId?: string; // YouTube video ID
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
      try { youtubePlayerRef.current.setVolume(state.volume * 100); } catch(e){}
    }
  }, [state.volume, localPlayer]);

  // Initialize YouTube API
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).YT && (window as any).YT.Player) {
      setYoutubeReady(true);
    } else {
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
      (window as any).onYouTubeIframeAPIReady = () => setYoutubeReady(true);
    }
  }, []);

  const createYoutubePlayer = useCallback(() => {
    if (!youtubeReady || !youtubeContainerRef.current) return;
    
    // Cleanup existing player if any
    if (youtubePlayerRef.current) {
      try { youtubePlayerRef.current.destroy(); } catch(e){}
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
        autohide: 1
      },
      events: {
        onReady: () => {
          console.log('YouTube player ready');
          if (state.currentTrack?.sourceType === 'youtube' && state.isPlaying) {
            youtubePlayerRef.current.playVideo();
          }
        },
        onStateChange: (event: any) => {
          if (event.data === 1) setState(p => ({ ...p, isPlaying: true }));
          else if (event.data === 2) setState(p => ({ ...p, isPlaying: false }));
          else if (event.data === 0) handleTrackEnd();
        },
        onError: (e: any) => {
          console.error('YT Error:', e.data);
          // Error 150/101/5: Video cannot be played in embedded players or unavailable
          if (e.data === 150 || e.data === 101 || e.data === 5 || e.data === 2) {
            const errorMessages: { [key: number]: string } = {
              150: 'This video cannot be played in embedded players',
              101: 'This video is not available',
              5: 'HTML5 player error',
              2: 'Invalid video ID'
            };
            
            const message = errorMessages[e.data] || 'Video playback error';
            console.warn(`${message}. Skipping to next track...`);
            
            // Import toast if needed
            if (typeof window !== 'undefined' && (window as any).toast) {
              (window as any).toast.error(`${message} - Skipping to next track`);
            }
            
            // Skip to next track immediately
            retryCountRef.current = 0;
            setTimeout(() => handleTrackEnd(), 500);
          }
        }
      }
    });
  }, [youtubeReady, state.currentTrack, state.isPlaying]);

  useEffect(() => {
    if (youtubeReady && youtubeContainerRef.current && !youtubePlayerRef.current) {
      createYoutubePlayer();
    }
  }, [youtubeReady, createYoutubePlayer]);

  const handleTrackEnd = useCallback(() => {
    setQueue(currentQueue => {
      const idx = currentQueue.findIndex(t => t.id === state.currentTrack?.id);
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
            setState(p => ({
              ...p,
              currentTime: youtubePlayerRef.current.getCurrentTime() || 0,
              duration: youtubePlayerRef.current.getDuration() || 0
            }));
          } catch(e){}
        }
      } else if (state.currentTrack?.sourceType === 'local') {
        setState(p => ({
          ...p,
          currentTime: localPlayer.currentTime,
          duration: localPlayer.duration,
          isPlaying: localPlayer.isPlaying
        }));
      }
    }, 200);
    return () => clearInterval(progressIntervalRef.current);
  }, [localPlayer.currentTime, localPlayer.duration, localPlayer.isPlaying, state.currentTrack]);

  const playTrack = useCallback((track: UnifiedTrack) => {
    retryCountRef.current = 0;
    // Stop local if playing
    if (localPlayer.isPlaying) localPlayer.togglePlayPause();
    
    setState(prev => ({ ...prev, currentTrack: track, isPlaying: true, currentTime: 0 }));

    if (track.sourceType === 'youtube') {
      if (youtubePlayerRef.current?.loadVideoById) {
        try {
          youtubePlayerRef.current.loadVideoById({
            videoId: track.externalId,
            suggestedQuality: 'default'
          });
          youtubePlayerRef.current.playVideo();
        } catch (e) {
          console.error('Failed to load YT video:', e);
          // Re-create player if it crashed
          createYoutubePlayer();
        }
      } else {
        // Player might not be ready yet, it will play in onReady
      }
    } else {
      // Stop YT if playing
      if (youtubePlayerRef.current?.stopVideo) try { youtubePlayerRef.current.stopVideo(); } catch(e){}
      const idx = localPlayer.tracks.findIndex(t => t.id === track.id);
      if (idx !== -1) localPlayer.playTrack(idx);
    }
  }, [localPlayer, createYoutubePlayer]);

  const togglePlayPause = useCallback(() => {
    if (!state.currentTrack) return;
    if (state.currentTrack.sourceType === 'youtube') {
      if (state.isPlaying) youtubePlayerRef.current?.pauseVideo();
      else youtubePlayerRef.current?.playVideo();
      setState(p => ({ ...p, isPlaying: !p.isPlaying }));
    } else {
      localPlayer.togglePlayPause();
    }
  }, [state.currentTrack, state.isPlaying, localPlayer]);

  const nextTrack = useCallback(() => {
    const idx = queue.findIndex(t => t.id === state.currentTrack?.id);
    if (idx !== -1) playTrack(queue[(idx + 1) % queue.length]);
  }, [queue, state.currentTrack, playTrack]);

  const previousTrack = useCallback(() => {
    const idx = queue.findIndex(t => t.id === state.currentTrack?.id);
    if (idx !== -1) playTrack(queue[(idx - 1 + queue.length) % queue.length]);
  }, [queue, state.currentTrack, playTrack]);

  const seek = useCallback((time: number) => {
    if (state.currentTrack?.sourceType === 'youtube') {
      youtubePlayerRef.current?.seekTo(time, true);
    } else {
      localPlayer.seek(time);
    }
  }, [state.currentTrack, localPlayer]);

  const setVolume = useCallback((v: number) => {
    setState(p => ({ ...p, volume: v }));
    localPlayer.setVolume(v);
    if (youtubePlayerRef.current?.setVolume) try { youtubePlayerRef.current.setVolume(v * 100); } catch(e){}
  }, [localPlayer]);

  const addToQueue = useCallback((track: UnifiedTrack) => {
    setQueue(prev => {
      if (prev.find(t => t.id === track.id)) return prev;
      const nq = [...prev, track];
      setState(s => ({ ...s, queue: nq }));
      return nq;
    });
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => {
      const nq = prev.filter(t => t.id !== id);
      setState(s => ({ ...s, queue: nq }));
      return nq;
    });
  }, []);

  const convertStreamingTrack = (t: StreamingTrack): UnifiedTrack => ({
    id: t.id, title: t.name, artist: t.artist, url: t.url, sourceType: 'youtube', externalId: t.id, albumCover: t.coverUrl, duration: t.duration,
  });

  const convertLocalTrack = (t: Track): UnifiedTrack => ({
    id: t.id, title: t.name, artist: t.artist || 'Unknown', url: t.url, sourceType: 'local', albumCover: t.albumCover, duration: t.duration,
  });

  const loadLocalTracks = (ts: Track[]) => {
    localPlayer.setTracks(ts);
    const unified = ts.map(convertLocalTrack);
    setQueue(prev => {
      const nq = [...prev.filter(t => t.sourceType !== 'local'), ...unified];
      setState(s => ({ ...s, queue: nq }));
      return nq;
    });
  };

  return {
    ...state, queue, localPlayer, youtubeContainerRef, playTrack, togglePlayPause, nextTrack, previousTrack, seek, setVolume, addToQueue, removeFromQueue, convertStreamingTrack, convertLocalTrack, loadLocalTracks,
    getFrequencyData: () => localPlayer.getFrequencyData(),
    canUseEqualizer: state.currentTrack?.sourceType === 'local',
  };
};
