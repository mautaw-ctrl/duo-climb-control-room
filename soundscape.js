(function () {
  'use strict';
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, Number(value) || 0));
  const trackSource = './funky-stars.mp3';
  const trackTitle = 'Funky Stars — Quazar of Sanxion (1996)';

  class Soundscape {
    constructor() {
      // No context, media element, or track request exists before an explicit music click.
      this.context = null; this.media = null; this.source = null;
      this.enabled = false; this.active = false; this.disposed = false;
      this.state = { introTime: 0, introMode: '', reducedMotion: false };
      this.visualPaused = false; this.audioPaused = false;
      this.playEpoch = 0; this.toggleEpoch = 0; this.peakVoices = 0;
      this.playPending = null; this.resumePending = null; this.suspendPending = null;
      this.suspendTimer = null;
      this.lastError = ''; this.buffering = false; this.resetOnMetadata = false;
      this.onVisibility = () => this.syncPlayback();
      document.addEventListener('visibilitychange', this.onVisibility);
    }

    async toggle() {
      const epoch = ++this.toggleEpoch;
      if (this.disposed) return false;
      this.enabled = !this.enabled;
      if (!this.enabled) { this.stop(); this.notify(); return false; }
      const retry = Boolean(this.lastError);
      this.lastError = '';
      if (!this.context) {
        try { this.createContext(); }
        catch (error) { this.fail(error); return false; }
      }
      // A fresh user click can recover a failed request; merely clearing the error cannot reset media.error.
      if (retry && this.media) this.media.load();
      await this.syncPlayback();
      // The current intent wins if another click arrived while the track was loading.
      if (epoch === this.toggleEpoch) this.notify();
      return this.enabled;
    }

    createContext() {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) throw new Error('Audio playback is unavailable in this browser.');
      const context = this.context = new AudioContext();
      this.master = context.createGain(); this.master.gain.value = 0;
      this.compressor = context.createDynamicsCompressor();
      this.compressor.threshold.value = -12; this.compressor.knee.value = 12;
      this.compressor.ratio.value = 2; this.compressor.attack.value = .008; this.compressor.release.value = .2;
      this.master.connect(this.compressor); this.compressor.connect(context.destination);
      const media = this.media = document.createElement('audio');
      media.preload = 'none'; media.loop = true; media.src = trackSource;
      this.onMediaError = () => {
        if (this.enabled && !this.disposed) this.fail(new Error('The background track could not be loaded.'));
      };
      this.onWaiting = () => { this.buffering = true; this.notify(); };
      this.onPlaying = () => { this.buffering = false; this.notify(); };
      this.onMetadata = () => {
        if (this.resetOnMetadata) { media.currentTime = 0; this.resetOnMetadata = false; }
        this.notify();
      };
      media.addEventListener('error', this.onMediaError);
      media.addEventListener('waiting', this.onWaiting);
      media.addEventListener('playing', this.onPlaying);
      media.addEventListener('loadedmetadata', this.onMetadata);
      // One media source plays the uploaded tune; no generated sounds are mixed in.
      this.source = context.createMediaElementSource(media); this.source.connect(this.master);
    }

    get blackOpening() { return this.state.introMode === 'anatomy-dreamscape' && this.state.introTime <= 2; }
    get shouldPlay() { return this.enabled && !this.disposed && !this.audioPaused && !document.hidden && !this.blackOpening && !this.lastError; }

    update(state, paused) {
      const previousTime = this.state.introTime;
      this.state = { introTime: clamp(state.introTime, 0, 3600),
        introMode: state.introMode === 'anatomy-dreamscape' ? state.introMode : '', reducedMotion: Boolean(state.reducedMotion) };
      this.visualPaused = Boolean(paused);
      // An opted-in track still plays with a static reduced-motion or no-WebGL scene.
      this.audioPaused = typeof state.audioPaused === 'boolean' ? state.audioPaused : Boolean(paused && !state.reducedMotion);
      if (this.media && this.state.introTime < previousTime - .2) {
        this.stop();
        try { this.media.currentTime = 0; } catch (error) { this.resetOnMetadata = true; }
      }
      this.syncPlayback();
    }

    syncPlayback() {
      if (!this.context || this.context.state === 'closed' || this.disposed) return Promise.resolve();
      if (!this.shouldPlay) { this.stop(); return Promise.resolve(); }
      clearTimeout(this.suspendTimer); this.suspendTimer = null;
      if (this.suspendPending) return this.suspendPending;
      if (this.context.state !== 'running') {
        if (!this.resumePending) {
          this.resumePending = this.context.resume().then(() => {
            this.resumePending = null;
            return this.syncPlayback();
          }, error => {
            this.resumePending = null;
            if (this.shouldPlay) this.fail(error);
          });
        }
        return this.resumePending;
      }
      if (this.active && !this.media.paused) return Promise.resolve();
      if (this.playPending) return this.playPending;
      const epoch = this.playEpoch;
      let request;
      try { request = this.media.play(); }
      catch (error) { this.fail(error); return Promise.resolve(); }
      this.playPending = Promise.resolve(request).then(() => {
        if (epoch !== this.playEpoch || !this.shouldPlay) { if (!this.shouldPlay) this.media.pause(); return; }
        this.active = true; this.buffering = false; this.peakVoices = 1;
        const now = this.context.currentTime;
        this.master.gain.cancelScheduledValues(now); this.master.gain.setValueAtTime(0, now);
        this.master.gain.linearRampToValueAtTime(.72, now + .18);
      }, error => {
        // pause() aborts an in-flight play; a mute or replay must not become a playback error.
        if (epoch === this.playEpoch && this.shouldPlay && error.name !== 'AbortError') this.fail(error);
      }).then(() => {
        this.playPending = null; this.notify();
        if (!this.active && this.shouldPlay) this.syncPlayback();
      });
      return this.playPending;
    }

    stop() {
      if (!this.context || !this.media) return;
      if (this.active || this.playPending || !this.media.paused) this.playEpoch++;
      this.active = false; this.buffering = false; this.media.pause();
      const now = this.context.currentTime;
      this.master.gain.cancelScheduledValues(now); this.master.gain.setValueAtTime(0, now);
      if (this.context.state === 'running' && !this.suspendPending && this.suspendTimer === null) {
        // Zero gain and paused media silence immediately; let the final audio block drain before suspension.
        this.suspendTimer = setTimeout(() => {
          this.suspendTimer = null;
          if (!this.shouldPlay && this.context.state === 'running') {
            this.suspendPending = this.context.suspend().then(() => {
              this.suspendPending = null;
              return this.syncPlayback();
            }, () => { this.suspendPending = null; });
          }
        }, 90);
      }
    }

    fail(error) {
      this.lastError = error && error.message ? error.message : 'The background track could not be played.';
      this.enabled = false; this.stop(); this.notify();
    }

    notify() {
      document.dispatchEvent(new CustomEvent('soundscape-statuschange', { detail: this.getDiagnostics() }));
    }

    get status() {
      if (this.lastError) return 'error';
      if (!this.enabled) return 'off';
      if (document.hidden) return 'hidden';
      if (this.audioPaused) return 'paused';
      if (this.blackOpening) return 'waiting';
      if (this.buffering) return 'buffering';
      return this.active && this.media && !this.media.paused ? 'playing' : 'loading';
    }

    getDiagnostics() {
      const playing = this.active && this.media && !this.media.paused;
      return { enabled: this.enabled, status: this.status,
        contextState: this.context ? this.context.state : 'uncreated', activeVoices: playing ? 1 : 0,
        peakVoices: this.peakVoices, schedulerRunning: false, notesScheduled: 0, thunderCount: 0,
        windLevel: 0, musicLevel: playing ? .72 : 0, introMode: this.state.introMode,
        visualPaused: this.visualPaused, audioPaused: this.audioPaused,
        mediaTime: this.media ? this.media.currentTime : 0,
        mediaPaused: !this.media || this.media.paused, mediaDuration: this.media && Number.isFinite(this.media.duration) ? this.media.duration : 0,
        mediaReadyState: this.media ? this.media.readyState : 0, mediaLoop: this.media ? this.media.loop : false,
        trackTitle, trackSource, lastError: this.lastError };
    }

    dispose() {
      if (this.disposed) return;
      this.enabled = false; this.disposed = true; this.stop();
      clearTimeout(this.suspendTimer); this.suspendTimer = null;
      document.removeEventListener('visibilitychange', this.onVisibility);
      if (this.media) {
        this.media.removeEventListener('error', this.onMediaError);
        this.media.removeEventListener('waiting', this.onWaiting);
        this.media.removeEventListener('playing', this.onPlaying);
        this.media.removeEventListener('loadedmetadata', this.onMetadata);
        this.media.removeAttribute('src'); this.media.load();
      }
      if (this.source) this.source.disconnect();
      if (this.context) this.context.close().catch(() => {});
    }
  }
  window.Soundscape = Soundscape;
}());
