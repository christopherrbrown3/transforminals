import * as THREE from 'three';

/**
 * Every form has its own power on the Power button. Powers never cost anything, have only a
 * short animation delay, and can send a free-roaming wild animal on a harmless trip to space.
 */
export type PowerMotion = 'none' | 'dash' | 'zigzag' | 'spin' | 'leap' | 'dive' | 'hop' | 'twirl';
export type PowerStyle =
  'boop' | 'trail' | 'cone' | 'rings' | 'beam' | 'shockwave' | 'geyser' | 'swing';
export type ParticleShape = 'box' | 'ball' | 'bubble' | 'leaf' | 'flake';
export interface PowerSpec {
  /** Short text on the Power button. */
  label: string;
  motion: PowerMotion;
  /** Travel for moving powers, in world units. */
  distance?: number;
  /** Reach for area powers; for moving powers, the radius swept along the path. */
  reach: number;
  /** Width of the area in degrees around the facing direction. 360 reaches all around. */
  arc: number;
  style: PowerStyle;
  particle: ParticleShape;
  colors: number[];
  notes: number[];
  wave: OscillatorType;
}

export const POWERS: Record<string, PowerSpec> = {
  human: {
    label: 'BOOP',
    motion: 'none',
    reach: 4.2,
    arc: 80,
    style: 'boop',
    particle: 'box',
    colors: [0xfff3d6, 0xe25b4f, 0xffd476],
    notes: [392, 784],
    wave: 'triangle',
  },
  fox: {
    label: 'DASH',
    motion: 'dash',
    distance: 7,
    reach: 1.9,
    arc: 360,
    style: 'trail',
    particle: 'leaf',
    colors: [0xe58a45, 0xffc37a, 0x8dbf76],
    notes: [523, 659, 880],
    wave: 'sine',
  },
  'arctic-fox': {
    label: 'FLURRY',
    motion: 'none',
    reach: 7,
    arc: 55,
    style: 'cone',
    particle: 'flake',
    colors: [0xffffff, 0xd6f0ff, 0xa9dcf0],
    notes: [988, 1319, 1568],
    wave: 'triangle',
  },
  tiger: {
    label: 'POUNCE',
    motion: 'leap',
    distance: 7,
    reach: 2.2,
    arc: 360,
    style: 'trail',
    particle: 'box',
    colors: [0xeda849, 0x3a3530, 0xfff0cd],
    notes: [220, 330, 440],
    wave: 'triangle',
  },
  lion: {
    label: 'ROAR',
    motion: 'none',
    reach: 8,
    arc: 65,
    style: 'rings',
    particle: 'box',
    colors: [0xffd476, 0xc58a43],
    notes: [147, 196, 247],
    wave: 'sawtooth',
  },
  giraffe: {
    label: 'SWING',
    motion: 'none',
    reach: 5,
    arc: 170,
    style: 'swing',
    particle: 'leaf',
    colors: [0xe8c369, 0x8dbf76, 0xfff0cd],
    notes: [330, 262],
    wave: 'sine',
  },
  hippo: {
    label: 'SPLASH',
    motion: 'hop',
    reach: 5.5,
    arc: 360,
    style: 'shockwave',
    particle: 'bubble',
    colors: [0x8fd3e8, 0xd6f4ff, 0xa9a0c0],
    notes: [131, 98],
    wave: 'triangle',
  },
  camel: {
    label: 'ACHOO',
    motion: 'none',
    reach: 6,
    arc: 50,
    style: 'cone',
    particle: 'ball',
    colors: [0xe4c68d, 0xf3d9b0, 0xcaa476],
    notes: [740, 494],
    wave: 'sine',
  },
  turtle: {
    label: 'SPIN',
    motion: 'spin',
    distance: 6,
    reach: 2,
    arc: 360,
    style: 'trail',
    particle: 'bubble',
    colors: [0x79a975, 0xc8f0d0, 0xffffff],
    notes: [392, 523, 392],
    wave: 'sine',
  },
  shark: {
    label: 'BOOST',
    motion: 'dash',
    distance: 8,
    reach: 2,
    arc: 360,
    style: 'trail',
    particle: 'bubble',
    colors: [0x7ca8c4, 0xe6f7ff, 0xffffff],
    notes: [262, 392, 523],
    wave: 'sine',
  },
  piranha: {
    label: 'BUBBLE',
    motion: 'none',
    reach: 8,
    arc: 40,
    style: 'cone',
    particle: 'bubble',
    colors: [0xf38f79, 0xffd1c2, 0xffffff],
    notes: [880, 988, 1175, 1319],
    wave: 'sine',
  },
  barracuda: {
    label: 'STREAK',
    motion: 'dash',
    distance: 11,
    reach: 1.9,
    arc: 360,
    style: 'trail',
    particle: 'box',
    colors: [0xd8e4ea, 0xadcebc, 0xffffff],
    notes: [1047, 1568],
    wave: 'sine',
  },
  'whale-shark': {
    label: 'GEYSER',
    motion: 'none',
    reach: 6,
    arc: 360,
    style: 'geyser',
    particle: 'bubble',
    colors: [0xbfe9f5, 0x6f9ea7, 0xffffff],
    notes: [98, 147, 196],
    wave: 'triangle',
  },
  kraken: {
    label: 'TWIRL',
    motion: 'twirl',
    reach: 4.8,
    arc: 360,
    style: 'shockwave',
    particle: 'ball',
    colors: [0xaa81b9, 0xe3c9ef, 0xf6e7ff],
    notes: [196, 247, 294, 247],
    wave: 'sine',
  },
  leviathan: {
    label: 'RAINBOW',
    motion: 'none',
    reach: 11,
    arc: 30,
    style: 'cone',
    particle: 'bubble',
    colors: [0xff9aa2, 0xffd476, 0xb5ead7, 0x9ad0ff, 0xc7a6ff],
    notes: [523, 659, 784, 988, 1175],
    wave: 'sine',
  },
  salamander: {
    label: 'SPARKS',
    motion: 'hop',
    reach: 5,
    arc: 360,
    style: 'shockwave',
    particle: 'box',
    colors: [0xffb468, 0xff9152, 0xffe08a],
    notes: [440, 660],
    wave: 'triangle',
  },
  bat: {
    label: 'PING',
    motion: 'none',
    reach: 10,
    arc: 45,
    style: 'rings',
    particle: 'flake',
    colors: [0xcdb3ed, 0xa4dce0],
    notes: [1568, 1760, 1568],
    wave: 'sine',
  },
  'glow-moth': {
    label: 'DUST',
    motion: 'none',
    reach: 7,
    arc: 60,
    style: 'cone',
    particle: 'flake',
    colors: [0xfff3a8, 0xe9d3ff, 0xa6dfd3],
    notes: [1319, 1568, 1976],
    wave: 'sine',
  },
  'giant-reptile': {
    label: 'LEAVES',
    motion: 'none',
    reach: 10,
    arc: 55,
    style: 'cone',
    particle: 'leaf',
    colors: [0x69a379, 0x9ed37f, 0xe7f5a1],
    notes: [110, 147, 98],
    wave: 'sawtooth',
  },
  'mecha-reptile': {
    label: 'BEAM',
    motion: 'none',
    reach: 14,
    arc: 22,
    style: 'beam',
    particle: 'box',
    colors: [0x92f9ee, 0xffffff],
    notes: [880, 1320, 1760],
    wave: 'square',
  },
  rat: {
    label: 'ZOOM',
    motion: 'zigzag',
    distance: 7,
    reach: 1.9,
    arc: 360,
    style: 'trail',
    particle: 'box',
    colors: [0xffd476, 0xf5c04f, 0xfff3c2],
    notes: [1175, 1397, 1175, 1397],
    wave: 'triangle',
  },
  falcon: {
    label: 'DIVE',
    motion: 'dive',
    distance: 8,
    reach: 2.2,
    arc: 360,
    style: 'trail',
    particle: 'leaf',
    colors: [0x798fa9, 0xf4f1e8, 0xd6dee8],
    notes: [1760, 1319, 880],
    wave: 'sine',
  },
  'giant-cow': {
    label: 'MOO',
    motion: 'hop',
    reach: 8,
    arc: 360,
    style: 'shockwave',
    particle: 'ball',
    colors: [0xeee5d5, 0x2f2a2a, 0xffb7c5],
    notes: [98, 82],
    wave: 'triangle',
  },
};

