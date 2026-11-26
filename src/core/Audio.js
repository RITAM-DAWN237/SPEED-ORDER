/**
 * Audio.js - Procedural Web Audio API sound synthesizer
 */
import { storage } from './Storage.js';

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.isMuted = false;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.bgmTimer = null;
    this.bgmPlaying = false;
    this.bgmStep = 0;

    this.engineOsc = null;
    this.engineSubOsc = null;
    this.engineGain = null;
    this.engineRunning = false;

    // Police siren nodes
    this.sirenOsc = null;
    this.sirenGain = null;
    this.sirenRunning = false;
    this.sirenTimer = null;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.updateVolumes();
      this.initialized = true;
    } catch (e) {
      console.warn('AudioContext not supported:', e);
    }
  }

  unlockAudio() {
    this.ensureContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.bgmPlaying && !this.isMuted) {
      this.startBGM();
    }
  }

  ensureContext() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  updateVolumes() {
    if (!this.ctx) return;
    const s = storage.settings;
    const now = this.ctx.currentTime;
    const mVol = (s.masterVolume ?? 80) / 100;
    const musVol = (s.musicVolume ?? 75) / 100;
    const sfxVol = (s.sfxVolume ?? 85) / 100;

    this.masterGain.gain.setValueAtTime(mVol, now);
    this.musicGain.gain.setValueAtTime(musVol * 0.45, now);
    this.sfxGain.gain.setValueAtTime(sfxVol * 0.8, now);
  }

  playClick() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.06);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.07);
  }

  playClickSound() { this.playClick(); }
  playBackSound() { this.playClick(); }

  startEngine() {
    this.ensureContext();
    if (!this.ctx || this.engineRunning) return;

    try {
      const t = this.ctx.currentTime;
      this.engineOsc = this.ctx.createOscillator();
      this.engineSubOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();

      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(65, t);

      this.engineSubOsc.type = 'triangle';
      this.engineSubOsc.frequency.setValueAtTime(32.5, t);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, t);

      this.engineGain.gain.setValueAtTime(0.2, t);

      this.engineOsc.connect(filter);
      this.engineSubOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.sfxGain);

      this.engineOsc.start(t);
      this.engineSubOsc.start(t);
      this.engineRunning = true;
    } catch (e) {
      console.warn('Could not start engine audio:', e);
    }
  }

  updateEngine(speed, isNitro) {
    if (!this.ctx || !this.engineRunning || !this.engineOsc) return;
    const absSpeed = Math.abs(speed);
    const baseFreq = 55 + (absSpeed / 300) * 220 + (isNitro ? 50 : 0);
    const now = this.ctx.currentTime;
    this.engineOsc.frequency.setTargetAtTime(baseFreq, now, 0.05);
    this.engineSubOsc.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.05);
  }

  stopEngine() {
    if (!this.engineRunning) return;
    try {
      if (this.engineOsc) {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
        this.engineOsc = null;
      }
      if (this.engineSubOsc) {
        this.engineSubOsc.stop();
        this.engineSubOsc.disconnect();
        this.engineSubOsc = null;
      }
      this.engineRunning = false;
    } catch (e) {}
  }

  playNitroSound() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(820, t + 0.3);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.36);
  }

  playCrashSound() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.25);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  // --- Police Siren Wail ---
  startSiren() {
    this.ensureContext();
    if (!this.ctx || this.sirenRunning) return;

    try {
      const t = this.ctx.currentTime;
      this.sirenOsc = this.ctx.createOscillator();
      this.sirenGain = this.ctx.createGain();

      this.sirenOsc.type = 'sine';
      this.sirenOsc.frequency.setValueAtTime(650, t);

      this.sirenGain.gain.setValueAtTime(0.08, t);

      this.sirenOsc.connect(this.sirenGain);
      this.sirenGain.connect(this.sfxGain);

      this.sirenOsc.start(t);
      this.sirenRunning = true;

      let up = true;
      this.sirenTimer = setInterval(() => {
        if (!this.sirenRunning || !this.ctx || !this.sirenOsc) return;
        const now = this.ctx.currentTime;
        const targetFreq = up ? 920 : 600;
        this.sirenOsc.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.55);
        up = !up;
      }, 550);
    } catch (e) {
      console.warn('Could not start siren:', e);
    }
  }

  stopSiren() {
    if (!this.sirenRunning) return;
    try {
      if (this.sirenTimer) {
        clearInterval(this.sirenTimer);
        this.sirenTimer = null;
      }
      if (this.sirenOsc) {
        this.sirenOsc.stop();
        this.sirenOsc.disconnect();
        this.sirenOsc = null;
      }
      this.sirenRunning = false;
    } catch (e) {}
  }

  startBGM() {
    this.ensureContext();
    if (this.bgmPlaying || !this.ctx) return;
    this.bgmPlaying = true;
    this.bgmStep = 0;

    const chords = [
      [220, 261.63, 329.63],
      [174.61, 220, 261.63],
      [130.81, 164.81, 196.0],
      [196, 246.94, 293.66]
    ];

    const stepMs = 200;
    this.bgmTimer = setInterval(() => {
      if (!this.bgmPlaying || !this.ctx) return;
      const chordIdx = Math.floor((this.bgmStep / 8) % chords.length);
      const chord = chords[chordIdx];
      const noteIdx = this.bgmStep % 3;
      const freq = chord[noteIdx] * (this.bgmStep % 2 === 0 ? 0.5 : 1.0);

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650 + Math.sin(this.bgmStep * 0.4) * 350, t);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.19);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(t);
      osc.stop(t + 0.2);

      this.bgmStep++;
    }, stepMs);
  }

  setMasterVolume(val) {
    this.ensureContext();
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime((val / 100), this.ctx.currentTime);
    }
  }

  setMusicVolume(val) {
    this.ensureContext();
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime((val / 100), this.ctx.currentTime);
    }
  }

  setSfxVolume(val) {
    this.ensureContext();
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime((val / 100), this.ctx.currentTime);
    }
  }

  toggleAudio() {
    this.ensureContext();
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : 0.8;
      this.masterGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
    }
    if (!this.isMuted && !this.bgmPlaying) {
      this.startBGM();
    }
    return this.isMuted;
  }
}

export const audio = new AudioManager();
