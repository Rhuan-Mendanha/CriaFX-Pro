import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Music, LogOut } from 'lucide-react';
import { SpotifyAuthService } from '@/services/spotifyAuth';

export function SpotifyLogin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const spotifyAuth = SpotifyAuthService.getInstance();

  useEffect(() => {
    // Check if returning from Spotify auth
    if (window.location.hash.includes('access_token')) {
      const success = spotifyAuth.handleCallback();
      if (success) {
        setIsAuthenticated(true);
      }
    } else {
      setIsAuthenticated(spotifyAuth.isAuthenticated());
    }
  }, []);

  const handleLogin = () => {
    spotifyAuth.login();
  };

  const handleLogout = () => {
    spotifyAuth.logout();
    setIsAuthenticated(false);
  };

  if (isAuthenticated) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleLogout}
        className="gap-2"
      >
        <Music className="w-4 h-4 text-green-500" />
        <span className="hidden sm:inline">Spotify Connected</span>
        <LogOut className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogin}
      className="gap-2 bg-green-500/10 hover:bg-green-500/20 border-green-500/30"
    >
      <Music className="w-4 h-4 text-green-500" />
      <span className="hidden sm:inline">Connect Spotify</span>
    </Button>
  );
}
