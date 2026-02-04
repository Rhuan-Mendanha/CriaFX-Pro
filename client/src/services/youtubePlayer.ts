/* global YT */

type PlayerStateCallback = (isPlaying: boolean) => void;

export class YouTubePlayerService {
  private static instance: YouTubePlayerService;
  private player: YT.Player | null = null;
  private ready = false;
  private currentVideoId: string | null = null;
  private stateCallback?: PlayerStateCallback;

  static getInstance() {
    if (!YouTubePlayerService.instance) {
      YouTubePlayerService.instance = new YouTubePlayerService();
    }
    return YouTubePlayerService.instance;
  }

  init(container: HTMLElement, onStateChange?: PlayerStateCallback) {
    this.stateCallback = onStateChange;

    if ((window as any).YT?.Player) {
      this.createPlayer(container);
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(tag);

    (window as any).onYouTubeIframeAPIReady = () => {
      this.createPlayer(container);
    };
  }

  private createPlayer(container: HTMLElement) {
    this.player = new YT.Player(container, {
      height: '0',
      width: '0',
      playerVars: {
        autoplay: 0,
        controls: 0,
        playsinline: 1,
        rel: 0,
        modestbranding: 1,
      },
      events: {
        onReady: () => {
          this.ready = true;
        },
        onStateChange: (e) => {
          if (!this.stateCallback) return;
          this.stateCallback(e.data === YT.PlayerState.PLAYING);
        },
        onError: (e) => {
          console.error('YouTube Error:', e.data);
          (window as any).toast?.error?.('This YouTube video cannot be played (embed restricted)');
        },
      },
    });
  }

  load(videoId: string) {
    if (!this.ready || !this.player) return;
    this.currentVideoId = videoId;
    this.player.loadVideoById(videoId);
  }

  play() {
    this.player?.playVideo();
  }

  pause() {
    this.player?.pauseVideo();
  }

  stop() {
    this.player?.stopVideo();
    this.currentVideoId = null;
  }

  setVolume(volume: number) {
    this.player?.setVolume(Math.floor(volume * 100));
  }
}
