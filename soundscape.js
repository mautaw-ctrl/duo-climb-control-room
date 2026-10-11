(function () {
  'use strict';
  // Original, locally synthesized score; audio starts only on an explicit click.
  const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, Number(v) || 0));
  const hz = note => 440 * Math.pow(2, (note - 69) / 12);
  const beat = 60 / 61;
  const chords = [
    { bass: 38, notes: [50, 57, 62, 65, 69], choir: [62, 65, 69], melody: [69, 74, 72, 69] },
    { bass: 34, notes: [46, 53, 58, 62, 65], choir: [58, 62, 65], melody: [65, 69, 74, 72] },
    { bass: 41, notes: [53, 60, 65, 69, 72], choir: [60, 65, 69], melody: [69, 72, 79, 77] },
    { bass: 36, notes: [48, 55, 60, 62, 67], choir: [60, 62, 67], melody: [67, 74, 76, 74] },
    { bass: 43, notes: [55, 62, 67, 70, 74], choir: [62, 67, 70], melody: [70, 69, 67, 74] },
    { bass: 34, notes: [46, 53, 58, 62, 65], choir: [58, 62, 65], melody: [65, 74, 77, 76] },
    { bass: 38, notes: [50, 57, 62, 65, 69], choir: [62, 65, 69], melody: [69, 72, 74, 76] },
    { bass: 36, notes: [48, 55, 60, 62, 67], choir: [60, 62, 67], melody: [67, 76, 74, 69] }
  ];
  class Soundscape {
    constructor() {
      this.context = null; this.enabled = false; this.active = false; this.flashIndex = -1;
      this.voices = new Set(); this.plucks = new Map();
      this.state = { introTime: 0, storm: 0, flood: 0, light: 0, reveal: 0, scene: 0, reducedMotion: false };
      this.visualPaused = false; this.audioPaused = false; this.step = 0;
      this.notesScheduled = 0; this.thunderCount = 0; this.peakVoices = 0; this.toggleEpoch = 0;
      this.timer = null; this.suspendTimer = null; this.resumePending = null; this.suspendPending = null;
      this.onVisibility = () => this.syncPlayback();
      document.addEventListener('visibilitychange', this.onVisibility);
    }
    async toggle() {
      const epoch = ++this.toggleEpoch;
      this.enabled = !this.enabled;
      if (!this.enabled) { this.stop(); return false; }
      if (!this.context) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) { this.enabled = false; return false; }
        this.createContext(AudioContext);
      }
      clearTimeout(this.suspendTimer); this.suspendTimer = null;
      try { await this.context.resume(); }
      catch (error) { if (epoch === this.toggleEpoch) this.enabled = false; }
      // A stale resume may finish after an off click; reconcile the current state.
      this.syncPlayback();
      return this.enabled;
    }
    createContext(AudioContext) {
      const ctx = this.context = new AudioContext();
      this.master = ctx.createGain(); this.master.gain.value = 0;
      this.compressor = ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -18; this.compressor.knee.value = 18;
      this.compressor.ratio.value = 3; this.compressor.attack.value = .008; this.compressor.release.value = .3;
      this.master.connect(this.compressor); this.compressor.connect(ctx.destination);
      this.music = ctx.createGain(); this.music.gain.value = 0; this.music.connect(this.master);
      this.wet = ctx.createGain(); this.wet.gain.value = .33; this.wet.connect(this.master);
      this.windGain = ctx.createGain(); this.windGain.gain.value = 0; this.windGain.connect(this.master);
      this.windFilter = ctx.createBiquadFilter(); this.windFilter.type = 'lowpass';
      this.windFilter.frequency.value = 680; this.windFilter.Q.value = .55; this.windFilter.connect(this.windGain);
      const real = new Float32Array(8);
      this.vowelWave = ctx.createPeriodicWave(real, new Float32Array([0, 1, .2, .31, .12, .1, .045, .025]));
      this.stringWave = ctx.createPeriodicWave(real, new Float32Array([0, 1, .21, .13, .075, .05, .035, .025]));
      this.noiseBuffer = this.makeNoise(); this.impulse = this.makeImpulse(); this.resetReverb();
    }
    makeNoise() {
      const ctx = this.context, buffer = ctx.createBuffer(1, Math.round(ctx.sampleRate * 8), ctx.sampleRate);
      const data = buffer.getChannelData(0); let brown = 0, slow = 0;
      for (let i = 0; i < data.length; i++) {
        brown = (brown + (Math.random() * 2 - 1) * .033) / 1.026; slow += (brown - slow) * .004;
        const edge = Math.min(1, i / 1200, (data.length - i - 1) / 1200);
        data[i] = (brown - slow) * 2.3 * edge;
      }
      return buffer;
    }
    makeImpulse() {
      const ctx = this.context, length = Math.round(ctx.sampleRate * 3.6);
      const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
      for (let channel = 0; channel < 2; channel++) {
        const data = buffer.getChannelData(channel); let noise = 0;
        for (let i = 0; i < length; i++) {
          noise += ((Math.random() * 2 - 1) - noise) * .19;
          const seconds = i / ctx.sampleRate;
          data[i] = seconds < .027 ? 0 : noise * Math.exp(-seconds * 1.6);
        }
      }
      return buffer;
    }
    resetReverb() {
      if (this.reverb) { this.music.disconnect(this.reverb); this.reverb.disconnect(); this.reverb.buffer = null; }
      this.reverb = this.context.createConvolver(); this.reverb.buffer = this.impulse;
      this.music.connect(this.reverb); this.reverb.connect(this.wet);
    }
    update(state, paused) {
      const previousTime = this.state.introTime;
      this.state = { introTime: clamp(state.introTime, 0, 3600), storm: clamp(state.storm), flood: clamp(state.flood),
        light: clamp(state.light), reveal: clamp(state.reveal), parting: clamp(state.parting),
        scene: clamp(state.scene, 0, 2), reducedMotion: Boolean(state.reducedMotion) };
      this.visualPaused = Boolean(paused);
      // A static reduced-motion picture still permits explicitly enabled music.
      this.audioPaused = typeof state.audioPaused === 'boolean' ? state.audioPaused : Boolean(paused && !state.reducedMotion);
      if (this.state.introTime < previousTime - .2) { this.flashIndex = -1; this.step = 0; }
      this.syncPlayback();
      if (this.active) this.updateMix();
      const index = this.state.introTime >= 7.55 ? 1 : this.state.introTime >= 3.72 ? 0 : -1;
      if (index > this.flashIndex) {
        this.flashIndex = index;
        const instant = index === 0 ? 3.72 : 7.55;
        if (this.active && this.state.introTime - instant < .25 && !state.reducedMotion) this.thunder();
      }
    }
    syncPlayback() {
      if (!this.context || this.context.state === 'closed') return;
      const shouldPlay = this.enabled && !this.audioPaused && !document.hidden;
      if (!shouldPlay) {
        if (this.active || (!this.suspendTimer && this.context.state === 'running')) this.stop();
        return;
      }
      clearTimeout(this.suspendTimer); this.suspendTimer = null;
      // Wait for an in-flight suspension before resuming, including rapid clicks.
      if (this.suspendPending) return;
      if (this.context.state === 'running') { if (!this.active) this.start(); return; }
      if (!this.resumePending) this.resumePending = this.context.resume().then(() => {
        this.resumePending = null;
        if (this.context.state === 'running') this.syncPlayback();
      }, () => { this.resumePending = null; });
    }
    start() {
      if (this.active) return;
      this.active = true;
      const ctx = this.context, now = ctx.currentTime;
      this.resetReverb(); this.wind = ctx.createBufferSource();
      this.wind.buffer = this.noiseBuffer; this.wind.loop = true; this.wind.connect(this.windFilter);
      this.wind.start(now, Math.random() * 6); this.nextStep = now + .08;
      this.master.gain.cancelScheduledValues(now); this.master.gain.setValueAtTime(0, now);
      this.master.gain.linearRampToValueAtTime(.72, now + .36);
      this.updateMix(); this.schedule();
      this.timer = setInterval(() => { this.updateMix(); this.schedule(); }, 65);
    }
    stop() {
      if (!this.context) return;
      this.active = false; clearInterval(this.timer); this.timer = null;
      const ctx = this.context, now = ctx.currentTime;
      this.master.gain.cancelScheduledValues(now); this.master.gain.setValueAtTime(this.master.gain.value, now);
      this.master.gain.linearRampToValueAtTime(0, now + .055);
      if (this.wind) {
        const wind = this.wind; wind.onended = () => wind.disconnect();
        try { wind.stop(now + .06); } catch (error) { wind.disconnect(); }
        this.wind = null;
      }
      for (const voice of this.voices) {
        for (const source of voice.sources) { try { source.stop(now + .06); } catch (error) { /* Already ended. */ } }
      }
      clearTimeout(this.suspendTimer);
      this.suspendTimer = setTimeout(() => {
        this.suspendTimer = null;
        if (!this.active) {
          for (const voice of this.voices) voice.cleanup();
          if (this.reverb) this.reverb.buffer = null;
          if (ctx.state === 'running') this.suspendPending = ctx.suspend().then(() => {
            this.suspendPending = null; this.syncPlayback();
          }, () => { this.suspendPending = null; });
        }
      }, 140);
    }
    target(param, value, smoothing) {
      const now = this.context.currentTime;
      param.cancelScheduledValues(now); param.setTargetAtTime(value, now, smoothing);
    }
    updateMix() {
      if (!this.active) return;
      const state = this.state, now = this.context.currentTime;
      this.warmth = clamp(state.light * .74 + state.reveal * .26);
      const opening = 1 - clamp((state.introTime - 4) / 15);
      const gust = .86 + .1 * Math.sin(now * .73) + .055 * Math.sin(now * 1.31 + 2);
      this.windLevel = (.31 * opening + .12 * state.storm + .065 * state.flood) * (1 - this.warmth * .88) * gust;
      this.musicLevel = (.03 + .56 * clamp((state.introTime - 1.8) / 6.4)) * (1 + this.warmth * .14);
      this.target(this.windGain.gain, this.windLevel, .38);
      this.target(this.windFilter.frequency, 460 + 420 * state.storm + 210 * state.flood, .8);
      this.target(this.music.gain, this.musicLevel, .9);
      this.target(this.wet.gain, .29 + .16 * this.warmth, 1.2);
    }
    schedule() {
      if (!this.active) return;
      const now = this.context.currentTime;
      // A delayed callback never catches up by playing a burst of stale notes.
      if (this.nextStep < now - .15) this.nextStep = now + .03;
      let count = 0;
      while (this.nextStep < now + .18 && count++ < 3) {
        this.scheduleStep(this.step++, this.nextStep); this.nextStep += beat / 2;
      }
    }
    scheduleStep(step, time) {
      const bar = Math.floor(step / 8), slot = step % 8, chord = chords[bar % chords.length];
      const scene = this.state.scene, warmth = this.warmth;
      if (slot === 0) {
        this.tone('strings', chord.bass, time, beat * 4.8, .068 - scene * .009, -.18);
        chord.choir.forEach((note, i) => this.tone('choir', note, time + i * .045, beat * 5.4, .009 + warmth * .034 + scene * .004, (i - 1) * .4));
      }
      // A broken lute chord answers an independent four-note melodic phrase.
      const arpIndex = [0, 2, 3, 5, 7].indexOf(slot);
      if (arpIndex !== -1) {
        const pattern = bar % 2 ? [0, 2, 1, 4, 2] : [0, 1, 3, 2, 4];
        this.pluck(chord.notes[pattern[arpIndex]], time + (slot % 2 ? .014 : 0), .12 - warmth * .018, -.38 + arpIndex * .13);
      }
      const phraseIndex = (bar % 2 ? [0, 3, 5, 6] : [1, 3, 5, 7]).indexOf(slot);
      if (phraseIndex !== -1) {
        const note = chord.melody[phraseIndex]; this.pluck(note, time + .024, .1 + warmth * .04, .2);
        if (warmth > .23) this.tone('air', note, time + .055, beat * 1.65, .01 + warmth * .02, -.1);
      }
      // Later sections gently reveal high harp-like bells and airy countertones.
      if (warmth > .42 && (slot === 2 || (scene > .7 && slot === 6))) {
        const note = chord.choir[(bar + (slot === 6 ? 1 : 0)) % 3] + 12;
        this.tone('bell', note, time + .025, beat * 2.8, .024 + Math.min(scene, 1) * .012, slot === 2 ? -.55 : .55);
      }
    }
    register(sources, nodes, endTime) {
      const voice = { sources, cleanup: null }; let ended = 0;
      voice.cleanup = () => {
        if (!this.voices.delete(voice)) return;
        for (const node of nodes) { try { node.disconnect(); } catch (error) { /* Disconnected. */ } }
      };
      this.voices.add(voice); this.peakVoices = Math.max(this.peakVoices, this.voices.size);
      for (const source of sources) {
        source.onended = () => { if (++ended === sources.length) voice.cleanup(); }; source.stop(endTime);
      }
      this.notesScheduled++;
    }
    pluckBuffer(note) {
      if (this.plucks.has(note)) return this.plucks.get(note);
      const ctx = this.context, period = Math.max(2, Math.round(ctx.sampleRate / hz(note)));
      const buffer = ctx.createBuffer(1, Math.round(ctx.sampleRate * 2.35), ctx.sampleRate);
      const data = buffer.getChannelData(0), ring = new Float32Array(period); let mean = 0;
      for (let i = 0; i < period; i++) { ring[i] = Math.random() * 2 - 1; mean += ring[i] / period; }
      for (let i = 0; i < period; i++) ring[i] -= mean;
      for (let i = 0; i < data.length; i++) {
        const index = i % period, sample = ring[index];
        ring[index] = .994 * (.52 * sample + .48 * ring[(index + 1) % period]);
        data[i] = sample * Math.min(1, i / 90) * Math.min(1, (data.length - i) / 1600);
      }
      if (this.plucks.size >= 48) this.plucks.delete(this.plucks.keys().next().value);
      this.plucks.set(note, buffer); return buffer;
    }
    pluck(note, time, level, pan) {
      if (this.voices.size >= 36) return;
      const ctx = this.context, source = ctx.createBufferSource(); source.buffer = this.pluckBuffer(note);
      const gain = ctx.createGain(), panner = ctx.createStereoPanner(); gain.gain.value = level; panner.pan.value = pan;
      source.connect(gain); gain.connect(panner); panner.connect(this.music); source.start(time);
      this.register([source], [source, gain, panner], time + source.buffer.duration);
    }
    tone(kind, note, time, duration, level, pan) {
      if (this.voices.size >= 36) return;
      const ctx = this.context, gain = ctx.createGain(), panner = ctx.createStereoPanner(), filter = ctx.createBiquadFilter();
      filter.type = 'lowpass'; filter.frequency.value = kind === 'strings' ? 540 : kind === 'choir' ? 2200 : 3400; filter.Q.value = .45;
      const sources = [], nodes = [gain, panner, filter], count = kind === 'air' ? 1 : 2;
      for (let i = 0; i < count; i++) {
        const tone = ctx.createOscillator(); tone.frequency.value = hz(note) * (kind === 'bell' && i === 1 ? 2.003 : 1);
        tone.detune.value = kind === 'bell' ? 0 : i === 0 ? -3.5 : 3.5;
        if (kind === 'choir') tone.setPeriodicWave(this.vowelWave);
        else if (kind === 'strings') tone.setPeriodicWave(this.stringWave); else tone.type = 'sine';
        tone.connect(filter); sources.push(tone); nodes.push(tone);
      }
      filter.connect(gain);
      if (kind === 'choir') {
        const formant = ctx.createBiquadFilter(); formant.type = 'peaking';
        formant.frequency.value = 820; formant.Q.value = 1.15; formant.gain.value = 6;
        gain.connect(formant); formant.connect(panner); nodes.push(formant);
      } else gain.connect(panner);
      panner.pan.value = pan; panner.connect(this.music);
      const attack = kind === 'bell' ? .013 : kind === 'air' ? .24 : .78;
      gain.gain.setValueAtTime(0, time); gain.gain.linearRampToValueAtTime(level / count, time + attack);
      if (kind === 'bell') gain.gain.exponentialRampToValueAtTime(.0001, time + duration);
      else { gain.gain.setValueAtTime(level / count, time + Math.max(attack, duration - 1.05)); gain.gain.linearRampToValueAtTime(0, time + duration); }
      for (const source of sources) source.start(time);
      this.register(sources, nodes, time + duration + .04);
    }
    thunder() {
      if (!this.active || this.voices.size >= 36) return;
      const ctx = this.context, now = ctx.currentTime, rumble = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
      rumble.buffer = this.noiseBuffer; filter.type = 'lowpass'; filter.frequency.value = 145; filter.Q.value = .65;
      gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(.54, now + .11); gain.gain.exponentialRampToValueAtTime(.0001, now + 2.75);
      rumble.connect(filter); filter.connect(gain); gain.connect(this.master); rumble.start(now, .4);
      this.register([rumble], [rumble, filter, gain], now + 2.8); this.thunderCount++;
    }
    get status() { return !this.enabled ? 'off' : this.active ? 'playing' : document.hidden ? 'hidden' : 'paused'; }
    getDiagnostics() {
      return { enabled: this.enabled, status: this.status, contextState: this.context ? this.context.state : 'uncreated',
        activeVoices: this.voices.size, peakVoices: this.peakVoices, cachedPlucks: this.plucks.size,
        schedulerRunning: this.timer !== null, notesScheduled: this.notesScheduled, musicalStep: this.step,
        thunderCount: this.thunderCount, windLevel: this.active ? this.windLevel : 0,
        musicLevel: this.active ? this.musicLevel : 0, warmth: this.warmth || 0,
        visualPaused: this.visualPaused, audioPaused: this.audioPaused };
    }
    dispose() {
      this.enabled = false; this.stop(); document.removeEventListener('visibilitychange', this.onVisibility);
      if (this.context) this.context.close().catch(() => {});
    }
  }
  window.Soundscape = Soundscape;
}());
