// YouTube Player Service
// Manages YouTube IFrame API for playing tracks

export interface YouTubePlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

type PlayerStateCallback = (state: YouTubePlayerState) => void;

export class YouTubePlayerService {
  private static instance: YouTubePlayerService;
  private player: any = null;
  private playerReady = false;
  private currentVideoId: string | null = null;
  private stateCallback: PlayerStateCallback | null = null;
  private updateInterval: number | null = null;

  private constructor() {
    this.loadYouTubeAPI();
  }

  static getInstance(): YouTubePlayerService {
    if (!YouTubePlayerService.instance) {
      YouTubePlayerService.instance = new YouTubePlayerService();
    }
    return YouTubePlayerService.instance;
  }

  private loadYouTubeAPI() {
    // Check if API already loaded
    if ((window as any).YT && (window as any).YT.Player) {
      this.initPlayer();
      return;
    }

    // Load YouTube IFrame API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // API ready callback
    (window as any).onYouTubeIframeAPIReady = () => {
      console.log('YouTube IFrame API loaded');
      this.initPlayer();
    };
  }

  private initPlayer() {
    // Create hidden container for player
    let container = document.getElementById('youtube-player-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'youtube-player-container';
      container.style.display = 'none';
      document.body.appendChild(container);
    }

    // Create player
    this.player = new (window as any).YT.Player('youtube-player-container', {
      height: '0',
      width: '0',
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        playsinline: 1,
      },
      events: {
        onReady: this.onPlayerReady.bind(this),
        onStateChange: this.onPlayerStateChange.bind(this),
        onError: this.onPlayerError.bind(this),
      },
    });
  }

  private onPlayerReady() {
    console.log('YouTube Player ready');
    this.playerReady = true;
  }

  private onPlayerStateChange(event: any) {
    const state = event.data;
    console.log('YouTube Player state:', state);

    if (this.stateCallback) {
      this.stateCallback(this.getState());
    }

    // Start update interval when playing
    if (state === (window as any).YT.PlayerState.PLAYING) {
      this.startUpdateInterval();
    } else {
      this.stopUpdateInterval();
    }
  }

  private onPlayerError(event: any) {
    console.error('YouTube Player error:', event.data);
  }

  private startUpdateInterval() {
    if (this.updateInterval) return;
    
    this.updateInterval = window.setInterval(() => {
      if (this.stateCallback) {
        this.stateCallback(this.getState());
      }
    }, 1000);
  }

  private stopUpdateInterval() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  async play(videoId: string): Promise<void> {
    if (!this.playerReady) {
      console.warn('Player not ready yet');
      return;
    }

    try {
      if (this.currentVideoId !== videoId) {
        this.currentVideoId = videoId;
        await this.player.loadVideoById(videoId);
      } else {
        await this.player.playVideo();
      }
      console.log('Playing video:', videoId);
    } catch (error) {
      console.error('Error playing video:', error);
    }
  }

  pause(): void {
    if (this.player && this.playerReady) {
      this.player.pauseVideo();
    }
  }

  stop(): void {
    if (this.player && this.playerReady) {
      this.player.stopVideo();
      this.currentVideoId = null;
    }
  }

  setVolume(volume: number): void {
    if (this.player && this.playerReady) {
      this.player.setVolume(volume * 100); // YouTube uses 0-100
    }
  }

  seekTo(seconds: number): void {
    if (this.player && this.playerReady) {
      this.player.seekTo(seconds, true);
    }
  }

  getState(): YouTubePlayerState {
    if (!this.player || !this.playerReady) {
      return {
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        volume: 1,
      };
    }

    const playerState = this.player.getPlayerState();
    const isPlaying = playerState === (window as any).YT?.PlayerState?.PLAYING;

    return {
      isPlaying,
      currentTime: this.player.getCurrentTime() || 0,
      duration: this.player.getDuration() || 0,
      volume: (this.player.getVolume() || 100) / 100,
    };
  }

  onStateChange(callback: PlayerStateCallback): void {
    this.stateCallback = callback;
  }

  getCurrentVideoId(): string | null {
    return this.currentVideoId;
  }

  isReady(): boolean {
    return this.playerReady;
  }
}
