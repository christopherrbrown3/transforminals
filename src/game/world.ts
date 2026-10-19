import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { buildCaveFloorplan, CAVE_LAYOUT, isCaveWalkable } from './caves';

export interface WorldObstacle {
  x: number;
  z: number;
  radius: number;
  height?: number;
}

export interface BuiltWorld {
  group: THREE.Group;
  obstacles: WorldObstacle[];
  hazards: Array<{ x: number; z: number; radius: number }>;
  water: boolean;
  sky: number;
  ground: number;
}
type Shape = 'box' | 'rounded' | 'rock' | 'cone' | 'cylinder' | 'arch';
interface Stamp {
  position: [number, number, number];
  size: [number, number, number];
  rotation: number;
}
const palettes: Record<
  string,
  { sky: number; ground: number; path: number; leaf: number; cliff: number }
> = {
  meadow: { sky: 0xc7e9dc, ground: 0x8dbf76, path: 0xe5cda1, leaf: 0x5f9c69, cliff: 0xadc292 },
  winter: { sky: 0xc6dfec, ground: 0xe6eff1, path: 0xbacfdc, leaf: 0x77aeb4, cliff: 0xa9c5d5 },
  savannah: { sky: 0xf4dfad, ground: 0xc7bf6d, path: 0xe0c493, leaf: 0x929a53, cliff: 0xbba06a },
  desert: { sky: 0xf3d9b0, ground: 0xe4c68d, path: 0xf2dcaa, leaf: 0x74a786, cliff: 0xcaa476 },
  beach: { sky: 0xbce5e8, ground: 0xf2dca5, path: 0xffecc4, leaf: 0x74ac86, cliff: 0xc9b894 },
  ocean: { sky: 0x528ea4, ground: 0x95c7bb, path: 0xb4d7c5, leaf: 0x78b5ae, cliff: 0x699da6 },
  volcano: { sky: 0xcba6a5, ground: 0x716b7d, path: 0xaaa0a4, leaf: 0x967e87, cliff: 0x59566b },
  underground: { sky: 0x737995, ground: 0x9996ad, path: 0xb5afc3, leaf: 0x9ecbc1, cliff: 0x686c86 },
  rifts: { sky: 0x8e85b7, ground: 0x8a81a2, path: 0xb1a0bb, leaf: 0xc097c7, cliff: 0x656581 },
  city: { sky: 0xc9e1dc, ground: 0xa2bcb0, path: 0x859397, leaf: 0x74a883, cliff: 0xadbdb7 },
};
const cages = [
  [-7, -9],
  [9, -17],
  [-15, -24],
  [18, -29],
  [0, -32],
  [22, -8],
];
const portals = [
  [-28, -30],
  [0, -38],
  [28, -30],
];
const wildlife = [
  [5, 0],
  [-17, -2],
  [17, -5],
];

