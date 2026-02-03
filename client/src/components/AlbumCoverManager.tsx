import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Music, Download, Link as LinkIcon } from 'lucide-react';

interface AlbumCoverManagerProps {
  currentCover?: string;
  trackName: string;
  onCoverUpdate: (cover: string) => void;
}

export function AlbumCoverManager({
  currentCover,
  trackName,
  onCoverUpdate,
}: AlbumCoverManagerProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const extractYouTubeThumbnail = (url: string): string | null => {
    try {
      let videoId = '';

      if (url.includes('youtube.com/watch')) {
        const urlObj = new URL(url);
        videoId = urlObj.searchParams.get('v') || '';
      } else if (url.includes('youtu.be')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
      } else if (url.includes('youtube.com/embed')) {
        videoId = url.split('embed/')[1]?.split('?')[0] || '';
      }

      if (!videoId) return null;
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    } catch {
      return null;
    }
  };

  const handleYouTubeSubmit = () => {
    const thumbnail = extractYouTubeThumbnail(youtubeUrl);
    if (thumbnail) {
      onCoverUpdate(thumbnail);
      setYoutubeUrl('');
      setShowDialog(false);
    }
  };

  const handleImageUrlSubmit = () => {
    if (imageUrl) {
      onCoverUpdate(imageUrl);
      setImageUrl('');
      setShowDialog(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        onCoverUpdate(result);
        setShowDialog(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      {/* Album Cover Display */}
      <div className="relative group">
        {currentCover ? (
          <img
            src={currentCover}
            alt={trackName}
            className="w-full aspect-square rounded-lg object-cover shadow-lg border border-slate-700"
          />
        ) : (
          <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-slate-700">
            <Music className="w-16 h-16 text-slate-600" />
          </div>
        )}

        {/* Overlay on Hover */}
        <div className="absolute inset-0 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button
            size="sm"
            onClick={() => setShowDialog(true)}
            className="bg-green-500 hover:bg-green-600"
          >
            <Download className="w-4 h-4 mr-2" />
            Change Cover
          </Button>
        </div>
      </div>

      {/* Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-semibold text-white">Update Album Cover</h3>

            {/* YouTube URL Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                YouTube URL
              </label>
              <input
                type="text"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-green-500"
              />
              <Button
                size="sm"
                onClick={handleYouTubeSubmit}
                disabled={!youtubeUrl}
                className="w-full bg-green-500 hover:bg-green-600"
              >
                Use YouTube Thumbnail
              </Button>
            </div>

            {/* Image URL Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Image URL
              </label>
              <input
                type="text"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-green-500"
              />
              <Button
                size="sm"
                onClick={handleImageUrlSubmit}
                disabled={!imageUrl}
                className="w-full bg-green-500 hover:bg-green-600"
              >
                Use Image URL
              </Button>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Upload Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white file:bg-green-500 file:text-white file:border-0 file:rounded file:px-3 file:py-1 file:cursor-pointer"
              />
            </div>

            {/* Close Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDialog(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
