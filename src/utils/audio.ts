// Audio sound synthesis engine using Web Audio API
// Fast, lightweight, zero external file dependencies, works offline

class SoundController {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // Initialized lazily upon first user interaction
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  private getContext(): AudioContext | null {
    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * 1. Crisp, delightful "Pop" sound for button clicks, tabs, cards, toggles
   */
  public playPop(pitchMultiplier: number = 1.0) {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';

      const now = ctx.currentTime;
      const baseFreq = 480 * pitchMultiplier;

      osc.frequency.setValueAtTime(baseFreq, now);
      // Fast upward bubble click then snappy decay
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.7, now + 0.025);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + 0.06);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.075);
    } catch {
      // Audio playback error or blocked by autoplay
    }
  }

  /**
   * 2. "Cash Register / Chime" sound for successfully saving a transaction,
   * adding quick spend, or depositing savings.
   * Mimics a cheerful shopping basket register sound (bell + resonant shimmer).
   */
  public playCashRegister() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Tone 1: Register click / chime starter (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.06); // E5
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.22);

      // Tone 2: Bright sparkling coin chime (A5 -> D6)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.06); // A5
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.14); // D6
      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.setValueAtTime(0.15, now + 0.06);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.06);
      osc2.stop(now + 0.44);

      // Tone 3: Sparkling cash register ring (F#6)
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(1479.98, now + 0.1);
      gain3.gain.setValueAtTime(0.001, now);
      gain3.gain.setValueAtTime(0.09, now + 0.1);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.1);
      osc3.stop(now + 0.38);
    } catch {
      // Ignore audio failure
    }
  }

  /**
   * 3. "Cancel / Delete / Dismiss" sound:
   * A clean, gentle descending drop tone (whoosh-cancel), conveying cancellation
   * or deletion immediately without being abrasive.
   */
  public playCancelOrDelete() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Downward gliding sine
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.16);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);

      // Low soft cancel thud
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(130, now + 0.04);
      subOsc.frequency.exponentialRampToValueAtTime(55, now + 0.17);

      subGain.gain.setValueAtTime(0.001, now);
      subGain.gain.setValueAtTime(0.08, now + 0.04);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      subOsc.connect(subGain);
      subGain.connect(ctx.destination);

      subOsc.start(now + 0.04);
      subOsc.stop(now + 0.18);
    } catch {
      // Ignore audio failure
    }
  }

  /**
   * 4. Soft tap / tick sound for sub-interactions
   */
  public playTap() {
    this.playPop(1.2);
  }
}

export const soundFx = new SoundController();

// Global document click listener for buttons with data-sound or standard buttons/tabs
export function initGlobalClickSound() {
  if (typeof window === 'undefined') return;

  const handleGlobalClick = (event: MouseEvent) => {
    try {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      // Find closest button or clickable role
      const clickable = target.closest<HTMLElement>(
        'button, [role="button"], a, input[type="checkbox"], input[type="radio"], select, .clickable-sound'
      );

      if (!clickable) return;

      // If element has explicitly disabled sound, skip
      if (clickable.dataset.noSound === 'true') return;

      // Check if this button is a cancel/delete/close button
      const isCancelOrDelete =
        clickable.dataset.sound === 'cancel' ||
        clickable.dataset.sound === 'delete' ||
        clickable.getAttribute('title')?.toLowerCase().includes('hapus') ||
        clickable.getAttribute('title')?.toLowerCase().includes('batal') ||
        clickable.getAttribute('aria-label')?.toLowerCase().includes('tutup') ||
        clickable.getAttribute('aria-label')?.toLowerCase().includes('batal') ||
        clickable.getAttribute('aria-label')?.toLowerCase().includes('hapus') ||
        clickable.classList.contains('swal2-cancel');

      if (isCancelOrDelete) {
        soundFx.playCancelOrDelete();
        return;
      }

      // Check if button is save/submit transaction button (handled specially by its onSubmit, so we skip here or let it chime)
      if (clickable.dataset.sound === 'cash') {
        // Will be triggered by transaction save handler
        return;
      }

      // Otherwise, play the requested "Pop" sound
      soundFx.playPop();
    } catch {
      // ignore
    }
  };

  window.addEventListener('click', handleGlobalClick, { capture: true, passive: true });
}
