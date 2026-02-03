import { YouTubePlayerService } from '@/services/youtubePlayer';
import { useRef, useState, useCallback, useEffect } from 'react';

export interface Track {
  id: string;
  name: string;
  url: string;
  artist?: string;
  albumCover?: string;
  duration?: number;
}

export interface EqualizerBand {
  frequency: number;
  gain: number;
  label: string;
}

export interface EqualizerSettings {
  bands: EqualizerBand[];
  intensity: number;
  enabled: boolean;
}

// Global AudioContext to prevent multiple instances and memory leaks
let globalAudioContext: AudioContext | null = null;

export function useMusicPlayer() {
  const ytPlayer = YouTubePlayerService.getInstance();
  const ytProgressInterval = useRef<any>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);

  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'one' | 'all'>('off');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  const [equalizerSettings, setEqualizerSettings] = useState<EqualizerSettings>({
    bands: [
      { frequency: 60, gain: 0, label: '60Hz' },
      { frequency: 150, gain: 0, label: '150Hz' },
      { frequency: 400, gain: 0, label: '400Hz' },
      { frequency: 1000, gain: 0, label: '1kHz' },
      { frequency: 2500, gain: 0, label: '2.5kHz' },
      { frequency: 6000, gain: 0, label: '6kHz' },
      { frequency: 16000, gain: 0, label: '16kHz' },
    ],
    intensity: 1,
    enabled: true,
  });

  const initAudioContext = useCallback(() => {
    if (audioContextRef.current || !audioRef.current) return;

    try {
      if (!globalAudioContext) {
        globalAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioContext = globalAudioContext;
      audioContextRef.current = audioContext;

      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      // Disconnect old source if exists to prevent leaks
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
      }

      const sourceNode = audioContext.createMediaElementSource(audioRef.current);
      sourceNodeRef.current = sourceNode;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256; // Optimized for performance
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const gainNode = audioContext.createGain();
      gainNodeRef.current = gainNode;

      const filters: BiquadFilterNode[] = [];
      let previousFilter: AudioNode = sourceNode;

      equalizerSettings.bands.forEach((band) => {
        const filter = audioContext.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = band.frequency;
        filter.gain.value = 0;
        filter.Q.value = 1;
        previousFilter.connect(filter);
        previousFilter = filter;
        filters.push(filter);
      });

      previousFilter.connect(gainNode);
      gainNode.connect(analyser);
      analyser.connect(audioContext.destination);

      filtersRef.current = filters;
    } catch (error) {
      console.error('Error initializing AudioContext:', error);
    }
  }, [equalizerSettings.bands]);

  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => handleTrackEnd();

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  useEffect(() => {
    if (filtersRef.current.length === 0 || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    filtersRef.current.forEach((filter, index) => {
      const band = equalizerSettings.bands[index];
      if (band) {
        const gainValue = band.gain * equalizerSettings.intensity * (equalizerSettings.enabled ? 1 : 0);
        filter.gain.setTargetAtTime(gainValue, ctx.currentTime, 0.1);
      }
    });
  }, [equalizerSettings]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const playTrack = useCallback((index: number) => {
    if (index < 0 || index >= tracks.length || !audioRef.current) return;
    initAudioContext();
    setCurrentTrackIndex(index);
    audioRef.current.src = tracks[index].url;
    audioRef.current.play().catch(console.error);
  }, [tracks, initAudioContext]);

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;
    initAudioContext();
    if (audioRef.current.paused) {
      if (!audioRef.current.src && tracks.length > 0) {
        playTrack(0);
      } else {
        audioRef.current.play().catch(console.error);
      }
    } else {
      audioRef.current.pause();
    }
  }, [tracks, playTrack, initAudioContext]);

  const nextTrack = useCallback(() => {
    let nextIndex = currentTrackIndex;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * tracks.length);
    } else {
      nextIndex = (currentTrackIndex + 1) % tracks.length;
    }
    playTrack(nextIndex);
  }, [currentTrackIndex, isShuffle, tracks.length, playTrack]);

  const previousTrack = useCallback(() => {
    const prevIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    playTrack(prevIndex);
  }, [currentTrackIndex, tracks.length, playTrack]);

  const handleTrackEnd = useCallback(() => {
    if (repeatMode === 'one') {
      playTrack(currentTrackIndex);
    } else {
      nextTrack();
    }
  }, [repeatMode, currentTrackIndex, playTrack, nextTrack]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) audioRef.current.currentTime = time;
  }, []);

  const updateEqualizerBand = useCallback((bandIndex: number, gain: number) => {
    setEqualizerSettings(prev => {
      const newBands = [...prev.bands];
      newBands[bandIndex] = { ...newBands[bandIndex], gain };
      return { ...prev, bands: newBands };
    });
  }, []);

  const updateEqualizerIntensity = useCallback((intensity: number) => {
    setEqualizerSettings(prev => ({ ...prev, intensity }));
  }, []);

  const toggleEqualizer = useCallback(() => {
    setEqualizerSettings(prev => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  const getFrequencyData = useCallback(() => {
    if (!analyserRef.current) return new Uint8Array(128);
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    return dataArray;
  }, []);

  return {
    audioRef,
    audioContextRef,
    tracks,
    setTracks,
    currentTrackIndex,
    currentTrack: tracks[currentTrackIndex],
    isPlaying,
    isShuffle,
    setIsShuffle,
    repeatMode,
    setRepeatMode,
    currentTime,
    duration,
    volume,
    setVolume,
    equalizerSettings,
    playTrack,
    togglePlayPause,
    nextTrack,
    previousTrack,
    seek,
    updateEqualizerBand,
    updateEqualizerIntensity,
    toggleEqualizer,
    getFrequencyData,
  };
}
      const startYouTubeSync = () => {
        if (ytProgressInterval.current) clearInterval(ytProgressInterval.current);
        ytProgressInterval.current = setInterval(async () => {
          const current = await ytPlayer.getCurrentTime();
          const duration = await ytPlayer.getDuration();
          setCurrentTime(current);
          setDuration(duration);
        }, 500);
      };

