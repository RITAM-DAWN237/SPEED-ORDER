/**
 * Audio.js - Dynamic Procedural Sound System via Web Audio API
 * Generates realistic engine revs, tire screeches, collisions, nitro boosts,
 * countdown beeps, victory fanfares, and synth racing background music
 * with zero external asset dependencies or broken links!
 */

import { storage } from './Storage.js';

class AudioManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.initialized = false;

    // Audio nodes
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;

    // Engine sound state
    this.engineOsc1 = null;
    this.engineOsc2 = null;
    this.engineSub = null;
    this.engineGain = null;
    this.engineFilter = null;
    this.engineRunning = false;

    // Tire squeal state
    this.tireNoise = null;
    this.tireGain = null;
    this.tireFilter = null;

    // Nitro sound state
    this.nitroGain = null;
    this.nitroFilter = null;
    this.nitroNoise = null;

    // BGM state
    this.bgmTimer = null;
    this.bgmStep = 0;
    this.bgmPlaying = false;
  }

  init() {
    if (this.initialized) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      // Master bus
      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.updateVolumes();
      this.setupEngineSynth();
      this.setupTireSynth();
      this.setupNitroSynth();

      this.initialized = true;
    } catch (e) {
      console.warn('[Audio] Web Audio API not supported or blocked:', e);
    }
  }

  ensureContext() {
    if (!this.initialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  updateVolumes() {
    if (!this.ctx) return;
    const s = storage.settings;
    const now = this.ctx.currentTime;
    this.masterGain.gain.setValueAtTime(s.masterVolume, now);
    this.musicGain.gain.setValueAtTime(s.musicVolume * 0.45, now);
    this.sfxGain.gain.setValueAtTime(s.sfxVolume * 0.8, now);
  }

  // Helper to create a noise buffer
  createNoiseBuffer(duration = 2) {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /* ---------------- ENGINE SYNTHESIZER ---------------- */
  setupEngineSynth() {
    if (!this.ctx) return;

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    this.engineGain.connect(this.engineFilter);
    this.engineFilter.connect(this.sfxGain);
  }

  startEngine() {
    this.ensureContext();
    if (this.engineRunning || !this.ctx) return;

    const t = this.ctx.currentTime;
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc2 = this.ctx.createOscillator();
    this.engineSub = this.ctx.createOscillator();

    this.engineOsc1.type = 'sawtooth';
    this.engineOsc2.type = 'triangle';
    this.engineSub.type = 'sine';

    this.engineOsc1.frequency.setValueAtTime(45, t);
    this.engineOsc2.frequency.setValueAtTime(46, t);
    this.engineSub.frequency.setValueAtTime(22.5, t);

    this.engineOsc1.connect(this.engineGain);
    this.engineOsc2.connect(this.engineGain);
    this.engineSub.connect(this.engineGain);

    this.engineOsc1.start();
    this.engineOsc2.start();
    this.engineSub.start();

    this.engineGain.gain.setTargetAtTime(0.25, t, 0.05);
    this.engineRunning = true;
  }

  updateEngine(rpmRatio, throttle) {
    if (!this.engineRunning || !this.ctx) return;
    const t = this.ctx.currentTime;
    const ratio = Math.max(0, Math.min(1.2, rpmRatio));

    // Base idle frequency 45Hz -> redline 380Hz
    const baseFreq = 42 + ratio * 280;
    this.engineOsc1.frequency.setTargetAtTime(baseFreq, t, 0.03);
    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.015, t, 0.03);
    this.engineSub.frequency.setTargetAtTime(baseFreq * 0.5, t, 0.03);

    // Filter opens up under throttle
    const filterFreq = 350 + ratio * 2400 + (throttle ? 700 : 0);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, t, 0.04);

    const gain = 0.15 + (ratio * 0.18) + (throttle ? 0.08 : 0);
    this.engineGain.gain.setTargetAtTime(gain, t, 0.04);
  }

  stopEngine() {
    if (!this.engineRunning || !this.ctx) return;
    try {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      setTimeout(() => {
        if (this.engineOsc1) {
          this.engineOsc1.stop();
          this.engineOsc2.stop();
          this.engineSub.stop();
        }
        this.engineRunning = false;
      }, 60);
    } catch (e) {
      this.engineRunning = false;
    }
  }

  /* ---------------- TIRE SQUEAL ---------------- */
  setupTireSynth() {
    if (!this.ctx) return;
    this.tireGain = this.ctx.createGain();
    this.tireGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.tireFilter = this.ctx.createBiquadFilter();
    this.tireFilter.type = 'bandpass';
    this.tireFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    this.tireFilter.Q.setValueAtTime(6.0, this.ctx.currentTime);

    const noiseBuffer = this.createNoiseBuffer(2);
    if (noiseBuffer) {
      this.tireNoise = this.ctx.createBufferSource();
      this.tireNoise.buffer = noiseBuffer;
      this.tireNoise.loop = true;
      this.tireNoise.connect(this.tireFilter);
      this.tireFilter.connect(this.tireGain);
      this.tireGain.connect(this.sfxGain);
      this.tireNoise.start();
    }
  }

  updateTireSqueal(slipRatio) {
    if (!this.tireGain || !this.ctx) return;
    const t = this.ctx.currentTime;
    const targetGain = slipRatio > 0.25 ? Math.min(0.35, (slipRatio - 0.25) * 0.7) : 0;
    this.tireGain.gain.setTargetAtTime(targetGain, t, 0.04);
    if (targetGain > 0) {
      this.tireFilter.frequency.setTargetAtTime(1200 + slipRatio * 800, t, 0.04);
    }
  }

  /* ---------------- NITRO BOOST ---------------- */
  setupNitroSynth() {
    if (!this.ctx) return;
    this.nitroGain = this.ctx.createGain();
    this.nitroGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.nitroFilter = this.ctx.createBiquadFilter();
    this.nitroFilter.type = 'highpass';
    this.nitroFilter.frequency.setValueAtTime(800, this.ctx.currentTime);

    const noiseBuffer = this.createNoiseBuffer(2);
    if (noiseBuffer) {
      this.nitroNoise = this.ctx.createBufferSource();
      this.nitroNoise.buffer = noiseBuffer;
      this.nitroNoise.loop = true;
      this.nitroNoise.connect(this.nitroFilter);
      this.nitroFilter.connect(this.nitroGain);
      this.nitroGain.connect(this.sfxGain);
      this.nitroNoise.start();
    }
  }

  setNitroSound(active) {
    if (!this.nitroGain || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.nitroGain.gain.setTargetAtTime(active ? 0.35 : 0, t, 0.06);
    if (active) {
      this.nitroFilter.frequency.setValueAtTime(600, t);
      this.nitroFilter.frequency.exponentialRampToValueAtTime(2200, t + 0.3);
    }
  }

  /* ---------------- ONE-SHOT SFX ---------------- */
  playCollision(intensity = 0.5) {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const p = Math.min(1, Math.max(0.1, intensity));

    // Thump
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.18);

    gain.gain.setValueAtTime(p * 0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.23);

    // Crunch noise
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.2);
    const nGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, t);

    nGain.gain.setValueAtTime(p * 0.5, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(this.sfxGain);
    noise.start(t);
  }

  playCountdown(isFinal = false) {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isFinal ? 'triangle' : 'sine';
    const freq = isFinal ? 880 : 440; // A5 for GO, A4 for 3-2-1
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (isFinal ? 0.6 : 0.25));

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + (isFinal ? 0.65 : 0.28));
  }

  playVictory() {
    this.ensureContext();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const t = this.ctx.currentTime + idx * 0.12;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.38);
    });
  }

  playDefeat() {
    this.ensureContext();
    if (!this.ctx) return;
    const notes = [440, 415.3, 392, 369.99]; // descending minor
    notes.forEach((freq, idx) => {
      const t = this.ctx.currentTime + idx * 0.18;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.32);
    });
  }

  playClick() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.05);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  /* ---------------- DYNAMIC SYNTH MUSIC ---------------- */
  startBGM() {
    this.ensureContext();
    if (this.bgmPlaying || !this.ctx) return;
    this.bgmPlaying = true;
    this.bgmStep = 0;

    // Fast synth bassline & pulse chords
    const chordProgressions = [
      [220, 261.63, 329.63], // Am
      [174.61, 220, 261.63], // F
      [196, 246.94, 293.66], // G
      [164.81, 207.65, 246.94] // Em
    ];

    const stepInterval = 220; // ms

    this.bgmTimer = setInterval(() => {
      if (!this.bgmPlaying || !this.ctx) return;
      const chordIdx = Math.floor((this.bgmStep / 8) % chordProgressions.length);
      const chord = chordProgressions[chordIdx];
      const noteIdx = this.bgmStep % 3;
      const freq = chord[noteIdx] * (this.bgmStep % 2 === 0 ? 0.5 : 1.0);

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600 + Math.sin(this.bgmStep * 0.4) * 350, t);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(t);
      osc.stop(t + 0.22);

      this.bgmStep++;
    }, stepInterval);
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

export const audio = new AudioManager();
