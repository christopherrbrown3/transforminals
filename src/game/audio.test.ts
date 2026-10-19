import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioManager } from './audio';
import { BIOMES } from './data';
import { SOUNDSCAPES, SIREN_MELODY } from './soundscapes';

class Parameter {
  value = 0;
  cancelScheduledValues = vi.fn();
  setTargetAtTime = vi.fn((value: number) => {
    this.value = value;
  });
  setValueAtTime = vi.fn();
  linearRampToValueAtTime = vi.fn();
  exponentialRampToValueAtTime = vi.fn();
}
class Node {
  gain = new Parameter();
  frequency = new Parameter();
  type = '';
  buffer: unknown;
  loop = false;
  onended?: () => void;
  connect = vi.fn((destination: unknown) => destination);
  disconnect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}
class Context {
  static instances: Context[] = [];
  state = 'suspended';
  currentTime = 0;
  sampleRate = 16;
  destination = {};
  gains: Node[] = [];
  oscillators: Node[] = [];
  sources: Node[] = [];
  filters: Node[] = [];
  constructor() {
    Context.instances.push(this);
  }
  resume = vi.fn(async () => {
    this.state = 'running';
  });
  suspend = vi.fn(async () => {
    this.state = 'suspended';
  });
  createGain() {
    const node = new Node();
    this.gains.push(node);
    return node;
  }
  createOscillator() {
    const node = new Node();
    this.oscillators.push(node);
    return node;
  }
  createBufferSource() {
    const node = new Node();
    this.sources.push(node);
    return node;
  }
  createBiquadFilter() {
    const node = new Node();
    this.filters.push(node);
    return node;
  }
  createBuffer() {
    return { getChannelData: () => new Float32Array(16) };
  }
}

beforeEach(() => {
  Context.instances = [];
  vi.stubGlobal('AudioContext', Context);
});
afterEach(() => vi.unstubAllGlobals());

describe('local audio', () => {
  it('waits for a player gesture, then controls all scheduled sound through one volume bus', () => {
    const audio = new AudioManager();
    audio.tick(0, 'meadow');
    expect(Context.instances).toHaveLength(0);
    audio.start();
    const ctx = Context.instances[0];
    expect(ctx.state).toBe('running');
    audio.play('rescue');
    expect(ctx.oscillators).toHaveLength(4);
    expect(ctx.gains[0].gain.value).toBe(0.35);
    audio.muted = true;
    expect(ctx.gains[0].gain.value).toBe(0);
    audio.play('jump');
    expect(ctx.oscillators).toHaveLength(4);
    audio.volume = 0.2;
    audio.muted = false;
    expect(ctx.gains[0].gain.value).toBe(0.2);
    audio.pause();
    expect(ctx.state).toBe('suspended');
    audio.resume();
    expect(ctx.state).toBe('running');
  });

  it('supplies every biome with an original motif and a bounded ambient accent', () => {
    expect(new Set(BIOMES.map((b) => JSON.stringify(SOUNDSCAPES[b.id].notes))).size).toBe(
      BIOMES.length,
    );
    for (const biome of BIOMES) {
      const audio = new AudioManager();
      audio.start();
      const ctx = Context.instances.at(-1)!;
      audio.tick(0, biome.id);
      expect(ctx.oscillators[0].frequency.value, biome.id).toBe(SOUNDSCAPES[biome.id].notes[0]);
      audio.tick(6, biome.id);
      expect(ctx.oscillators.length + ctx.sources.length, biome.id).toBeGreaterThan(2);
      for (const node of [...ctx.oscillators, ...ctx.sources]) {
        expect(node.stop).toHaveBeenCalled();
        node.onended?.();
        expect(node.disconnect).toHaveBeenCalled();
      }
      expect(audio.diagnostics().biome).toBe(biome.id);
    }
  });

  it('plays the authored siren phrase only after activation and respects mute', () => {
    const audio = new AudioManager();
    audio.siren();
    expect(Context.instances).toHaveLength(0);
    audio.start();
    const ctx = Context.instances[0];
    audio.siren();
    expect(ctx.oscillators.map((node) => node.frequency.value)).toEqual([...SIREN_MELODY]);
    expect(audio.diagnostics().sirenPlays).toBe(1);
    audio.muted = true;
    audio.siren();
    expect(ctx.oscillators).toHaveLength(SIREN_MELODY.length);
  });

  it('keeps gameplay available when audio is missing or resume is rejected', async () => {
    vi.stubGlobal('AudioContext', undefined);
    const silent = new AudioManager();
    expect(() => silent.start()).not.toThrow();
    expect(silent.diagnostics().state).toBe('unavailable');
    vi.stubGlobal(
      'AudioContext',
      class extends Context {
        resume = vi.fn(async () => {
          throw new Error('Gesture required');
        });
      },
    );
    const locked = new AudioManager();
    locked.start();
    await Promise.resolve();
    expect(locked.diagnostics().state).toBe('suspended');
  });
});
