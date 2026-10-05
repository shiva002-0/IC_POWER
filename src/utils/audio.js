/**
 * Olympus Ambient Audio Synthesizer
 * 
 * Strict Performance & Browser Policy Compliance:
 * - AudioContext is NEVER initialized or resumed automatically on page load.
 * - Requires explicit user interaction (click, tap, keydown) via unlockAudio().
 * - Silent fallback on any audio failure — rendering is NEVER blocked.
 * - Zero external sound file requests, zero CDN dependencies.
 */

class SoundFX {
  constructor() {
    this.ctx = null;
    this.isMuted = true; // Default to muted for professional editorial experience
    this.hasUnlocked = false;
  }

  /**
   * Safe initialization only after user gesture.
   */
  unlockAudio() {
    if (this.hasUnlocked && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return true;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;

      this.ctx = new AudioCtx();
      this.hasUnlocked = true;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Heavenly harp / celestial chime on user interactions.
   * Pitch index maps to ethereal harmonic pentatonic scale.
   */
  playChime(pitchIndex = 0, volume = 0.12) {
    if (this.isMuted || !this.hasUnlocked || !this.ctx) return;
    try {
      if (this.ctx.state === 'suspended') return;

      const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C Major pentatonic
      const freq = freqs[pitchIndex % freqs.length] || 523.25;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.4);
    } catch {
      // Graceful fallback — do not break UI or 3D scene
    }
  }

  /**
   * Rich harmonic resonance chord on section transitions or flythrough start.
   */
  playTransitionChord() {
    if (this.isMuted || !this.hasUnlocked || !this.ctx) return;
    try {
      if (this.ctx.state === 'suspended') return;

      const chord = [220, 329.63, 440, 554.37, 659.25];
      const now = this.ctx.currentTime;

      chord.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        const startTime = now + idx * 0.06;
        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.08 / (idx + 1), startTime + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 2.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 2.5);
      });
    } catch {
      // Graceful fallback
    }
  }

  toggleMute() {
    this.unlockAudio();
    this.isMuted = !this.isMuted;
    if (!this.isMuted) {
      this.playChime(1, 0.15);
    }
    return this.isMuted;
  }
}

export const soundFX = new SoundFX();
