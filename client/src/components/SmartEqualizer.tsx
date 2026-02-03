import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Lock, Settings2 } from 'lucide-react';
import { EqualizerSettings } from '@/hooks/useMusicPlayer';

interface SmartEqualizerProps {
  canUse: boolean;
  settings: EqualizerSettings;
  onBandChange: (index: number, gain: number) => void;
  onIntensityChange: (intensity: number) => void;
  onToggle: () => void;
}

export function SmartEqualizer({
  canUse,
  settings,
  onBandChange,
  onIntensityChange,
  onToggle
}: SmartEqualizerProps) {
  return (
    <div className="relative flex flex-col h-full w-full max-w-xs mx-auto space-y-8 py-4">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <Settings2 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <Label className="text-sm font-bold block">Master EQ</Label>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Professional Grade</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-muted-foreground">{settings.enabled ? 'ON' : 'OFF'}</span>
          <Switch
            checked={settings.enabled}
            onCheckedChange={onToggle}
            disabled={!canUse}
            className="data-[state=checked]:bg-primary"
          />
        </div>
      </div>

      {/* Overlay for YouTube/Disabled state */}
      {!canUse && (
        <div className="absolute inset-0 z-20 backdrop-blur-[3px] bg-background/60 rounded-2xl flex flex-col items-center justify-center text-center p-6 transition-all duration-500 border border-border/50 shadow-2xl">
          <div className="bg-background/90 p-4 rounded-full shadow-xl mb-4 border border-primary/20 animate-pulse">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h4 className="text-base font-bold text-foreground">Equalizer Locked</h4>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed max-w-[200px]">
            YouTube streaming audio doesn't support local EQ processing.
          </p>
        </div>
      )}

      {/* EQ Bands Container - Centered */}
      <div className={`flex-1 flex flex-col justify-center space-y-10 transition-all duration-500 ${!canUse ? 'opacity-20 grayscale pointer-events-none' : ''}`}>
        <div className="grid grid-cols-7 gap-1 h-56 items-end px-1">
          {settings.bands.map((band, index) => (
            <div key={band.label} className="flex flex-col items-center gap-4 h-full group">
              <div className="flex-1 w-full flex items-center justify-center relative">
                {/* Value Indicator on Hover */}
                <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-primary bg-primary/10 px-1 rounded">
                  {band.gain > 0 ? '+' : ''}{band.gain}dB
                </div>
                <Slider
                  orientation="vertical"
                  min={-12}
                  max={12}
                  step={0.5}
                  value={[band.gain]}
                  onValueChange={([val]) => onBandChange(index, val)}
                  className="h-full"
                />
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[9px] font-bold text-foreground/80">
                  {band.label}
                </span>
                <div className="w-1 h-1 rounded-full bg-primary/30" />
              </div>
            </div>
          ))}
        </div>

        {/* Intensity Slider - Professional Look */}
        <div className="pt-6 border-t border-border/30 px-2">
          <div className="flex justify-between items-center mb-4">
            <div className="flex flex-col">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Effect Intensity</Label>
              <span className="text-[9px] text-muted-foreground/60">Overall EQ Strength</span>
            </div>
            <div className="bg-primary/10 px-2 py-1 rounded border border-primary/20">
              <span className="text-xs font-mono font-bold text-primary">{Math.round(settings.intensity * 100)}%</span>
            </div>
          </div>
          <Slider
            min={0}
            max={2}
            step={0.1}
            value={[settings.intensity]}
            onValueChange={([val]) => onIntensityChange(val)}
            className="py-2"
          />
          <div className="flex justify-between mt-1 px-1">
            <span className="text-[8px] text-muted-foreground font-medium">0%</span>
            <span className="text-[8px] text-muted-foreground font-medium">100%</span>
            <span className="text-[8px] text-muted-foreground font-medium">200%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
