import { useState, useRef, useEffect } from 'react';
import { Search, Youtube, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StreamingTrack } from '@/config/streaming';
import { YouTubeSearchService } from '@/services/youtubeSearch';

interface SearchBarProps {
  onTrackSelect: (track: StreamingTrack) => void;
  onAddToQueue: (track: StreamingTrack) => void;
}

export function SearchBar({ onTrackSelect, onAddToQueue }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StreamingTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number>();

  const youtubeSearch = YouTubeSearchService.getInstance();

  // Auto-close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-close after inactivity
  useEffect(() => {
    if (showResults) {
      // Auto-close after 30 seconds of inactivity
      const inactivityTimeout = window.setTimeout(() => {
        setShowResults(false);
      }, 30000);

      return () => clearTimeout(inactivityTimeout);
    }
  }, [showResults]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setShowResults(true);

    try {
      // Search YouTube only (Spotify on hold)
      const youtubeResults = await youtubeSearch.search(query, 20);
      setResults(youtubeResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowResults(false);
    }
  };

  const handleBlur = () => {
    // Small delay to allow click events to fire
    timeoutRef.current = window.setTimeout(() => {
      setShowResults(false);
    }, 200);
  };

  const handleFocus = () => {
    // Clear timeout if user returns focus
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (results.length > 0) {
      setShowResults(true);
    }
  };

  const handleSelect = (track: StreamingTrack) => {
    onTrackSelect(track);
    setShowResults(false); // Auto-close
    setQuery(''); // Clear search
  };

  const handleAdd = (track: StreamingTrack, e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToQueue(track);
    // Don't close - user might want to add more
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search songs on YouTube..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            onBlur={handleBlur}
            onFocus={handleFocus}
            className="pl-10"
          />
        </div>
        <Button 
          onClick={handleSearch} 
          disabled={!query.trim() || isSearching}
          className="gap-2 font-semibold shadow-lg hover:shadow-xl transition-all ring-2 ring-primary/20 hover:ring-primary/40 px-6"
        >
          <Youtube className="w-5 h-5" />
          {isSearching ? 'Searching...' : 'Search'}
        </Button>
      </div>

      {/* Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-xl shadow-2xl max-h-[500px] overflow-y-auto z-50">
          <div className="p-2">
            {results.map((track) => (
              <div
                key={track.id}
                className="flex items-center gap-3 p-3 hover:bg-accent rounded-lg cursor-pointer group transition-colors"
                onClick={() => handleSelect(track)}
              >
                {/* Thumbnail */}
                <div className="relative w-16 h-12 flex-shrink-0">
                  <img
                    src={track.coverUrl}
                    alt={track.name}
                    className="w-full h-full object-cover rounded"
                  />
                  {/* YouTube Badge */}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-background rounded-full flex items-center justify-center border border-border">
                    <Youtube className="w-3 h-3 text-red-500" />
                  </div>
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{track.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                </div>

                {/* Duration */}
                <div className="text-sm text-muted-foreground">
                  {formatDuration(track.duration)}
                </div>

                {/* Add to Queue Button */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => handleAdd(track, e)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity gap-1 flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showResults && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
}
