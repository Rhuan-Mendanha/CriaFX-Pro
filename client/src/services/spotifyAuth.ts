import { API_CONFIG } from '@/config/streaming';

export class SpotifyAuthService {
  private static instance: SpotifyAuthService;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private expiresAt: number | null = null;

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): SpotifyAuthService {
    if (!SpotifyAuthService.instance) {
      SpotifyAuthService.instance = new SpotifyAuthService();
    }
    return SpotifyAuthService.instance;
  }

  private loadFromStorage() {
    this.accessToken = localStorage.getItem('spotify_access_token');
    this.refreshToken = localStorage.getItem('spotify_refresh_token');
    const expiresAt = localStorage.getItem('spotify_expires_at');
    this.expiresAt = expiresAt ? parseInt(expiresAt) : null;
  }

  private saveToStorage() {
    if (this.accessToken) {
      localStorage.setItem('spotify_access_token', this.accessToken);
    }
    if (this.refreshToken) {
      localStorage.setItem('spotify_refresh_token', this.refreshToken);
    }
    if (this.expiresAt) {
      localStorage.setItem('spotify_expires_at', this.expiresAt.toString());
    }
  }

  isAuthenticated(): boolean {
    if (!this.accessToken || !this.expiresAt) return false;
    return Date.now() < this.expiresAt;
  }

  getAccessToken(): string | null {
    if (this.isAuthenticated()) {
      return this.accessToken;
    }
    return null;
  }

  login() {
    const { clientId, redirectUri, scopes } = API_CONFIG.spotify;
    const authUrl = new URL('https://accounts.spotify.com/authorize');
    
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('response_type', 'token');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', scopes);
    authUrl.searchParams.append('show_dialog', 'true');

    window.location.href = authUrl.toString();
  }

  handleCallback(): boolean {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    
    const accessToken = params.get('access_token');
    const expiresIn = params.get('expires_in');

    if (accessToken && expiresIn) {
      this.accessToken = accessToken;
      this.expiresAt = Date.now() + parseInt(expiresIn) * 1000;
      this.saveToStorage();
      
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return true;
    }

    return false;
  }

  logout() {
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = null;
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_expires_at');
  }
}