export const powerFor = (form: string) => POWERS[form] ?? POWERS.human;

/** Moving powers sweep the player's path; the others act on an area at once. */
export const sweepsPath = (spec: PowerSpec) =>
  ['dash', 'zigzag', 'spin', 'leap', 'dive'].includes(spec.motion);

type Flat = { x: number; z: number };

/** Models face negative Z, so yaw 0 points north. */
/** Near misses still count, the same way a near-successful jump onto a cage still rescues. */
export const POWER_SLACK = 0.6;

export const facingVector = (yaw: number): Flat => ({ x: -Math.sin(yaw), z: -Math.cos(yaw) });
export const yawToward = (from: Flat, to: Flat) => Math.atan2(-(to.x - from.x), -(to.z - from.z));

/** True when a target sits inside the power's area in front of (or around) the player. */
export function inReach(spec: PowerSpec, from: Flat, facing: Flat, target: Flat, slack = 0) {
  const dx = target.x - from.x,
    dz = target.z - from.z;
  const distance = Math.hypot(dx, dz);
  if (distance > spec.reach + slack) return false;
  if (spec.arc >= 360 || distance < 0.6) return true;
  const angle = Math.acos(THREE.MathUtils.clamp((dx * facing.x + dz * facing.z) / distance, -1, 1));
  return THREE.MathUtils.radToDeg(angle) <= spec.arc / 2 + slack * 10;
}

