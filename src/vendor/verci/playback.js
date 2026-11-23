// Central playback manager: one interface over three real engines.
//  - 'audio'    HTML <audio> element (Audius, Jamendo: providers that expose a stream URL they permit us to play)
//  - 'yt'       the official YouTube IFrame Player (an embed; never routed through the audio element)
//  - 'mk'       Apple MusicKit JS (authorised subscribers only)
// Each engine reports honest capabilities. No simulated playback anywhere.
import { ensureMusicKit } from './providers/musickit.js';

export class PlaybackManager extends EventTarget {
  constructor(ytMount) {
    super();
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.ytMount = ytMount;
    this.yt = null; this.ytReady = null; this.mode = null; this.volume = 0.8; this.rate = 1; this.queue = []; this.index = -1; this.buffering = false;
    const a = this.audio;
    for (const ev of ['play', 'pause', 'playing', 'waiting', 'loadedmetadata', 'durationchange', 'timeupdate'])
      a.addEventListener(ev, () => this.emit('state'));
    a.addEventListener('ended', () => this.emit('ended'));
    a.addEventListener('error', () => { if (this.mode === 'audio' && a.src) this.emit('error', 'This audio could not be loaded.'); });
  }
  emit(type, detail) { this.dispatchEvent(new CustomEvent(type, { detail })); }

  // ---- queue (the app opens whatever step() returns)
  setQueue(list, i) { this.queue = list; this.index = i; this.emit('queue'); }
  step(d) { if (this.queue.length < 2) return null; this.index = (this.index + d + this.queue.length) % this.queue.length; this.emit('queue'); return this.queue[this.index]; }
  get caps() { const e = this.current?.engine; return { seek: !!e, volume: !!e, rate: e === 'audio' || e === 'youtube', provider: e || null }; }
  setRate(r) { this.rate = r; this.audio.playbackRate = r; try { this.yt?.setPlaybackRate?.(r); } catch {} }

  async load(p, autoplay = true) {
    this.stop();
    const generation = this.generation;
    this.current = p;
    if (p.engine === 'musickit') {
      this.mode = 'mk'; this.mk = await ensureMusicKit();
      if (!this.mkBound) {
        this.mkBound = true;
        this.mk.addEventListener('playbackStateDidChange', () => { this.buffering = [1, 6, 7, 8].includes(this.mk.playbackState); this.emit('state'); if (this.mk.playbackState === 10 || this.mk.playbackState === 5) this.emit('ended'); });
        this.mk.addEventListener('mediaPlaybackError', e => this.emit('error', 'Apple Music could not play this song' + (e?.message ? ': ' + e.message : '.')));
      }
      this.mk.volume = this.volume;
      await this.mk.setQueue({ song: p.songId, startPlaying: !!autoplay });
      if (autoplay) await this.mk.play();
    } else if (p.engine === 'youtube' || p.provider === 'youtube') {
      this.mode = 'yt';
      await this.ensureYT();
      if (generation !== this.generation) return;
      this.yt.loadVideoById(p.videoId);
      this.yt.setVolume(this.volume * 100);
      if (!autoplay) this.yt.pauseVideo();
    } else {
      this.mode = 'audio';
      this.audio.src = p.url;
      this.audio.volume = this.volume; this.audio.playbackRate = this.rate;
      if (autoplay) { try { await this.audio.play(); } catch (e) { this.emit('error', 'Playback was blocked. Press play to start.'); } }
    }
    this.emit('state');
  }
  stop() {
    this.generation = (this.generation || 0) + 1;
    this.audio.pause(); this.audio.removeAttribute('src'); this.audio.load(); try { this.mk?.stop(); } catch {}
    if (this.yt && this.yt.stopVideo) try { this.yt.stopVideo(); } catch {}
    this.mode = null;
  }
  ensureYT() {
    if (this.ytReady) return this.ytReady;
    this.ytReady = new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.ytReady = null; reject(new Error("YouTube player timed out. Check your connection or content blocker.")); }, 20000);
      const make = () => {
        this.yt = new YT.Player(this.ytMount, {
          width: '100%', height: '100%', playerVars: { playsinline: 1, rel: 0, modestbranding: 1, origin: location.origin },
          events: {
            onReady: () => { clearTimeout(timer); resolve(); },
            onStateChange: e => { this.emit('state'); if (e.data === 0) this.emit('ended'); },
            onError: e => this.emit('error', [101, 150].includes(e.data) ? 'The owner of this video does not allow embedded playback.' : 'YouTube could not play this video.')
          }
        });
      };
      if (window.YT && YT.Player) return make();
      const previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { previousReady?.(); make(); };
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      s.onerror = () => { clearTimeout(timer); this.ytReady = null; reject(new Error('The YouTube player could not be loaded.')); };
      document.head.appendChild(s);
    });
    return this.ytReady;
  }
  get playing() {
    if (this.mode === 'mk') return this.mk?.playbackState === 2;
    if (this.mode === 'yt') return this.yt?.getPlayerState?.() === 1;
    return this.mode === 'audio' && !this.audio.paused && !this.audio.ended;
  }
  get time() { if (this.mode === 'mk') return this.mk?.currentPlaybackTime || 0; return this.mode === 'yt' ? (this.yt?.getCurrentTime?.() || 0) : this.audio.currentTime || 0; }
  get duration() {
    const d = this.mode === 'mk' ? this.mk?.currentPlaybackDuration : this.mode === 'yt' ? this.yt?.getDuration?.() : this.audio.duration;
    return isFinite(d) && d > 0 ? d : 0;
  }
  play() { this.mode === 'mk' ? this.mk?.play() : this.mode === 'yt' ? this.yt?.playVideo() : this.audio.play().catch(() => {}); }
  pause() { this.mode === 'mk' ? this.mk?.pause() : this.mode === 'yt' ? this.yt?.pauseVideo() : this.audio.pause(); }
  toggle() { this.playing ? this.pause() : this.play(); }
  seek(s) { this.mode === 'mk' ? this.mk?.seekToTime(s) : this.mode === 'yt' ? this.yt?.seekTo(s, true) : (this.audio.currentTime = s); this.emit('state'); }
  setVolume(v) { this.volume = v; this.audio.volume = v; this.yt?.setVolume?.(v * 100); if (this.mk) this.mk.volume = v; }
}
