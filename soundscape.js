(function () {
  'use strict';
  // All sound is synthesized locally and starts only after an explicit click.
  class Soundscape {
    constructor() { this.context = null; this.enabled = false; this.flashIndex = -1; }
    async toggle() {
      if (!this.context) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return false;
        this.context = new AudioContext();
        const ctx = this.context;
        this.master = ctx.createGain();
        this.master.gain.value = 0;
        this.master.connect(ctx.destination);
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 6, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let last = 0;
        for (let i = 0; i < data.length; i++) {
          last = (last + (Math.random() * 2 - 1) * .018) / 1.018;
          data[i] = last * 4;
        }
        this.noiseBuffer = buffer;
        this.wind = ctx.createBufferSource();
        this.wind.buffer = buffer; this.wind.loop = true;
        this.filter = ctx.createBiquadFilter();
        this.filter.type = 'lowpass'; this.filter.frequency.value = 650;
        this.windGain = ctx.createGain(); this.windGain.gain.value = 0;
        this.wind.connect(this.filter); this.filter.connect(this.windGain); this.windGain.connect(this.master);
        this.wind.start();
        this.choirGain = ctx.createGain(); this.choirGain.gain.value = 0;
        this.choirGain.connect(this.master);
        [130.81, 196, 261.63, 329.63].forEach((frequency, index) => {
          const tone = ctx.createOscillator(); tone.type = 'sine';
          tone.frequency.value = frequency; tone.detune.value = [-3, 2, 4, -2][index];
          const gain = ctx.createGain(); gain.gain.value = .017;
          tone.connect(gain); gain.connect(this.choirGain); tone.start();
        });
      }
      await this.context.resume();
      this.enabled = !this.enabled;
      this.master.gain.setTargetAtTime(this.enabled ? .7 : 0, this.context.currentTime, .35);
      return this.enabled;
    }
    update(state, paused) {
      if (!this.context || !this.enabled) return;
      const ctx = this.context, now = ctx.currentTime;
      this.windGain.gain.setTargetAtTime(paused ? 0 : .05 * state.storm + .16 * state.flood * (1 - .6 * state.light), now, .7);
      this.filter.frequency.setTargetAtTime(450 + state.flood * 1200, now, .6);
      this.choirGain.gain.setTargetAtTime(paused ? 0 : state.light * .8, now, 1.2);
      const index = state.introTime >= 7.55 ? 1 : state.introTime >= 3.72 ? 0 : -1;
      if (index < this.flashIndex) this.flashIndex = -1;
      if (!paused && index > this.flashIndex) {
        this.flashIndex = index;
        const instant = index === 0 ? 3.72 : 7.55;
        if (state.introTime - instant < .25 && !state.reducedMotion) this.thunder();
      }
    }
    thunder() {
      const ctx = this.context;
      const rumble = ctx.createBufferSource(); rumble.buffer = this.noiseBuffer;
      const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 135;
      const gain = ctx.createGain(), now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(.65, now + .15);
      gain.gain.exponentialRampToValueAtTime(.001, now + 3.5);
      rumble.connect(filter); filter.connect(gain); gain.connect(this.master);
      rumble.start(); rumble.stop(now + 3.6);
      rumble.onended = () => { rumble.disconnect(); filter.disconnect(); gain.disconnect(); };
    }
  }
  window.Soundscape = Soundscape;
}());
