import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Volume2 } from 'lucide-react';
import type { EqualizerSettings } from '@/hooks/useMusicPlayer';

interface AdvancedEqualizerProps {
  settings: EqualizerSettings;
  onBandChange: (bandIndex: number, gain: number) => void;
  onIntensityChange: (intensity: number) => void;
  onToggle: () => void;
}

export function AdvancedEqualizer({
  settings,
  onBandChange,
  onIntensityChange,
  onToggle,
}: AdvancedEqualizerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-full space-y-4">
      {/* Equalizer Header */}
      <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border hover:border-foreground/30 transition-colors">
        <div className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-foreground" />
          <span className="font-semibold text-foreground">Equalizer</span>
          {!settings.enabled && <span className="text-xs text-gray-300">(Disabled)</span>}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={settings.enabled ? 'default' : 'outline'}
            onClick={onToggle}
            className="text-xs"
          >
            {settings.enabled ? 'ON' : 'OFF'}
          </Button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-foreground/10 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Controls */}
      {isExpanded && (
        <div className="space-y-6 p-4 bg-card rounded-lg border border-border">
          {/* Intensity Control */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-foreground">Intensity</label>
              <span className="text-xs text-foreground font-semibold">
                {Math.round(settings.intensity * 100)}%
              </span>
            </div>
            <Slider
              value={[settings.intensity]}
              onValueChange={(value) => onIntensityChange(value[0])}
              min={0}
              max={1}
              step={0.05}
              className="w-full"
            />
          </div>

          {/* Frequency Bands */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Frequency Bands</h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {settings.bands.map((band, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-gray-300">
                      {band.label}
                    </label>
                    <span className="text-xs text-foreground font-semibold">
                      {band.gain > 0 ? '+' : ''}{band.gain.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Slider
                      value={[band.gain]}
                      onValueChange={(value) => onBandChange(index, value[0])}
                      min={-12}
                      max={12}
                      step={0.5}
                      className="w-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Presets</h3>
            <div className="grid grid-cols-3 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  settings.bands.forEach((_, i) => onBandChange(i, 0));
                }}
                className="text-xs"
              >
                Flat
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const preset = [3, 2, 0, -1, 0, 2, 4];
                  preset.forEach((gain, i) => onBandChange(i, gain));
                }}
                className="text-xs"
              >
                Bass Boost
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const preset = [0, -2, -4, -2, 0, 3, 5];
                  preset.forEach((gain, i) => onBandChange(i, gain));
                }}
                className="text-xs"
              >
                Treble
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
