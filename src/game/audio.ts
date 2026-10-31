import { SOUNDSCAPES, SIREN_MELODY } from './soundscapes';
import type { BiomeId } from './data';

export class AudioManager {
  private ctx?: AudioContext;
  private master?: GainNode;
  private noise?: AudioBuffer;
  private unavailable = false;
  private next = 0;
  private nextAmbient = 0;
  private step = 0;
  private currentBiome: BiomeId = 'meadow';
  private sirenCount = 0;
  private muteValue = false;
  private volumeValue = 0.35;
  get muted() {
    return this.muteValue;
  }
  set muted(value: boolean) {
    this.muteValue = value;
    this.applyVolume();
  }
  get volume() {
    return this.volumeValue;
  }
  set volume(value: number) {
    this.volumeValue = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.35;
    this.applyVolume();
  }
  private applyVolume() {
    if (!this.ctx || !this.master) return;
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime, 0.025);
  }
  start() {
    try {
      if (!this.ctx || this.ctx.state === 'closed') {
        const Context =
          globalThis.AudioContext ??
          (globalThis as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!Context) {
          this.unavailable = true;
          return;
        }
        this.ctx = new Context();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : this.volume;
        this.master.connect(this.ctx.destination);
        this.noise = undefined;
        this.unavailable = false;
      }
      void this.ctx.resume().catch(() => {
        /* A later player gesture can unlock audio. */
      });
    } catch {
      this.unavailable = true;
    }
  }
  tone(freq: number, duration = 0.15, delay = 0, type: OscillatorType = 'sine', gain = 0.16) {
    if (!this.ctx || !this.master || this.muted || !this.volume || this.unavailable) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const level = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    level.gain.setValueAtTime(0, t);
    level.gain.linearRampToValueAtTime(gain, t + 0.015);
    level.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(level).connect(this.master);
    osc.onended = () => {
      osc.disconnect();
      level.disconnect();
    };
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }
  play(
    cue:
      | 'jump'
      | 'rescue'
      | 'transform'
      | 'hit'
      | 'victory'
      | 'talk'
      | 'flush'
      | 'portal'
      | 'discovery',
  ) {
    const notes = {
      jump: [330, 495],
      rescue: [523, 659, 784, 1047],
      transform: [392, 587, 784],
      hit: [196, 262, 392],
      victory: [523, 659, 784, 1047, 784, 1047],
      talk: [440, 554],
      flush: [220, 164, 110, 73],
      portal: [262, 392, 524],
      discovery: [587, 740, 880, 1175],
    }[cue];
    notes.forEach((n, i) =>
      this.tone(n, 0.22, i * 0.09, cue === 'flush' ? 'sawtooth' : 'sine', 0.12),
    );
  }
  /** Each power has its own short motif. */
  power(notes: number[], wave: OscillatorType) {
    notes.forEach((n, i) => this.tone(n, 0.16, i * 0.06, wave, wave === 'sine' ? 0.1 : 0.045));
  }
  /** A rising whoosh as a wild animal rockets toward space. */
  launch() {
    [262, 330, 392, 523, 659, 784].forEach((n, i) => this.tone(n, 0.12, i * 0.05, 'sine', 0.07));
  }
  /** The cartoon "ding" when the animal becomes a star. */
  twinkle() {
    this.tone(1568, 0.5, 0, 'sine', 0.08);
    this.tone(2093, 0.6, 0.08, 'sine', 0.05);
  }
  creature(id: string) {
    const low = ['giant-cow', 'giant-reptile', 'hippo', 'leviathan'].includes(id);
    const pitch = low ? 110 : ['bat', 'falcon', 'glow-moth'].includes(id) ? 740 : 523;
    this.tone(pitch, 0.22, 0, low ? 'triangle' : 'sine', 0.07);
    this.tone(pitch * (id === 'giant-cow' ? 0.8 : 1.25), 0.28, 0.12, 'sine', 0.05);
  }
  siren() {
    if (!this.ctx || this.muted || !this.volume || this.unavailable) return;
    this.sirenCount++;
    SIREN_MELODY.forEach((note, i) => this.tone(note, 0.28, i * 0.24, 'sine', 0.075));
  }
  private wash(duration: number, cutoff: number) {
    if (!this.ctx || !this.master || this.muted || !this.volume || this.unavailable) return;
    const ctx = this.ctx;
    if (!this.noise) {
      this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource();
    source.buffer = this.noise;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    const level = ctx.createGain();
    const t = ctx.currentTime;
    level.gain.setValueAtTime(0.0001, t);
    level.gain.linearRampToValueAtTime(0.028, t + duration * 0.4);
    level.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    source.connect(filter).connect(level).connect(this.master);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      level.disconnect();
    };
    source.start(t);
    source.stop(t + duration);
  }
  tick(time: number, biome: BiomeId) {
    if (biome !== this.currentBiome) {
      this.currentBiome = biome;
      this.step = 0;
      this.next = time;
      this.nextAmbient = time + 1;
    }
    if (!this.ctx || this.unavailable) return;
    const theme = SOUNDSCAPES[biome];
    if (time >= this.next) {
      this.next = time + theme.beat;
      this.tone(theme.notes[this.step++ % theme.notes.length], 0.4, 0, theme.voice, 0.045);
      if (this.step % 4 === 0) this.tone(theme.bass, 0.6, 0, 'triangle', 0.028);
    }
    if (time < this.nextAmbient) return;
    this.nextAmbient = time + 4.5;
    switch (theme.ambient) {
      case 'birds':
        this.tone(1100, 0.12, 0, 'sine', 0.025);
        this.tone(1450, 0.15, 0.17, 'sine', 0.02);
        break;
      case 'breeze':
        this.wash(1.6, biome === 'winter' ? 650 : 950);
        break;
      case 'surf':
        this.wash(2.1, 1100);
        break;
      case 'bubbles':
        this.tone(360, 0.12, 0, 'sine', 0.025);
        this.tone(720, 0.18, 0.2, 'sine', 0.022);
        break;
      case 'embers':
        this.tone(160, 0.09, 0, 'triangle', 0.025);
        this.tone(220, 0.07, 0.15, 'triangle', 0.018);
        break;
      case 'drips':
        this.tone(1175, 0.2, 0, 'sine', 0.025);
        this.tone(880, 0.25, 0.34, 'sine', 0.02);
        break;
      case 'shimmer':
        [622, 784, 932].forEach((n, i) => this.tone(n, 0.6, i * 0.16, 'sine', 0.018));
        break;
      case 'city':
        this.tone(523, 0.13, 0, 'triangle', 0.025);
        this.tone(659, 0.18, 0.18, 'sine', 0.02);
        break;
    }
  }
  pause() {
    void this.ctx?.suspend().catch(() => {});
  }
  resume() {
    void this.ctx?.resume().catch(() => {});
  }
  diagnostics() {
    return {
      state: this.unavailable ? 'unavailable' : (this.ctx?.state ?? 'uninitialized'),
      muted: this.muted,
      volume: this.volume,
      biome: this.currentBiome,
      sirenPlays: this.sirenCount,
    };
  }
}
