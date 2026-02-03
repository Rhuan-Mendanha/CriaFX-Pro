import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Folder, Music, ChevronRight, X } from 'lucide-react';
import type { Track } from '@/hooks/useMusicPlayer';
import { parseBuffer } from 'music-metadata-browser';

interface FolderSelectorProps {
  onTracksSelected: (tracks: Track[]) => void;
}

// Extract album cover from audio file using music-metadata-browser
async function extractAlbumCover(file: File): Promise<string | undefined> {
  try {
    const metadata = await parseBuffer(await file.arrayBuffer(), file.type || 'audio/mpeg');
    
    // Get the picture from metadata
    const picture = metadata.common.picture?.[0];
    if (picture) {
      // Convert to base64
      const base64 = btoa(
        picture.data.reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      return `data:${picture.format};base64,${base64}`;
    }
    
    return undefined;
  } catch (error) {
    console.error('Error extracting album cover:', error);
    return undefined;
  }
}

interface FolderSelectorProps {
  onTracksSelected: (tracks: Track[]) => void;
}

export function FolderSelector({ onTracksSelected }: FolderSelectorProps) {
  const [previewTracks, setPreviewTracks] = useState<Track[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFolderSelect = async () => {
    try {
      setLoading(true);
      const dirHandle = await (window as any).showDirectoryPicker();
      const tracks: Track[] = [];

      for await (const entry of dirHandle.values()) {
        if (
          entry.kind === 'file' &&
          entry.name.match(/\.(mp3|wav|ogg|m4a|flac)$/i)
        ) {
          const file = await entry.getFile();
          const url = URL.createObjectURL(file);

          // Parse artist and title from filename if available
          const nameWithoutExt = entry.name.replace(/\.[^.]+$/, '');
          let artist = 'Unknown Artist';
          let title = nameWithoutExt;

          if (nameWithoutExt.includes(' - ')) {
            const parts = nameWithoutExt.split(' - ');
            artist = parts[0].trim();
            title = parts[1].trim();
          }

          // Extract album cover from audio file
          const albumCover = await extractAlbumCover(file);
          
          console.log(`Processing: ${title}`);
          console.log(`Album cover found: ${albumCover ? 'YES' : 'NO'}`);

          tracks.push({
            id: `${entry.name}-${Date.now()}`,
            name: title,
            url,
            artist,
            albumCover,
          });
        }
      }

      if (tracks.length > 0) {
        setPreviewTracks(tracks);
        setShowPreview(true);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error selecting folder:', err);
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    onTracksSelected(previewTracks);
    setShowPreview(false);
    setPreviewTracks([]);
  };

  const handleCancel = () => {
    setShowPreview(false);
    setPreviewTracks([]);
  };

  if (!showPreview) {
  return (
    <Button
      onClick={handleFolderSelect}
      disabled={loading}
      className="w-full bg-foreground hover:bg-foreground/90 text-background gap-2 py-6 text-lg"
    >
      <Folder className="w-5 h-5" />
      {loading ? 'Loading music files...' : 'Select Music Folder'}
    </Button>
  );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg border border-border p-6 max-w-2xl w-full max-h-96 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Music className="w-5 h-5 text-foreground" />
            Found {previewTracks.length} Music Files
          </h3>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-foreground/10 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-2">
          {previewTracks.map((track, index) => (
            <div
              key={track.id}
              className="p-3 bg-background rounded-lg border border-border hover:border-foreground/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-foreground/10 rounded flex items-center justify-center text-foreground text-sm font-semibold">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-medium truncate">{track.name}</p>
                  <p className="text-muted-foreground text-sm truncate">{track.artist}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            Load Playlist ({previewTracks.length} songs)
          </Button>
        </div>
      </div>
    </div>
  );
}
