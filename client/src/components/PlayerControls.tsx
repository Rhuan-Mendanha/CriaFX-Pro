import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface PlayerControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  isShuffle: boolean;
  onToggleShuffle: () => void;
  repeatMode: 'off' | 'one' | 'all';
  onToggleRepeat: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
}

export function PlayerControls({
  isPlaying,
  onPlayPause,
  onPrevious,
  onNext,
  isShuffle,
  onToggleShuffle,
  repeatMode,
  onToggleRepeat,
  currentTime,
  duration,
  onSeek,
  volume,
  onVolumeChange,
}: PlayerControlsProps) {
  const { theme } = useTheme();
  
  const formatTime = (time: number) => {
    if (!isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Cores do botão play baseadas no tema
  const playButtonColors = theme === 'dark'
    ? 'bg-purple-600 hover:bg-purple-700'  // Roxo no dark mode
    : 'bg-green-500 hover:bg-green-600';   // Verde no light mode

  return (
    <div className="w-full space-y-3">
      {/* Progress Bar */}
      <div className="space-y-1.5">
        <Slider
          value={[currentTime]}
          onValueChange={(value) => onSeek(value[0])}
          min={0}
          max={duration || 0}
          step={0.1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main Controls - More compact */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onToggleShuffle}
          className={`p-2 rounded-lg transition-all ${
            isShuffle 
              ? 'text-green-500 bg-green-500/10' 
              : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
          }`}
          title="Shuffle"
        >
          <Shuffle className="w-4 h-4" />
        </button>

        <button
          onClick={onPrevious}
          className="p-2 rounded-lg text-muted-foreground hover:text-green-500 hover:bg-green-500/10 transition-all"
          title="Previous"
        >
          <SkipBack className="w-5 h-5" />
        </button>

        {/* Play/Pause Button - Compact and professional */}
        <button
          onClick={onPlayPause}
          className={`${playButtonColors} text-white rounded-full w-12 h-12 flex items-center justify-center transition-all hover:scale-105 shadow-lg`}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-white" />
          ) : (
            <Play className="w-5 h-5 fill-white ml-0.5" />
          )}
        </button>

        <button
          onClick={onNext}
          className="p-2 rounded-lg text-muted-foreground hover:text-green-500 hover:bg-green-500/10 transition-all"
          title="Next"
        >
          <SkipForward className="w-5 h-5" />
        </button>

        <button
          onClick={onToggleRepeat}
          className={`p-2 rounded-lg transition-all ${
            repeatMode !== 'off'
              ? 'text-green-500 bg-green-500/10'
              : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
          }`}
          title={repeatMode === 'one' ? 'Repeat One' : repeatMode === 'all' ? 'Repeat All' : 'Repeat Off'}
        >
          {repeatMode === 'one' ? (
            <Repeat1 className="w-4 h-4" />
          ) : (
            <Repeat className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Volume Control - More compact */}
      <div className="flex items-center gap-2 justify-center">
        <button 
          onClick={() => onVolumeChange(volume === 0 ? 0.5 : 0)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {volume === 0 ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>
        <Slider
          value={[volume]}
          onValueChange={(value) => onVolumeChange(value[0])}
          min={0}
          max={1}
          step={0.05}
          className="w-28"
        />
        <span className="text-xs text-muted-foreground w-10 text-center tabular-nums">
          {Math.round(volume * 100)}%
        </span>
      </div>
    </div>
  );
}
