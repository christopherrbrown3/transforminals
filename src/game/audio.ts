export class AudioManager {
  private ctx?: AudioContext;
  private next = 0;
  private step = 0;
  muted = false;
  volume = 0.35;
  start() {
    if (!this.ctx) this.ctx = new AudioContext();
    void this.ctx.resume();
  }
  tone(freq: number, duration = 0.15, delay = 0, type: OscillatorType = 'sine', gain = 0.16) {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const level = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    level.gain.setValueAtTime(0, t);
    level.gain.linearRampToValueAtTime(gain * this.volume, t + 0.015);
    level.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(level).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }
  play(cue: 'jump' | 'rescue' | 'transform' | 'hit' | 'victory' | 'talk' | 'flush' | 'portal') {
    const notes = {
      jump: [330, 495],
      rescue: [523, 659, 784, 1047],
      transform: [392, 587, 784],
      hit: [196, 262, 392],
      victory: [523, 659, 784, 1047, 784, 1047],
      talk: [440, 554],
      flush: [220, 164, 110, 73],
      portal: [262, 392, 524],
    }[cue];
    notes.forEach((n, i) => this.tone(n, 0.22, i * 0.09, cue === 'flush' ? 'sawtooth' : 'sine'));
  }
  tick(time: number, biome: string) {
    if (!this.ctx || time < this.next) return;
    this.next = time + 0.55;
    const jazz = [261.63, 311.13, 392, 440, 466.16, 392, 349.23, 311.13];
    const gentle = [261.63, 329.63, 392, 523.25, 440, 392, 329.63, 293.66];
    const notes = biome === 'ocean' ? jazz : gentle;
    this.tone(notes[this.step++ % notes.length], 0.42, 0, 'sine', 0.055);
    if (this.step % 4 === 0)
      this.tone(biome === 'volcano' ? 130.81 : 196, 0.6, 0, 'triangle', 0.035);
  }
  pause() {
    void this.ctx?.suspend();
  }
  resume() {
    void this.ctx?.resume();
  }
}
