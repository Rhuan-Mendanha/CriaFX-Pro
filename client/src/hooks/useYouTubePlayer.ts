import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function useYouTubePlayer() {
  const playerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player('youtube-player', {
        height: '0',
        width: '0',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            console.log('YouTube Player Ready');
            setIsReady(true);
          },
          onStateChange: (event: any) => {
            // -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
            setIsPlaying(event.data === 1);
            
            if (event.data === 1) {
              // Playing - start interval
              if (intervalRef.current) clearInterval(intervalRef.current);
              intervalRef.current = window.setInterval(() => {
                if (playerRef.current) {
                  setCurrentTime(playerRef.current.getCurrentTime() || 0);
                  setDuration(playerRef.current.getDuration() || 0);
                }
              }, 1000);
            } else {
              // Not playing - clear interval
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
            }
            
            if (event.data === 0) {
              // Video ended
              console.log('Video ended');
              setCurrentTime(0);
            }
          },
        },
      });
    };

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  const play = (videoId?: string) => {
    if (!playerRef.current || !isReady) {
      console.warn('YouTube Player not ready');
      return;
    }

    if (videoId) {
      setCurrentVideoId(videoId);
      playerRef.current.loadVideoById(videoId);
      playerRef.current.playVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const pause = () => {
    if (playerRef.current && isReady) {
      playerRef.current.pauseVideo();
    }
  };

  const stop = () => {
    if (playerRef.current && isReady) {
      playerRef.current.stopVideo();
      setCurrentVideoId(null);
    }
  };

  const setVolume = (volume: number) => {
    if (playerRef.current && isReady) {
      playerRef.current.setVolume(volume * 100);
    }
  };

  const seekTo = (seconds: number) => {
    if (playerRef.current && isReady) {
      playerRef.current.seekTo(seconds, true);
      setCurrentTime(seconds);
    }
  };

  return {
    play,
    pause,
    stop,
    setVolume,
    seekTo,
    isReady,
    isPlaying,
    currentVideoId,
    currentTime,
    duration,
  };
}
