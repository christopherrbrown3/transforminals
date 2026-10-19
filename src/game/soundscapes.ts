import type { BiomeId } from './data';

export interface Soundscape {
  notes: readonly number[];
  beat: number;
  voice: OscillatorType;
  bass: number;
  ambient: 'birds' | 'breeze' | 'surf' | 'bubbles' | 'embers' | 'drips' | 'shimmer' | 'city';
}

// Original short motifs and quiet environmental accents, authored for this game.
export const SOUNDSCAPES: Record<BiomeId, Soundscape> = {
  meadow: {
    notes: [261.63, 329.63, 392, 523.25, 440, 392, 329.63, 293.66],
    beat: 0.62,
    voice: 'sine',
    bass: 130.81,
    ambient: 'birds',
  },
  winter: {
    notes: [392, 523.25, 587.33, 659.25, 587.33, 523.25, 440, 392],
    beat: 0.78,
    voice: 'sine',
    bass: 98,
    ambient: 'breeze',
  },
  savannah: {
    notes: [293.66, 369.99, 440, 369.99, 493.88, 440, 369.99, 293.66],
    beat: 0.6,
    voice: 'triangle',
    bass: 146.83,
    ambient: 'birds',
  },
  desert: {
    notes: [329.63, 392, 440, 493.88, 440, 392, 369.99, 329.63],
    beat: 0.72,
    voice: 'sine',
    bass: 164.81,
    ambient: 'breeze',
  },
  beach: {
    notes: [349.23, 440, 523.25, 440, 587.33, 523.25, 440, 392],
    beat: 0.68,
    voice: 'triangle',
    bass: 174.61,
    ambient: 'surf',
  },
  ocean: {
    notes: [261.63, 311.13, 392, 440, 466.16, 392, 349.23, 311.13],
    beat: 0.64,
    voice: 'sine',
    bass: 130.81,
    ambient: 'bubbles',
  },
  volcano: {
    notes: [196, 261.63, 293.66, 329.63, 293.66, 261.63, 220, 196],
    beat: 0.7,
    voice: 'triangle',
    bass: 98,
    ambient: 'embers',
  },
  underground: {
    notes: [293.66, 440, 587.33, 659.25, 587.33, 440, 369.99, 293.66],
    beat: 0.82,
    voice: 'sine',
    bass: 146.83,
    ambient: 'drips',
  },
  rifts: {
    notes: [311.13, 392, 466.16, 622.25, 523.25, 466.16, 392, 349.23],
    beat: 0.76,
    voice: 'sine',
    bass: 155.56,
    ambient: 'shimmer',
  },
  city: {
    notes: [261.63, 392, 329.63, 440, 392, 523.25, 440, 329.63],
    beat: 0.56,
    voice: 'triangle',
    bass: 130.81,
    ambient: 'city',
  },
};
export const SIREN_MELODY = [261.63, 311.13, 392, 466.16, 440, 349.23, 311.13, 261.63] as const;
