/**
 * Subtle sound effects synthesized via Web Audio API (no external mp3 files required)
 */

import { NotificationType } from '../types';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export function isSoundMuted(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('dana_notif_sound_muted') === 'true';
}

export function setSoundMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('dana_notif_sound_muted', muted ? 'true' : 'false');
}

export type SoundType = NotificationType | 'pop';

export function playNotificationSound(type: SoundType = 'general') {
  if (isSoundMuted()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'attendance') {
      // Soft gentle caution chime
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(392, now); // G4
      osc.frequency.setValueAtTime(440, now + 0.12); // A4

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.09, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === 'grade') {
      // Pleasant rising major third chime (e.g. 523Hz -> 659Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.25); // G5

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc.start(now);
      osc.stop(now + 0.55);
    } else if (type === 'meeting') {
      // Gentle reminder bell (two warm gentle pulses)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.setValueAtTime(554.37, now + 0.15); // C#5

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.02, now + 0.14);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.17);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'vp_message') {
      // Modern soft notification chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.18); // A5

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.start(now);
      osc.stop(now + 0.45);
    } else {
      // Standard gentle soft pop
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(640, now + 0.08);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.09, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch {
    // Graceful fallback if Web Audio is restricted by browser policy
  }
}
