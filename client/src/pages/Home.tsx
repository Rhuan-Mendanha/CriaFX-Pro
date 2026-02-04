import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useUnifiedPlayer } from '@/hooks/useUnifiedPlayer';
import type { Track } from '@/hooks/useMusicPlayer';
import { PlayerControls } from '@/components/PlayerControls';
import { SmartEqualizer } from '@/components/SmartEqualizer';
import { WaveformVisualizer } from '@/components/WaveformVisualizer';
import { SettingsButton } from '@/components/SettingsButton';
import { SettingsPanel } from '@/components/SettingsPanel';
import { SearchBar } from '@/components/SearchBar';
import { AuthModal } from '@/components/AuthModal';
import { Music, FolderOpen, Youtube, X, PlayCircle, User } from 'lucide-react';
import { toast } from 'sonner';
import type { StreamingTrack } from '@/config/streaming';
import type { ExportFormat } from '@/utils/audioExport';

export default function Home() {
  const player = useUnifiedPlayer();
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(128).fill(30));
  const [albumCoverUrl, setAlbumCoverUrl] = useState<string>('');
  const [needsInteraction, setNeedsInteraction] = useState(true);
  const [mobileTab, setMobileTab] = useState<'queue' | 'eq'>('queue');
  const [authOpen, setAuthOpen] = useState(false);
  const animationIdRef = useRef<number | null>(null);

  // Expose toast globally for YouTube player errors
  useEffect(() => {
    (window as any).toast = toast;
  }, []);

  useEffect(() => {
    const updateFrequency = () => {
      try {
        const data = player.getFrequencyData();
        if (data && data.length > 0) {
          setFrequencyData(data);
        } else if (!player.isPlaying) {
          const idleData = new Uint8Array(128);
          for (let i = 0; i < 128; i++) {
            idleData[i] = 20 + Math.sin(Date.now() * 0.002 + i * 0.1) * 10;
          }
          setFrequencyData(idleData);
        }
      } catch (err) {
        // ignore
      }
      animationIdRef.current = requestAnimationFrame(updateFrequency);
    };

    animationIdRef.current = requestAnimationFrame(updateFrequency);
    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
    };
  }, [player]);

  useEffect(() => {
    setAlbumCoverUrl(player.currentTrack?.albumCover || '');
  }, [player.currentTrack]);

  const handleTracksSelected = (tracks: Track[]) => {
    player.loadLocalTracks(tracks);
    if (tracks.length > 0) player.playTrack(player.convertLocalTrack(tracks[0]));
  };

  const handleYouTubeTrackSelect = (track: StreamingTrack) => {
    const unified = player.convertStreamingTrack(track);
    player.addToQueue(unified);
    player.playTrack(unified);
    toast.success(`Now playing: ${track.name}`);
  };

  const handleStartApp = () => {
    setNeedsInteraction(false);
    if (player.localPlayer.audioRef.current) {
      player.localPlayer.audioRef.current
        .play()
        .then(() => {
          player.localPlayer.audioRef.current?.pause();
        })
        .catch(() => {});
    }
  };

  // Export handler for SettingsPanel
  const handleExport = async (format: ExportFormat) => {
    try {
      const anyPlayer = player as any;

      // Try common names without breaking TS
      const exportFn =
        anyPlayer.exportAudio ||
        anyPlayer.exportCurrentTrack ||
        anyPlayer.localPlayer?.exportAudio ||
        anyPlayer.localPlayer?.exportCurrentTrack;

      if (typeof exportFn !== 'function') {
        toast.error('Export is not available in this build.');
        return;
      }

      await exportFn(format);
      toast.success(`Export started: ${format.toUpperCase()}`);
    } catch (e) {
      toast.error('Failed to export audio.');
    }
  };

  return (
    <div className="h-screen w-screen bg-background text-foreground overflow-hidden relative flex flex-col">
      <WaveformVisualizer
        frequencyData={frequencyData}
        isPlaying={player.isPlaying}
        tracksCount={player.queue.length}
      />

      {/* Interaction Overlay */}
      {needsInteraction && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-6">
            <h2 className="text-3xl font-bold">Welcome to CriaFX Pro</h2>
            <p className="text-muted-foreground">
              To enable high-quality audio and YouTube streaming, please click the button below to start the player.
            </p>
            <Button
              size="lg"
              onClick={handleStartApp}
              className="gap-2 px-8 py-6 text-lg rounded-full shadow-xl hover:scale-105 transition-transform"
            >
              <PlayCircle className="w-6 h-6" />
              Start Experience
            </Button>
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col h-full w-full">
        {player.localPlayer.audioRef && <audio ref={player.localPlayer.audioRef} crossOrigin="anonymous" />}

        {/* Header */}
        <header className="flex-none backdrop-blur-md bg-background/90 border-b border-border/50 shadow-sm z-[60]">
          <div className="max-w-[1920px] mx-auto">
            {/* Top row */}
            <div className="flex items-center justify-between gap-2 px-4 md:px-6 py-3">
              <h1 className="text-xl md:text-2xl font-bold text-foreground dark:text-white md:bg-gradient-to-r md:from-primary md:to-primary/60 md:bg-clip-text md:text-transparent truncate">
                CriaFX Pro
              </h1>

              <div className="flex items-center gap-2 flex-none">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => document.querySelector<HTMLInputElement>('#folder-input')?.click()}
                  className="border border-border rounded-full w-9 h-9"
                  aria-label="Import folder"
                  title="Import folder"
                >
                  <FolderOpen className="w-5 h-5" />
                </Button>

                <input
                  id="folder-input"
                  type="file"
                  // @ts-ignore
                  webkitdirectory=""
                  // @ts-ignore
                  directory=""
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []).filter(
                      (f) => f.type.startsWith('audio/') || f.name.match(/\.(mp3|wav|ogg|m4a|flac)$/i)
                    );
                    if (files.length === 0) return toast.error('No audio files found');

                    handleTracksSelected(
                      files.map((f, i) => ({
                        id: `local-${Date.now()}-${i}`,
                        name: f.name.replace(/\.[^/.]+$/, ''),
                        url: URL.createObjectURL(f),
                        artist: 'Local File',
                      }))
                    );
                  }}
                />

                {/* Perfil / Login */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="border border-border rounded-full w-9 h-9"
                  onClick={() => setAuthOpen(true)}
                  aria-label="User profile / login"
                  title="Perfil / Login"
                >
                  <User className="w-5 h-5" />
                </Button>

                <SettingsButton />
              </div>
            </div>

            {/* Search row (mobile only) */}
            <div className="md:hidden px-4 pb-3">
              <SearchBar
                onTrackSelect={handleYouTubeTrackSelect}
                onAddToQueue={(t) => player.addToQueue(player.convertStreamingTrack(t))}
              />
            </div>

            {/* Search row (desktop) */}
            <div className="hidden md:block px-6 pb-3">
              <div className="max-w-2xl mx-auto">
                <SearchBar
                  onTrackSelect={handleYouTubeTrackSelect}
                  onAddToQueue={(t) => player.addToQueue(player.convertStreamingTrack(t))}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-[320px_1fr_320px] gap-6 p-6 overflow-hidden z-10">
          {/* Queue Sidebar */}
          <aside className="hidden lg:flex flex-col bg-card/50 backdrop-blur rounded-xl border border-border p-4 overflow-hidden">
            <h3 className="font-semibold mb-3 flex items-center gap-2 flex-none">
              <Music className="w-4 h-4" /> Queue ({player.queue.length})
            </h3>

            <div className="flex-1 overflow-y-auto scrollbar-thin space-y-2 pr-1">
              {player.queue.map((track) => (
                <div
                  key={track.id}
                  className={`group p-3 rounded-lg border transition-all cursor-pointer flex items-center gap-2 ${
                    player.currentTrack?.id === track.id
                      ? 'bg-primary/20 border-primary/50'
                      : 'bg-background/50 hover:bg-foreground/5 border-border/50'
                  }`}
                  onClick={() => player.playTrack(track)}
                >
                  <div className="relative w-10 h-10 flex-none">
                    {track.albumCover ? (
                      <img src={track.albumCover} className="w-full h-full object-cover rounded" />
                    ) : (
                      <div className="w-full h-full bg-muted rounded flex items-center justify-center">
                        <Music className="w-5 h-5 opacity-20" />
                      </div>
                    )}

                    {track.sourceType === 'youtube' && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-background rounded-full flex items-center justify-center border border-border">
                        <Youtube className="w-2.5 h-2.5 text-red-500" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{track.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-6 h-6 opacity-0 group-hover:opacity-100 flex-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      player.removeFromQueue(track.id);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </aside>

          {/* Center Player */}
          <section className="flex flex-col items-center justify-center gap-8 overflow-hidden relative z-20">
            <div className="w-full max-w-md aspect-square bg-card/30 backdrop-blur-md rounded-2xl border border-border/50 shadow-2xl flex items-center justify-center overflow-hidden relative group flex-none">
              {/* YouTube Player */}
              <div
                className={`absolute inset-0 z-10 bg-black transition-opacity duration-500 ${
                  player.currentTrack?.sourceType === 'youtube' ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <div ref={player.youtubeContainerRef} className="w-full h-full" />
              </div>

              {albumCoverUrl && player.currentTrack?.sourceType !== 'youtube' && (
                <img
                  src={albumCoverUrl}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              )}

              {!albumCoverUrl && player.currentTrack?.sourceType !== 'youtube' && (
                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                  <Music className="w-20 h-20 opacity-20" />
                  <p className="text-sm font-medium opacity-50">No track playing</p>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6 z-20">
                <h2 className="text-white font-bold text-xl truncate">{player.currentTrack?.title || 'CriaFX Pro'}</h2>
                <p className="text-white/70 text-sm truncate">{player.currentTrack?.artist || 'Select a track'}</p>
              </div>
            </div>

            <div className="w-full max-w-2xl bg-card/80 backdrop-blur-xl p-6 rounded-2xl border border-border shadow-xl flex-none">
              <PlayerControls
                isPlaying={player.isPlaying}
                currentTime={player.currentTime}
                duration={player.duration}
                volume={player.volume}
                onPlayPause={player.togglePlayPause}
                onNext={player.nextTrack}
                onPrevious={player.previousTrack}
                onSeek={player.seek}
                onVolumeChange={player.setVolume}
                isShuffle={player.localPlayer.isShuffle}
                onToggleShuffle={() => player.localPlayer.setIsShuffle(!player.localPlayer.isShuffle)}
                repeatMode={player.localPlayer.repeatMode}
                onToggleRepeat={() => {
                  const modes: ('off' | 'one' | 'all')[] = ['off', 'one', 'all'];
                  player.localPlayer.setRepeatMode(modes[(modes.indexOf(player.localPlayer.repeatMode) + 1) % modes.length]);
                }}
              />

              {/* Mobile panels: Queue + Equalizer */}
              <div className="w-full max-w-2xl lg:hidden flex flex-col gap-3 mt-4 px-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant={mobileTab === 'queue' ? 'default' : 'secondary'}
                    className="flex-1"
                    onClick={() => setMobileTab('queue')}
                  >
                    Queue ({player.queue.length})
                  </Button>
                  <Button
                    variant={mobileTab === 'eq' ? 'default' : 'secondary'}
                    className="flex-1"
                    onClick={() => setMobileTab('eq')}
                  >
                    Equalizer
                  </Button>
                </div>

                {mobileTab === 'queue' && (
                  <div className="bg-card/70 backdrop-blur rounded-xl border border-border p-4">
                    <div className="max-h-[38vh] overflow-y-auto scrollbar-thin space-y-2 pr-1">
                      {player.queue.map((track) => (
                        <div
                          key={track.id}
                          className={`group p-3 rounded-lg border transition-all cursor-pointer flex items-center gap-2 ${
                            player.currentTrack?.id === track.id
                              ? 'bg-primary/20 border-primary/50'
                              : 'bg-background/50 hover:bg-foreground/5 border-border/50'
                          }`}
                          onClick={() => player.playTrack(track)}
                        >
                          <div className="relative w-10 h-10 flex-none">
                            {track.albumCover ? (
                              <img src={track.albumCover} className="w-full h-full object-cover rounded" />
                            ) : (
                              <div className="w-full h-full bg-muted rounded flex items-center justify-center">
                                <Music className="w-5 h-5 opacity-20" />
                              </div>
                            )}
                            {track.sourceType === 'youtube' && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-background rounded-full flex items-center justify-center border border-border">
                                <Youtube className="w-2.5 h-2.5 text-red-500" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{track.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                          </div>

                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-7 h-7 opacity-100 flex-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              player.removeFromQueue(track.id);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {mobileTab === 'eq' && (
                  <div className="bg-card/70 backdrop-blur rounded-xl border border-border p-4">
                    <SmartEqualizer
                      canUse={player.canUseEqualizer}
                      settings={player.localPlayer.equalizerSettings}
                      onBandChange={player.localPlayer.updateEqualizerBand}
                      onIntensityChange={player.localPlayer.updateEqualizerIntensity}
                      onToggle={player.localPlayer.toggleEqualizer}
                    />
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Equalizer Sidebar */}
          <aside className="hidden lg:flex flex-col bg-card/50 backdrop-blur rounded-xl border border-border p-6 overflow-hidden">
            <SmartEqualizer
              canUse={player.canUseEqualizer}
              settings={player.localPlayer.equalizerSettings}
              onBandChange={player.localPlayer.updateEqualizerBand}
              onIntensityChange={player.localPlayer.updateEqualizerIntensity}
              onToggle={player.localPlayer.toggleEqualizer}
            />
          </aside>
        </main>

        {/* Settings + Auth */}
        <SettingsPanel onExport={handleExport} />
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    </div>
  );
}