/** Hand-staged landmarks with deterministic, instanced decoration. */
export function buildWorld(id: string): BuiltWorld {
  const p = palettes[id] ?? palettes.meadow;
  const group = new THREE.Group();
  group.name = `biome:${id}`;
  const obstacles: BuiltWorld['obstacles'] = [];
  const hazards: BuiltWorld['hazards'] = [];
  const footprints: Array<{ x: number; z: number; radius: number }> = [];
  const buckets = new Map<
    string,
    { shape: Shape; color: number; items: Stamp[]; glow: boolean; shadow: boolean }
  >();
  function stamp(
    shape: Shape,
    color: number,
    pos: [number, number, number],
    size: [number, number, number],
    rotation = 0,
    glow = false,
  ) {
    const shadow = pos[1] > 0.35 && size[1] > 0.28;
    const key = `${shape}:${color}:${glow}:${shadow}`;
    if (!buckets.has(key)) buckets.set(key, { shape, color, items: [], glow, shadow });
    buckets.get(key)!.items.push({ position: pos, size, rotation });
  }
  const box = (
    c: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    r = 0,
  ) =>
    stamp(
      Math.min(w, h, d) >= 0.18 && Math.max(w, h, d) < 13 ? 'rounded' : 'box',
      c,
      [x, y, z],
      [w, h, d],
      r,
    );
  const rock = (c: number, x: number, y: number, z: number, w: number, h: number, d: number) =>
    stamp('rock', c, [x, y, z], [w, h, d]);
  const cone = (c: number, x: number, y: number, z: number, w: number, h: number) =>
    stamp('cone', c, [x, y, z], [w, h, w]);
  let seed = [...id].reduce((n, ch) => n * 31 + ch.charCodeAt(0), 211) >>> 0;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  function segmentDistance(x: number, z: number, ax: number, az: number, bx: number, bz: number) {
    const dx = bx - ax,
      dz = bz - az;
    const t = THREE.MathUtils.clamp(
      ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1),
      0,
      1,
    );
    return Math.hypot(x - ax - t * dx, z - az - t * dz);
  }
  function gameplayClear(x: number, z: number, radius: number) {
    if (cages.some(([cx, cz]) => Math.hypot(x - cx, z - cz) < radius + 4)) return false;
    if (portals.some(([px, pz]) => Math.hypot(x - px, z - pz) < radius + 3.6)) return false;
    if (wildlife.some(([nx, nz]) => Math.hypot(x - nx, z - nz) < radius + 3.4)) return false;
    if (Math.hypot(x, z + 19) < radius + 7.2) return false;
    if (segmentDistance(x, z, 0, 12, 0, -38) < radius + 2.6) return false;
    if (segmentDistance(x, z, -28, -30, 28, -30) < radius + 1.5) return false;
    if (cages.some(([cx, cz]) => segmentDistance(x, z, 0, cz, cx, cz) < radius + 1.35))
      return false;
    return true;
  }
  function clear(x: number, z: number, radius = 2) {
    if (Math.hypot(x, z) + radius > 40.5 || !gameplayClear(x, z, radius)) return false;
    if (Math.abs(x) < 14 + radius && z > 4) return false;
    return !footprints.some((f) => Math.hypot(x - f.x, z - f.z) < radius + f.radius + 0.65);
  }
  function occupy(x: number, z: number, radius: number, height?: number, collisionRadius = radius) {
    footprints.push({ x, z, radius });
    if (height !== undefined) obstacles.push({ x, z, radius: collisionRadius, height });
  }
  const groundMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(43, 43, 1.5, 64),
    new THREE.MeshStandardMaterial({
      color: id === 'underground' ? 0x5d627c : p.ground,
      roughness: 1,
    }),
  );
  groundMesh.position.y = -0.75;
  groundMesh.receiveShadow = true;
  group.add(groundMesh);
  // Toy diorama edge provides a readable world boundary without enclosing the play space.
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(43, 41.7, 2.5, 64),
    new THREE.MeshStandardMaterial({ color: p.cliff, roughness: 1 }),
  );
  base.position.y = -2.75;
  group.add(base);
  // Sand-colored shoulders, inset paving, and scattered pebbles add depth without raised collision.
  if (id !== 'underground') {
    box(p.cliff, 0, 0.007, -13, 5.1, 0.025, 53);
    box(p.path, 0, 0.025, -13, 4.5, 0.04, 53);
    box(p.cliff, 0, 0.007, -30, 59, 0.025, 4.4);
    box(p.path, 0, 0.027, -30, 58, 0.04, 3.6);
    for (const [x, z] of cages.slice(0, 6)) {
      box(p.path, x / 2, 0.025, z, Math.abs(x) + 4, 0.045, 2.1);
      stamp('cylinder', p.path, [x, 0.035, z], [5.5, 0.05, 5.5]);
    }
    // Small colored stepping tiles make the main trail easy to follow.
    for (let z = 8; z > -36; z -= 3) {
      box(id === 'ocean' ? 0xd7e6c6 : 0xf6e3b9, 0.6, 0.057, z, 0.65, 0.045, 0.85, 0.1);
      box(p.cliff, -1.6, 0.052, z + 1, 0.18, 0.025, 0.31, -0.18);
    }
  }

  function tree(x: number, z: number, scale = 1) {
    const snowy = id === 'winter',
      acacia = id === 'savannah',
      palm = id === 'beach';
    box(snowy ? 0x7a8b90 : 0x9b7957, x, scale * 1.3, z, 0.55 * scale, 2.6 * scale, 0.55 * scale);
    box(snowy ? 0x7a8b90 : 0x8b6b4d, x, 0.17 * scale, z, 0.85 * scale, 0.34 * scale, 0.8 * scale);
    for (const side of [-1, 1])
      box(
        0xa78a60,
        x + side * 0.18 * scale,
        1.15 * scale,
        z + 0.29 * scale,
        0.09 * scale,
        0.7 * scale,
        0.025,
      );
    if (snowy) {
      for (let k = 0; k < 3; k++) {
        cone(p.leaf, x, scale * (2 + k * 0.7), z, scale * (2.5 - k * 0.55), scale * 1.8);
        cone(0xf3f7ed, x, scale * (2.3 + k * 0.7), z, scale * (2.1 - k * 0.55), scale * 1.35);
      }
    } else if (palm) {
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2;
        box(
          p.leaf,
          x + Math.sin(a) * scale * 0.9,
          scale * 2.8,
          z + Math.cos(a) * scale * 0.9,
          0.7 * scale,
          0.27 * scale,
          2.5 * scale,
          a,
        );
      }
      rock(0xb49c67, x, 2.5 * scale, z, 0.4, 0.4, 0.4);
    } else {
      box(
        p.leaf,
        x,
        scale * (acacia ? 3 : 2.85),
        z,
        scale * (acacia ? 4.2 : 2.7),
        scale * (acacia ? 0.9 : 1.6),
        scale * (acacia ? 3 : 2.6),
        0.1,
      );
      box(
        snowy ? 0xeaf3ed : id === 'rifts' ? 0xd8b1d1 : 0x94bf7c,
        x - scale * 0.3,
        scale * (acacia ? 3.55 : 3.9),
        z + 0.1,
        scale * 1.9,
        scale * 0.6,
        scale * 1.8,
        -0.1,
      );
    }
    if (!snowy && !palm && !acacia) {
      for (const side of [-1, 1])
        box(
          0x82b279,
          x + side * 0.95 * scale,
          2.55 * scale,
          z + 0.3 * scale,
          0.85 * scale,
          0.55 * scale,
          1.3 * scale,
          side * 0.13,
        );
      if (id === 'meadow')
        for (let k = 0; k < 3; k++)
          rock(
            0xe7b06b,
            x + (k - 1) * 0.52 * scale,
            2.35 * scale,
            z + 1.22 * scale,
            0.13 * scale,
            0.15 * scale,
            0.13 * scale,
          );
    }
    occupy(x, z, (acacia ? 2.2 : 1.65) * scale, 4.4 * scale, 0.5 * scale);
  }
  function crystal(x: number, z: number, color: number, scale = 1) {
    for (let k = 0; k < 3; k++) {
      const a = k * 2.1;
      stamp(
        'cone',
        color,
        [x + Math.sin(a) * 0.35, 0.6 * scale, z + Math.cos(a) * 0.35],
        [0.5 * scale, 1.5 * scale, 0.5 * scale],
        0,
        true,
      );
    }
  }
  function mushroom(x: number, z: number, scale = 1) {
    box(0xdcd5c0, x, 0.6 * scale, z, 0.25 * scale, 1.2 * scale, 0.25 * scale);
    rock(0x81cdc6, x, 1.2 * scale, z, 0.8 * scale, 0.35 * scale, 0.8 * scale);
    for (let i = 0; i < 3; i++)
      box(0xf4e8c2, x + (i - 1) * 0.3 * scale, 1.5 * scale, z, 0.13, 0.06, 0.13);
    occupy(x, z, 0.9 * scale, 1.55 * scale, 0.24 * scale);
  }
  function coral(x: number, z: number, color: number) {
    box(color, x, 0.6, z, 0.25, 1.2, 0.25);
    for (const s of [-1, 1]) {
      box(color, x + s * 0.35, 0.85, z, 0.7, 0.18, 0.22);
      box(color, x + s * 0.65, 1.15, z, 0.2, 0.75, 0.2);
    }
  }
  if (id === 'meadow') {
    // A giant storybook tree is the Meadow's identifying landmark.
    tree(-18, -36, 1.65);
    box(0xc59462, -18, 1.3, -35.05, 1.1, 1.9, 0.15);
    box(0xffdb81, -18, 1.8, -34.93, 0.45, 0.45, 0.08);
    for (let i = 0; i < 5; i++) {
      box(0xf1d49c, 15 + i * 1.1, 0.7, -35, 0.18, 1.4, 0.2);
      occupy(15 + i * 1.1, -35, 0.45, 1.4, 0.45);
    }
    box(0xf1d49c, 17.2, 1, -35, 4.7, 0.16, 0.2);
  } else if (id === 'winter') {
    stamp('cylinder', 0xa1ccd9, [-22, 0.045, -10], [10, 0.08, 7]);
    occupy(-22, -10, 5.5);
    rock(0xf7f7ed, 16, 1.7, -37, 3, 2.2, 2.6);
    occupy(16, -37, 3.2, 4, 2.8);
    box(0xb1d5db, 16, 0.8, -34.65, 1.2, 1.6, 0.35);
    for (const s of [-1, 1]) {
      rock(0xf3f5eb, 20 + s * 1.6, 0.65, -19, 0.9, 0.7, 0.9);
      rock(0xf3f5eb, 20 + s * 1.6, 1.5, -19, 0.62, 0.62, 0.62);
      box(0x5b7890, 20 + s * 1.6, 2.05, -19, 1, 0.15, 0.8);
      occupy(20 + s * 1.6, -19, 1, 2.2, 0.85);
    }
  } else if (id === 'savannah') {
    stamp('cylinder', 0x83b8af, [-20, 0.04, -7], [10, 0.07, 7]);
    occupy(-20, -7, 5.4);
    tree(14, -37, 1.3);
    for (let i = 0; i < 4; i++) {
      rock(0xc3a477, -15 + i * 2, 0.8 + i * 0.3, -36, 2, 1.3 + i * 0.3, 2.6);
      occupy(-15 + i * 2, -36, 2, 3.5, 1.7);
    }
  } else if (id === 'desert') {
    for (let k = 0; k < 5; k++)
      box(k % 2 ? 0xdab37b : 0xcba374, -17, k * 0.9 + 0.45, -37, 8 - k * 1.4, 0.95, 5 - k * 0.85);
    occupy(-17, -37, 4.7, 4.8, 4.2);
    stamp('cylinder', 0x77bdad, [20, 0.04, -2], [8, 0.07, 6]);
    tree(26, 1, 1.1);
    occupy(20, -2, 4.4);
    for (const s of [-1, 1]) {
      box(0xc69b6c, 17 + s * 2, 2.5, -35, 1.2, 5, 1.2);
      occupy(17 + s * 2, -35, 0.95, 5.4, 0.85);
    }
    box(0xe7c58f, 17, 5, -35, 5.5, 0.8, 1.5);
  } else if (id === 'beach') {
    box(0x7fc5c6, -29, 0.04, -6, 16, 0.06, 43);
    box(0xb9e1d7, -20.5, 0.065, -6, 1.5, 0.04, 43);
    box(0xb9946f, -26, 0.4, -17, 14, 0.3, 3);
    for (let k = 0; k < 5; k++) box(0xa28061, -31 + k * 2.5, 0.1, -17, 0.4, 1.5, 0.4);
    tree(13, -36, 1.35);
    tree(24, -21, 1.2);
    // Stacked sandcastle towers.
    for (const s of [-1, 1]) {
      box(0xd8b77e, 23 + s * 2, 1.3, 4, 1.7, 2.6, 1.7);
      cone(0xecc994, 23 + s * 2, 3, 4, 2, 1.2);
    }
    box(0xe7c78f, 23, 0.8, 4, 3, 1.6, 1.2);
    occupy(23, 4, 3.8, 3.6, 3.2);
  } else if (id === 'ocean') {
    // An empty toy boat tips against a soft toy reef when the siren sings.
    const sirenBoat = new THREE.Group();
    sirenBoat.name = 'siren-toy-boat';
    sirenBoat.position.set(12.5, 0.15, 0);
    const boatPart = (
      color: number,
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
    ) => {
      const part = new THREE.Mesh(
        new RoundedBoxGeometry(w, h, d, 1, Math.min(w, h, d) * 0.12),
        new THREE.MeshStandardMaterial({ color, roughness: 0.75 }),
      );
      part.position.set(x, y, z);
      part.castShadow = true;
      part.receiveShadow = true;
      sirenBoat.add(part);
    };
    boatPart(0xcb9572, 0, 0.45, 0, 1.8, 0.8, 3);
    boatPart(0xf1d6a1, 0, 0.89, 0, 1.95, 0.12, 3.05);
    boatPart(0x9bbeb9, 0, 0.98, 0, 1.5, 0.1, 2.65);
    boatPart(0xb48865, 0, 1.9, 0, 0.12, 2.2, 0.12);
    boatPart(0xf2e5bd, 0.45, 2.05, 0, 0.85, 1.4, 0.07);
    boatPart(0x93b7ca, -0.3, 1.9, 0, 0.5, 1.05, 0.07);
    boatPart(0xe8ac9a, 0.22, 2.95, 0, 0.5, 0.24, 0.08);
    group.add(sirenBoat);
    group.userData.sirenBoat = sirenBoat;
    for (const [x, z, size] of [
      [10.2, -2.7, 0.65],
      [9.7, -1.7, 0.8],
      [11.1, -2.6, 0.5],
    ])
      rock(0xb2d3c5, x, 0.2, z, size, 0.45, size);
    // Atlantis columns, broken archways and mosaic plaza.
    box(0xbad9cb, -17, 0.14, -35, 11, 0.28, 7);
    for (const x of [-21, -17, -13]) {
      stamp('cylinder', 0xd2e1c5, [x, 2.5, -36], [1.1, 5, 1.1]);
      box(0xe5e6c7, x, 5.05, -36, 1.7, 0.45, 1.7);
      occupy(x, -36, 1.1, 7.3, 0.85);
    }
    box(0xc5dcca, -17, 5.5, -36, 10, 0.6, 1.7);
    cone(0x7da9a6, -17, 6.5, -36, 7, 1.8);
    box(0x9f826b, 19, 0.8, -36, 8, 1.6, 3, -0.18);
    box(0xcbb18a, 19, 3.7, -36, 0.25, 6, 0.25);
    box(0xe5d5b5, 20.3, 4.6, -36, 2.5, 2.5, 0.12, -0.08);
    for (const x of [16, 19, 22]) occupy(x, -36, 1.8, x === 19 ? 6.7 : 1.6, 1.65);
    for (let i = 0; i < 9; i++) {
      const x = 11 + i * 1.7;
      const z = -38 + random() * 2;
      if (clear(x, z, 0.9)) {
        coral(x, z, [0xdca1a0, 0xd5b783, 0xaaa5d1][i % 3]);
        occupy(x, z, 0.9, 1.6, 0.65);
      }
    }
  } else if (id === 'volcano') {
    cone(0x59576c, -17, 3.6, -36, 10, 9);
    occupy(-17, -36, 5.2, 8.7, 4.5);
    cone(0x9a6a6d, -17, 7.6, -36, 6, 2);
    stamp('cylinder', 0xffb770, [-17, 8.6, -36], [3.7, 0.08, 3.7], 0, true);
    for (let i = 0; i < 7; i++) {
      box(0xef9a65, -20 - i * 1.1, 0.06, -27 + i * 4, 4, 0.1, 5.5, -0.2);
      if (i !== 4 && i !== 5) hazards.push({ x: -20 - i * 1.1, z: -27 + i * 4, radius: 1.7 });
    }
    for (let i = 0; i < 8; i++) box(0xc3a08e, -29 + i, 0.08, -9, 0.9, 0.16, 3.2);
    for (const s of [-1, 1]) {
      cone(0x655b70, 18 + s * 3, 2, -36, 3.2, 5);
      occupy(18 + s * 3, -36, 1.8, 4.5, 1.5);
    }
  } else if (id === 'underground') {
    const { floorTiles, wallTiles } = buildCaveFloorplan();
    // An open-top cutaway: the pale connected floor is navigable; stacked rock defines its edges.
    for (const tile of floorTiles) {
      box(tile.color, tile.x, 0.025, tile.z, 2.03, 0.05, 2.03);
      if (Math.abs(tile.x * 7 + tile.z * 11) % 10 === 0) {
        box(0xd7d4db, tile.x + 0.3, 0.058, tile.z - 0.2, 0.26, 0.025, 0.12, 0.3);
        rock(0xc1c8d0, tile.x - 0.4, 0.08, tile.z + 0.35, 0.12, 0.07, 0.2);
      }
    }
    for (const wall of wallTiles) {
      box(0x737991, wall.x, wall.height / 2, wall.z, 2.04, wall.height, 2.04);
      stamp('box', 0x979bb0, [wall.x, wall.height - 0.1, wall.z], [2.1, 0.28, 2.1]);
      stamp('box', 0x626b86, [wall.x, 0.38, wall.z], [2.12, 0.32, 2.12]);
      obstacles.push({ ...wall });
    }
    for (const arch of CAVE_LAYOUT.arches) {
      const color = arch.secret ? 0xaaa0c2 : 0xa4acc3;
      stamp('arch', color, [arch.x, 2.15, arch.z], [arch.width / 2 + 0.25, 2.05, 0.8], arch.yaw);
      for (const side of [-1, 1]) {
        const offset = side * (arch.width / 2 + 0.25);
        const x = arch.x + Math.cos(arch.yaw) * offset;
        const z = arch.z - Math.sin(arch.yaw) * offset;
        box(color, x, 1.1, z, 0.65, 2.2, 0.65, arch.yaw);
        occupy(x, z, 0.48, 4.45, 0.48);
        stamp('rounded', arch.secret ? 0xd2b9eb : 0xe9dcaa, [x, 1.5, z], [0.3, 0.4, 0.3], 0, true);
      }
    }
    // Inlaid breadcrumbs follow every bend. The hidden branch has sparse violet stones.
    for (const tunnel of CAVE_LAYOUT.tunnels) {
      for (let i = 1; i < tunnel.points.length; i++) {
        const [ax, az] = tunnel.points[i - 1],
          [bx, bz] = tunnel.points[i];
        const length = Math.hypot(bx - ax, bz - az);
        for (let d = 1; d < length; d += tunnel.secret ? 3.4 : 2.4) {
          const x = ax + ((bx - ax) * d) / length,
            z = az + ((bz - az) * d) / length;
          // Keep the rescue cage's floor clear of a misleading path through its bars.
          if (Math.hypot(x + 7, z + 9) < 3.1) continue;
          stamp(
            'rounded',
            tunnel.secret ? 0xc9b4e0 : 0xe4dab5,
            [x, 0.075, z],
            [tunnel.secret ? 0.22 : 0.48, 0.08, tunnel.secret ? 0.22 : 0.65],
            Math.atan2(bx - ax, bz - az),
            true,
          );
        }
      }
    }
    for (const [x, z, size] of [
      [-24, 0, 1.25],
      [-19, 3.2, 1.1],
      [-23, -6, 1.4],
      [-22, 1.5, 0.7],
    ])
      mushroom(x, z, size);
    for (const [x, z, size] of [
      [22, -3, 1.4],
      [22, -9, 1.15],
      [16, -10.5, 0.9],
      [3, -24, 1.1],
      [-25, 20.6, 1.8],
      [-28, 18.5, 1.05],
      [-22, 18.5, 1.05],
    ]) {
      crystal(x, z, z > 10 ? 0xcdb3ed : 0xa4dce0, size);
      occupy(x, z, 0.7 * size, 1.5 * size, 0.55 * size);
    }
    stamp('cylinder', 0xddd0e6, [-25, 0.065, 17], [4.2, 0.05, 4.2]);
    for (const exit of CAVE_LAYOUT.exits) {
      // Pale mint rings make a return to the surface easy to recognize from each passage.
      stamp('cylinder', 0xd5e2bd, [exit.x, 0.07, exit.z], [5.4, 0.07, 5.4]);
    }
  } else if (id === 'rifts') {
    for (const s of [-1, 1]) {
      box(0x686481, s * 16, 3, -35, 1.6, 6, 1.6);
      crystal(s * 16, -35, 0xe0b4e6, 1.8);
      rock(0xaa90b3, s * 22, 6, -37, 3.5, 1.2, 3);
      cone(0x6c6383, s * 22, 4.8, -37, 3, 2);
      occupy(s * 16, -35, 1.4, 6.2, 1.15);
      occupy(s * 22, -37, 3.7);
    }
    stamp('cylinder', 0xb7a5d0, [16, 0.08, -15], [9, 0.1, 9], 0, true);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const x = 16 + Math.sin(a) * 5,
        z = -15 + Math.cos(a) * 5;
      if (gameplayClear(x, z, 0.9)) {
        crystal(x, z, 0xa6dfd3, 0.8);
        occupy(x, z, 0.9, 1.4, 0.6);
      }
    }
  } else if (id === 'city') {
    box(0x7e9094, -25, 0.045, -3, 5.5, 0.07, 55);
    box(0x7e9094, 27, 0.045, -3, 5.5, 0.07, 55);
    for (const s of [-1, 1])
      for (let i = 0; i < 5; i++) {
        const x = s * (i % 2 ? 34 : 20),
          z = -36 + i * 10,
          h = 4 + random() * 7;
        if (!clear(x, z, 3)) continue;
        const c = [0x9fbac3, 0xd7b5a1, 0xc9c497, 0xa6adc7][i % 4];
        box(c, x, h / 2, z, 5.2, h, 5.5);
        box(0xe8dfc4, x, h + 0.15, z, 5.6, 0.3, 5.9);
        box(0x83959c, x, h + 0.55, z, 2.8, 0.8, 2.6);
        box(0xe8dfc4, x, 0.16, z, 5.7, 0.3, 6);
        box(0x526d77, x, 0.9, z + 2.79, 1.15, 1.8, 0.08);
        box(0xf1ce87, x, 2, z + 2.95, 1.6, 0.16, 0.55);
        for (let row = 0; row < Math.floor(h / 1.5); row++)
          for (const col of [-1, 0, 1])
            box(0xe3e5c4, x + col * 1.3, 1 + row * 1.5, z + 2.8, 0.7, 0.85, 0.06);
        occupy(x, z, 3.9, h + 0.3, 3.6);
      }
    box(0xcac2a5, 0, 0.13, -20, 12, 0.2, 10);
    for (let i = 0; i < 6; i++)
      box(0xe8dfbb, -2 + (i % 2) * 4, 0.09, 5 - Math.floor(i / 2) * 8, 0.3, 0.1, 2);
  }
  // Footprints prevent a tree canopy or rock cluster from being placed inside a landmark.
  // All high scenery clears full cage/portal/NPC footprints and the complete walking routes.
  for (let i = 0; i < 95; i++) {
    if (id === 'underground') break; // Its room dressing is authored against the cave map.
    const x = (random() - 0.5) * 76,
      z = (random() - 0.5) * 74;
    const scale = 0.8 + random() * 0.6;
    if (!clear(x, z, 2.2 * scale)) continue;
    if (['meadow', 'winter', 'savannah', 'beach'].includes(id) && i % 3 !== 0) tree(x, z, scale);
    else if (id === 'desert') {
      box(0x78a286, x, 1.1, z, 0.55, 2.2, 0.55);
      box(0x78a286, x + 0.45, 1.4, z, 0.8, 0.3, 0.3);
      box(0x78a286, x + 0.8, 1.7, z, 0.3, 0.8, 0.3);
      box(0xe7bb9a, x, 2.24, z, 0.23, 0.12, 0.23);
      occupy(x + 0.3, z, 1.1, 2.3, 0.7);
    } else if (id === 'ocean') {
      coral(x, z, [0xd898a9, 0xd9bf85, 0x9aa3d2][i % 3]);
      occupy(x, z, 1, 1.6, 0.65);
    } else if (id === 'rifts') {
      crystal(x, z, i % 2 ? 0x9dd8cd : 0xc5a1d5, scale);
      occupy(x, z, scale, 1.5 * scale, 0.7 * scale);
    } else {
      rock(p.cliff, x, 0.4, z, scale, scale * 0.65, scale * 0.8);
      occupy(x, z, scale, 0.4 + scale * 0.65, scale * 0.8);
    }
  }
  // Low planting islands supply texture and color variation without extra movement barriers.
  const patch = new THREE.Color(p.ground).lerp(new THREE.Color(p.leaf), 0.22).getHex();
  for (let i = 0; i < 100; i++) {
    if (id === 'underground') break;
    const x = (random() - 0.5) * 75,
      z = (random() - 0.5) * 75;
    if (!clear(x, z, 1.1)) continue;
    stamp(
      'cylinder',
      patch,
      [x, 0.012, z],
      [1.6 + random() * 2.8, 0.025, 1 + random() * 1.5],
      random() * Math.PI,
    );
  }
  // Groundcover: flowers, grasses, shells, seabed gems, or glowing embers.
  for (let i = 0; i < 440; i++) {
    const x = (random() - 0.5) * 77,
      z = (random() - 0.5) * 76;
    if (id === 'underground' && !isCaveWalkable(x, z, 1)) continue;
    if (!clear(x, z, 0.3)) continue;
    const variant = i % 4;
    if (id === 'meadow' || id === 'savannah' || id === 'city') {
      box(p.leaf, x, 0.19, z, 0.07, 0.38, 0.07);
      if (variant < 3) {
        const c = [0xffd77b, 0xf1aaa1, 0xe8eee0][variant];
        box(c, x, 0.4, z, 0.27, 0.09, 0.27);
        box(0xe6b66e, x, 0.46, z, 0.09, 0.04, 0.09);
        box(p.leaf, x + 0.12, 0.2, z, 0.23, 0.055, 0.1, 0.35);
      }
    } else if (id === 'ocean') {
      box(0x6ca79a, x, 0.32, z, 0.13, 0.65, 0.13);
      if (variant === 0) rock(0xf1d8a4, x, 0.16, z, 0.3, 0.18, 0.28);
    } else if (id === 'beach' || id === 'desert')
      rock(variant % 2 ? 0xe7bea4 : 0xf9edce, x, 0.1, z, 0.23, 0.12, 0.3);
    else if (id === 'volcano' || id === 'rifts')
      stamp(
        'box',
        id === 'volcano' ? 0xffbd7b : 0xc9badf,
        [x, 0.1, z],
        [0.22, 0.16, 0.22],
        0.3,
        true,
      );
    else rock(id === 'winter' ? 0xffffff : 0xb3c7ca, x, 0.13, z, 0.25, 0.15, 0.3);
  }
  const matrix = new THREE.Matrix4(),
    rotation = new THREE.Quaternion(),
    position = new THREE.Vector3(),
    scale = new THREE.Vector3();
  const geometry: Record<Shape, THREE.BufferGeometry> = {
    box: new THREE.BoxGeometry(1, 1, 1),
    rounded: new RoundedBoxGeometry(1, 1, 1, 1, 0.065),
    rock: new THREE.IcosahedronGeometry(1, 0),
    cone: new THREE.ConeGeometry(0.5, 1, 5),
    cylinder: new THREE.CylinderGeometry(0.5, 0.5, 1, 24),
    arch: new THREE.TorusGeometry(1, 0.12, 6, 12, Math.PI),
  };
  for (const bucket of buckets.values()) {
    const mat = new THREE.MeshStandardMaterial({
      color: bucket.color,
      roughness: 0.82,
      emissive: bucket.glow ? bucket.color : 0,
      emissiveIntensity: bucket.glow ? 0.23 : 0,
    });
    const mesh = new THREE.InstancedMesh(geometry[bucket.shape].clone(), mat, bucket.items.length);
    bucket.items.forEach((item, i) => {
      position.fromArray(item.position);
      scale.fromArray(item.size);
      rotation.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, item.rotation);
      matrix.compose(position, rotation, scale);
      mesh.setMatrixAt(i, matrix);
    });
    mesh.castShadow = bucket.shadow;
    mesh.receiveShadow = true;
    mesh.computeBoundingSphere();
    group.add(mesh);
  }
  Object.values(geometry).forEach((g) => g.dispose());
  return {
    group,
    obstacles,
    hazards,
    water: id === 'ocean' || id === 'beach',
    sky: p.sky,
    ground: p.ground,
  };
}