/**
 * Gentle aim help: the nearest target within a slightly widened area, so a child pointing
 * roughly at an animal still reaches it. Moving powers look along their full travel.
 */
export function aimTarget(spec: PowerSpec, from: Flat, facing: Flat, targets: Flat[]) {
  const reach = sweepsPath(spec) ? (spec.distance ?? 0) + spec.reach : spec.reach;
  const widened = { ...spec, reach, arc: spec.arc >= 360 ? 70 : spec.arc + 30 };
  let best = -1,
    bestDistance = Infinity;
  targets.forEach((t, i) => {
    const d = Math.hypot(t.x - from.x, t.z - from.z);
    if (d < bestDistance && inReach(widened, from, facing, t, POWER_SLACK)) {
      best = i;
      bestDistance = d;
    }
  });
  return best;
}

/**
 * A trip to space ends far ahead of the camera, just under the top edge of the view, so the
 * animal visibly shrinks into the sky before its twinkle. `side` nudges it left or right.
 */
export function spaceTrip(
  start: THREE.Vector3,
  camera: { position: THREE.Vector3; direction: THREE.Vector3; fov: number },
  side: number,
) {
  const forward = camera.direction.clone().setY(0);
  if (forward.lengthSq() < 1e-6) forward.set(0, 0, -1);
  forward.normalize();
  const pitch = Math.asin(THREE.MathUtils.clamp(camera.direction.y, -1, 1));
  const elevation = pitch + THREE.MathUtils.degToRad(camera.fov / 2) - 0.09;
  const right = new THREE.Vector3(-forward.z, 0, forward.x);
  const end = camera.position
    .clone()
    .addScaledVector(forward, 62 * Math.cos(elevation))
    .add(new THREE.Vector3(0, 62 * Math.sin(elevation), 0))
    .addScaledVector(right, side * 9);
  const peak = start
    .clone()
    .lerp(end, 0.35)
    .add(new THREE.Vector3(0, 9, 0));
  return { peak, end };
}

/** Quadratic arc from the animal's spot, up through the peak, to the twinkle point. */
export function tripPoint(
  start: THREE.Vector3,
  peak: THREE.Vector3,
  end: THREE.Vector3,
  t: number,
  target = new THREE.Vector3(),
) {
  const u = 1 - t;
  return target
    .copy(start)
    .multiplyScalar(u * u)
    .addScaledVector(peak, 2 * u * t)
    .addScaledVector(end, t * t);
}
