import * as THREE from 'three';

export interface BuiltWorld {
  group: THREE.Group;
  obstacles: Array<{ x: number; z: number; radius: number }>;
  hazards: Array<{ x: number; z: number; radius: number }>;
  water: boolean;
  sky: number;
  ground: number;
}
type Shape = 'box' | 'rock' | 'cone' | 'cylinder';
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
  [0, -19],
];

/** Hand-staged landmarks with deterministic, instanced decoration. */
export function buildWorld(id: string): BuiltWorld {
  const p = palettes[id] ?? palettes.meadow;
  const group = new THREE.Group();
  group.name = `biome:${id}`;
  const obstacles: BuiltWorld['obstacles'] = [];
  const hazards: BuiltWorld['hazards'] = [];
  const buckets = new Map<string, { shape: Shape; color: number; items: Stamp[]; glow: boolean }>();
  function stamp(
    shape: Shape,
    color: number,
    pos: [number, number, number],
    size: [number, number, number],
    rotation = 0,
    glow = false,
  ) {
    const key = `${shape}:${color}:${glow}`;
    if (!buckets.has(key)) buckets.set(key, { shape, color, items: [], glow });
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
  ) => stamp('box', c, [x, y, z], [w, h, d], r);
  const rock = (c: number, x: number, y: number, z: number, w: number, h: number, d: number) =>
    stamp('rock', c, [x, y, z], [w, h, d]);
  const cone = (c: number, x: number, y: number, z: number, w: number, h: number) =>
    stamp('cone', c, [x, y, z], [w, h, w]);
  let seed = [...id].reduce((n, ch) => n * 31 + ch.charCodeAt(0), 211) >>> 0;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  function clear(x: number, z: number, radius = 2) {
    if (Math.hypot(x, z) > 39 || (Math.abs(x) < 4 && z > -36) || (z > -35 && z < -29)) return false;
    if (cages.some(([cx, cz]) => Math.hypot(x - cx, z - cz) < radius + 3.2)) return false;
    if (Math.abs(x) < 15 && z > 4) return false;
    return true;
  }
  const groundMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(43, 43, 1.5, 64),
    new THREE.MeshStandardMaterial({ color: p.ground, roughness: 1 }),
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
  box(p.path, 0, 0.018, -11, 4.5, 0.04, 58);
  box(p.path, 0, 0.02, -32, 66, 0.04, 4.5);
  for (const [x, z] of cages.slice(0, 6)) {
    box(p.path, x / 2, 0.025, z, Math.abs(x) + 4, 0.045, 2.1);
    stamp('cylinder', p.path, [x, 0.035, z], [5.5, 0.05, 5.5]);
  }
  // Small colored stepping tiles make the main trail easy to follow.
  for (let z = 8; z > -29; z -= 5)
    box(id === 'ocean' ? 0xd7e6c6 : 0xf6e3b9, 0.7, 0.053, z, 0.55, 0.05, 0.75, 0.1);

  function tree(x: number, z: number, scale = 1) {
    const snowy = id === 'winter',
      acacia = id === 'savannah',
      palm = id === 'beach';
    box(snowy ? 0x7a8b90 : 0x9b7957, x, scale * 1.3, z, 0.55 * scale, 2.6 * scale, 0.55 * scale);
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
    obstacles.push({ x, z, radius: 0.65 * scale });
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
  }
  function coral(x: number, z: number, color: number) {
    box(color, x, 0.6, z, 0.25, 1.2, 0.25);
    for (const s of [-1, 1]) {
      box(color, x + s * 0.35, 0.85, z, 0.7, 0.18, 0.22);
      box(color, x + s * 0.65, 1.15, z, 0.2, 0.75, 0.2);
    }
  }
  // Background hills and silhouettes are staged behind the adventure, away from camera corridors.
  for (let i = 0; i < 12; i++) {
    const a = Math.PI * 0.67 + (i / 11) * Math.PI * 0.66;
    const x = Math.sin(a) * 39,
      z = Math.cos(a) * 39;
    if (Math.abs(x) < 5 || Math.abs(Math.abs(x) - 30) < 4) continue;
    rock(p.cliff, x, 0.5, z, 4 + random() * 3, 2 + random() * 3, 4);
  }
  if (id === 'meadow') {
    // A giant storybook tree is the Meadow's identifying landmark.
    tree(-18, -34, 2.25);
    box(0xc59462, -18, 1.3, -32.7, 1.1, 1.9, 0.15);
    box(0xffdb81, -18, 1.8, -32.58, 0.45, 0.45, 0.08);
    for (let i = 0; i < 5; i++) {
      box(0xf1d49c, 15 + i * 1.1, 0.7, -35, 0.18, 1.4, 0.2);
    }
    box(0xf1d49c, 17.2, 1, -35, 4.7, 0.16, 0.2);
  } else if (id === 'winter') {
    stamp('cylinder', 0xa1ccd9, [-17, 0.045, -8], [10, 0.08, 7]);
    rock(0xf7f7ed, 17, 1.7, -35, 4, 2.2, 3);
    box(0xb1d5db, 17, 0.8, -32.3, 1.2, 1.6, 0.35);
    for (const s of [-1, 1]) {
      rock(0xf3f5eb, 20 + s * 1.6, 0.65, -19, 0.9, 0.7, 0.9);
      rock(0xf3f5eb, 20 + s * 1.6, 1.5, -19, 0.62, 0.62, 0.62);
      box(0x5b7890, 20 + s * 1.6, 2.05, -19, 1, 0.15, 0.8);
    }
  } else if (id === 'savannah') {
    stamp('cylinder', 0x83b8af, [-20, 0.04, -7], [10, 0.07, 7]);
    tree(17, -35, 1.8);
    for (let i = 0; i < 4; i++)
      rock(0xc3a477, -15 + i * 2, 0.8 + i * 0.3, -36, 2, 1.3 + i * 0.3, 2.6);
  } else if (id === 'desert') {
    for (let k = 0; k < 5; k++)
      box(k % 2 ? 0xdab37b : 0xcba374, -18, k * 1.05 + 0.5, -34, 10 - k * 1.8, 1.1, 8 - k * 1.4);
    stamp('cylinder', 0x77bdad, [20, 0.04, -2], [8, 0.07, 6]);
    tree(23, -4, 1.2);
    for (const s of [-1, 1]) box(0xc69b6c, 17 + s * 2, 2.5, -35, 1.2, 5, 1.2);
    box(0xe7c58f, 17, 5, -35, 5.5, 0.8, 1.5);
  } else if (id === 'beach') {
    box(0x7fc5c6, -29, 0.04, -6, 16, 0.06, 43);
    box(0xb9e1d7, -20.5, 0.065, -6, 1.5, 0.04, 43);
    box(0xb9946f, -26, 0.4, -17, 14, 0.3, 3);
    for (let k = 0; k < 5; k++) box(0xa28061, -31 + k * 2.5, 0.1, -17, 0.4, 1.5, 0.4);
    tree(16, -35, 1.6);
    tree(20, -33, 1.3);
    // Stacked sandcastle towers.
    for (const s of [-1, 1]) {
      box(0xd8b77e, 15 + s * 2, 1.3, -14, 1.7, 2.6, 1.7);
      cone(0xecc994, 15 + s * 2, 3, -14, 2, 1.2);
    }
    box(0xe7c78f, 15, 0.8, -14, 3, 1.6, 1.2);
  } else if (id === 'ocean') {
    // Atlantis columns, broken archways and mosaic plaza.
    box(0xbad9cb, -17, 0.14, -35, 11, 0.28, 7);
    for (const x of [-21, -17, -13]) {
      stamp('cylinder', 0xd2e1c5, [x, 2.5, -36], [1.1, 5, 1.1]);
      box(0xe5e6c7, x, 5.05, -36, 1.7, 0.45, 1.7);
    }
    box(0xc5dcca, -17, 5.5, -36, 10, 0.6, 1.7);
    cone(0x7da9a6, -17, 6.5, -36, 7, 1.8);
    box(0x9f826b, 19, 0.8, -35, 8, 1.6, 3, -0.18);
    box(0xcbb18a, 19, 3.7, -35, 0.25, 6, 0.25);
    box(0xe5d5b5, 20.3, 4.6, -35, 2.5, 2.5, 0.12, -0.08);
    for (let i = 0; i < 9; i++) {
      const x = 11 + i * 1.7;
      coral(x, -38 + random() * 2, [0xdca1a0, 0xd5b783, 0xaaa5d1][i % 3]);
    }
  } else if (id === 'volcano') {
    cone(0x59576c, -18, 3.6, -34, 14, 9);
    cone(0x9a6a6d, -18, 7.6, -34, 6, 2);
    stamp('cylinder', 0xffb770, [-18, 8.6, -34], [3.7, 0.08, 3.7], 0, true);
    for (let i = 0; i < 7; i++) {
      box(0xef9a65, -20 - i * 1.1, 0.06, -27 + i * 4, 4, 0.1, 5.5, -0.2);
      if (i !== 4 && i !== 5) hazards.push({ x: -20 - i * 1.1, z: -27 + i * 4, radius: 1.7 });
    }
    for (let i = 0; i < 6; i++) box(0xc3a08e, -22 + i * 1.2, 0.3, -8, 1, 0.4, 3.2);
    for (const s of [-1, 1]) cone(0x655b70, 18 + s * 3, 2, -35, 4, 5);
  } else if (id === 'underground') {
    for (const x of [-23, -12, 13, 24]) {
      rock(0x656d88, x, 3.6, -36, 3, 5, 3);
      cone(0xa09bb4, x, 1.1, -34, 2, 3);
    }
    box(0x656d88, -17.5, 7.2, -36, 14, 2.5, 5);
    box(0x4b5874, -17.5, 3.4, -38, 7, 5.5, 0.3);
    for (let i = 0; i < 6; i++) crystal(12 + i * 1.9, -36, i % 2 ? 0xa8cbd2 : 0xb6a0d8, 1.8);
    mushroom(-13, -16, 1.7);
    mushroom(-16, -13, 1.1);
  } else if (id === 'rifts') {
    for (const s of [-1, 1]) {
      box(0x686481, s * 16, 3, -35, 1.6, 6, 1.6);
      crystal(s * 16, -35, 0xe0b4e6, 1.8);
      rock(0xaa90b3, s * 22, 6, -37, 3.5, 1.2, 3);
      cone(0x6c6383, s * 22, 4.8, -37, 3, 2);
    }
    stamp('cylinder', 0xb7a5d0, [16, 0.08, -15], [9, 0.1, 9], 0, true);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      crystal(16 + Math.sin(a) * 5, -15 + Math.cos(a) * 5, 0xa6dfd3, 0.8);
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
        for (let row = 0; row < Math.floor(h / 1.5); row++)
          for (const col of [-1, 0, 1])
            box(0xe3e5c4, x + col * 1.3, 1 + row * 1.5, z + 2.8, 0.7, 0.85, 0.06);
        obstacles.push({ x, z, radius: 3.5 });
      }
    box(0xcac2a5, 0, 0.13, -20, 12, 0.2, 10);
    for (let i = 0; i < 6; i++)
      box(0xe8dfbb, -2 + (i % 2) * 4, 0.09, 5 - Math.floor(i / 2) * 8, 0.3, 0.1, 2);
  }
  // Populate edges densely, while all cage platforms and travel lanes remain clear.
  for (let i = 0; i < 44; i++) {
    const x = (random() - 0.5) * 76,
      z = (random() - 0.5) * 74;
    if (!clear(x, z, 2.5)) continue;
    const scale = 0.8 + random() * 0.6;
    if (['meadow', 'winter', 'savannah', 'beach'].includes(id) && i % 3 !== 0) tree(x, z, scale);
    else if (id === 'desert') {
      box(0x78a286, x, 1.1, z, 0.55, 2.2, 0.55);
      box(0x78a286, x + 0.45, 1.4, z, 0.8, 0.3, 0.3);
      box(0x78a286, x + 0.8, 1.7, z, 0.3, 0.8, 0.3);
    } else if (id === 'ocean') coral(x, z, [0xd898a9, 0xd9bf85, 0x9aa3d2][i % 3]);
    else if (id === 'underground' && i % 2) mushroom(x, z, scale);
    else if (id === 'rifts' || id === 'underground')
      crystal(x, z, i % 2 ? 0x9dd8cd : 0xc5a1d5, scale);
    else {
      rock(p.cliff, x, 0.4, z, scale, scale * 0.65, scale * 0.8);
    }
  }
  // Groundcover: flowers, grasses, shells, seabed gems, or glowing embers.
  for (let i = 0; i < 230; i++) {
    const x = (random() - 0.5) * 77,
      z = (random() - 0.5) * 76;
    if (!clear(x, z, 0.3)) continue;
    const variant = i % 4;
    if (id === 'meadow' || id === 'savannah' || id === 'city') {
      box(p.leaf, x, 0.19, z, 0.07, 0.38, 0.07);
      if (variant < 3) {
        const c = [0xffd77b, 0xf1aaa1, 0xe8eee0][variant];
        box(c, x, 0.4, z, 0.27, 0.09, 0.27);
        box(0xe6b66e, x, 0.46, z, 0.09, 0.04, 0.09);
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
    rock: new THREE.IcosahedronGeometry(1, 0),
    cone: new THREE.ConeGeometry(0.5, 1, 5),
    cylinder: new THREE.CylinderGeometry(0.5, 0.5, 1, 24),
  };
  for (const bucket of buckets.values()) {
    const mat = new THREE.MeshStandardMaterial({
      color: bucket.color,
      roughness: 0.95,
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
    mesh.castShadow = bucket.shape !== 'cylinder';
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
