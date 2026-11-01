import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { WorldSurface } from './world';

/** Matches the swimming boundary in the player controller. All playable water stays west of it. */
export const BEACH_WATER_EDGE = -20;
type Point = [number, number, number];
interface BeachPlacement {
  clear: (x: number, z: number, radius: number) => boolean;
  occupy: (
    x: number,
    z: number,
    footprint: number,
    height?: number,
    collisionRadius?: number,
    top?: WorldSurface,
  ) => void;
  slab: (x: number, z: number, half: [number, number], height: number) => void;
}
interface Bubble {
  x: number;
  y: number;
  z: number;
  radius: number;
  phase: number;
}
interface BeachMotion {
  shells: THREE.InstancedMesh;
  rims: THREE.InstancedMesh;
  glints: THREE.InstancedMesh;
  bubbles: Bubble[];
  waterEdge: number;
}

/** Circularly clipped flat band: keeps the visible swimming area exactly aligned with gameplay. */
function waterBand(
  group: THREE.Group,
  minX: number,
  maxX: number,
  y: number,
  color: number,
  name: string,
) {
  const radius = 42.98;
  const shape = new THREE.Shape();
  const points: Array<[number, number]> = [];
  const count = Math.ceil((maxX - minX) / 0.6);
  for (let i = 0; i <= count; i++) {
    const x = minX + ((maxX - minX) * i) / count;
    points.push([x, Math.sqrt(Math.max(0, radius * radius - x * x))]);
  }
  for (let i = count; i >= 0; i--) {
    const x = minX + ((maxX - minX) * i) / count;
    points.push([x, -Math.sqrt(Math.max(0, radius * radius - x * x))]);
  }
  points.forEach(([x, z], i) => {
    if (i === 0) shape.moveTo(x, -z);
    else shape.lineTo(x, -z);
  });
  shape.closePath();
  const geometry = new THREE.ShapeGeometry(shape);
  geometry.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color, roughness: 0.36, metalness: 0.035 }),
  );
  mesh.name = name;
  mesh.position.y = y;
  mesh.receiveShadow = true;
  group.add(mesh);
}

function palmLeaf(): THREE.BufferGeometry {
  const points = [
    [0, 0, 0],
    [-0.3, -0.04, 0.75],
    [-0.26, -0.24, 1.65],
    [0, -0.63, 2.45],
    [0.26, -0.24, 1.65],
    [0.3, -0.04, 0.75],
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points.flat(), 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5]);
  geometry.computeVertexNormals();
  return geometry;
}

/** Original coastal toy scenery, batched separately from the other biome geometry. */
export function buildBeach(group: THREE.Group, placement: BeachPlacement): void {
  const { clear, occupy, slab } = placement;
  const ocean = new THREE.Mesh(
    new THREE.RingGeometry(43, 86, 96),
    new THREE.MeshStandardMaterial({ color: 0x4caec7, roughness: 0.4, metalness: 0.02 }),
  );
  ocean.name = 'offshore-ocean';
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.y = -0.14;
  ocean.receiveShadow = true;
  group.add(ocean);
  waterBand(group, -42.98, BEACH_WATER_EDGE, 0.075, 0x43b9ca, 'swimmable-bay');
  waterBand(group, -27, BEACH_WATER_EDGE, 0.085, 0x76d8d0, 'clear-shallows');
  waterBand(group, -22.7, BEACH_WATER_EDGE, 0.095, 0xa4e5d9, 'shoreline-shallows');
  waterBand(group, BEACH_WATER_EDGE, -18.65, 0.065, 0xe4cba1, 'wet-sand');

  const geometry = {
    box: new THREE.BoxGeometry(1, 1, 1),
    rounded: new RoundedBoxGeometry(1, 1, 1, 1, 0.065),
    pole: new THREE.CylinderGeometry(0.5, 0.5, 1, 8),
    leaf: palmLeaf(),
    sphere: new THREE.SphereGeometry(0.5, 10, 6),
    foam: new THREE.CylinderGeometry(0.5, 0.5, 1, 12),
    roof: new THREE.ConeGeometry(0.5, 1, 10, 1, true),
    ring: new THREE.TorusGeometry(0.5, 0.12, 6, 20),
    shell: new THREE.SphereGeometry(0.5, 10, 6, 0, Math.PI),
  };
  type Shape = keyof typeof geometry;
  const buckets = new Map<
    string,
    { shape: Shape; color: number; shadow: boolean; matrices: THREE.Matrix4[] }
  >();
  const rotation = new THREE.Quaternion(),
    euler = new THREE.Euler();
  function stamp(
    shape: Shape,
    color: number,
    p: Point,
    size: Point,
    angles: Point = [0, 0, 0],
    shadow = true,
  ) {
    const key = `${shape}:${color}:${shadow}`;
    if (!buckets.has(key)) buckets.set(key, { shape, color, shadow, matrices: [] });
    rotation.setFromEuler(euler.set(...angles));
    buckets
      .get(key)!
      .matrices.push(
        new THREE.Matrix4().compose(new THREE.Vector3(...p), rotation, new THREE.Vector3(...size)),
      );
  }
  // A continuous, narrow foam edge marks x=-20. Broken seaward ribbons read as waves.
  for (let z = -37; z <= 37; z += 1.45) {
    const x = BEACH_WATER_EDGE - 0.22 - Math.sin(z * 0.43) * 0.12;
    stamp('foam', 0xf5fff0, [x, 0.13, z], [0.7, 0.055, 1.72], [0, 0, 0], false);
    if (Math.abs(z) < 34)
      stamp(
        'foam',
        0xd1f4e8,
        [-22.7 - Math.sin(z * 0.27) * 0.35, 0.12, z + 0.5],
        [0.38, 0.03, 0.9],
        [0, 0.25, 0],
        false,
      );
  }
  for (let i = 0; i < 45; i++) {
    const x = -25 - (i % 5) * 2.6,
      z = -30 + Math.floor(i / 5) * 7.1 + (i % 3) * 0.55;
    if (Math.hypot(x, z) > 41.2) continue;
    stamp(
      'rounded',
      i % 3 ? 0xb2e7df : 0xe5f9e9,
      [x, 0.115, z],
      [1.15 + (i % 3) * 0.3, 0.035, 0.14],
      [0, 0.17, 0],
      false,
    );
  }
  for (let i = 0; i < 22; i++) {
    const x = -49 + (i % 11) * 9.8,
      z = -47 - Math.floor(i / 11) * 10;
    stamp('rounded', 0xb2e7df, [x, -0.09, z], [3.2, 0.035, 0.19], [0, -0.13, 0], false);
  }
  function palm(x: number, z: number, size: number, lean: number) {
    const radius = 2.65 * size;
    if (!clear(x, z, radius)) return;
    for (let k = 0; k < 4; k++) {
      const shift = lean * k * k * 0.035 * size;
      stamp(
        'pole',
        k % 2 ? 0xb58a5b : 0xc59a68,
        [x + shift, (k * 0.82 + 0.43) * size, z],
        [0.42 * size, 0.9 * size, 0.42 * size],
        [0, 0, -lean * 0.075 * k],
      );
      stamp(
        'pole',
        0x936e4c,
        [x + shift, (k * 0.82 + 0.63) * size, z],
        [0.44 * size, 0.065 * size, 0.44 * size],
        [0, 0, -lean * 0.075 * k],
      );
    }
    const topX = x + lean * 0.38 * size,
      topY = 3.42 * size;
    for (let k = 0; k < 7; k++) {
      stamp(
        'leaf',
        k % 2 ? 0x4a9b79 : 0x6cb886,
        [topX, topY, z],
        [size, size, size],
        [0, (k * Math.PI * 2) / 7, 0],
      );
      stamp(
        'leaf',
        0x89ca91,
        [topX, topY + 0.08 * size, z],
        [0.7 * size, 0.75 * size, 0.75 * size],
        [0, (k * Math.PI * 2) / 7 + 0.17, 0],
      );
    }
    for (let k = 0; k < 3; k++)
      stamp(
        'sphere',
        0xa67b4c,
        [topX + (k - 1) * 0.24 * size, topY - 0.25 * size, z + 0.12 * (k % 2)],
        [0.4 * size, 0.46 * size, 0.4 * size],
      );
    // The fronds hold a landing; they spread from the leaning crown, just off the trunk base.
    occupy(x, z, radius, topY + 0.3 * size, 0.43 * size, { y: topY, radius: 1.5 * size });
  }
  for (const [x, z, size, lean] of [
    [-11, 2, 1.15, 1],
    [12, 1, 1.2, -1],
    [-18.5, 11, 1, 1],
    [18, 12, 1.05, -1],
    [-13, -35, 1, 1],
    [20, -19, 1.1, -1],
    [27, -15, 0.9, -1],
  ])
    palm(x, z, size, lean);

  // Colorful furniture flanks the first view; the center and rescue approaches stay open.
  function umbrella(x: number, z: number, color: number) {
    if (!clear(x, z, 1.9)) return;
    stamp('pole', 0xe5d0a5, [x, 1.23, z], [0.12, 2.46, 0.12]);
    stamp('roof', color, [x, 2.42, z], [3.5, 0.6, 3.5]);
    stamp('roof', 0xfff1cc, [x, 2.46, z], [3.02, 0.55, 3.02], [0, Math.PI / 5, 0]);
    stamp('sphere', color, [x, 2.76, z], [0.2, 0.2, 0.2]);
    stamp('rounded', color, [x, 0.08, z + 0.45], [2.1, 0.08, 2.4], [0, 0.1, 0], false);
    for (const side of [-1, 1])
      stamp(
        'box',
        0xffeed0,
        [x + side * 0.72, 0.125, z + 0.45],
        [0.22, 0.025, 2.15],
        [0, 0.1, 0],
        false,
      );
    occupy(x, z, 1.9, 2.9, 0.25, { y: 2.5, radius: 1.4 });
  }
  umbrella(-13, -6, 0xe99b91);
  umbrella(10, -5, 0x75b5c2);
  umbrella(29, 4, 0xe99b91);
  // A low slatted jetty reaches into the water without blocking the swimming entrance.
  for (let k = 0; k < 13; k++)
    stamp('rounded', k % 2 ? 0xd3ae7c : 0xc59b6b, [-19.1 - k * 0.68, 0.085, -15], [0.62, 0.1, 2.5]);
  for (const x of [-19.4, -23.4, -27.1])
    for (const z of [-16.15, -13.85]) {
      if (!clear(x, z, 0.65)) continue;
      stamp('pole', 0x9c7959, [x, 0.6, z], [0.3, 1.2, 0.3]);
      stamp('sphere', 0xf6e3b9, [x, 1.23, z], [0.4, 0.16, 0.4]);
      occupy(x, z, 0.65, 1.35, 0.28);
    }
  // The castle has crenellations and a sea-blue flag, rather than a desert-pyramid silhouette.
  if (clear(23, 3, 3.2)) {
    for (const s of [-1, 1]) {
      stamp('rounded', 0xe6c68c, [23 + s * 1.7, 0.85, 3], [1.45, 1.7, 1.45]);
      for (const a of [-1, 1])
        for (const b of [-1, 1])
          stamp(
            'rounded',
            0xf1d9a3,
            [23 + s * 1.7 + a * 0.46, 1.85, 3 + b * 0.46],
            [0.43, 0.4, 0.43],
          );
    }
    stamp('rounded', 0xf1d9a3, [23, 0.58, 3], [2.1, 1.15, 1.1]);
    stamp('rounded', 0xc09b67, [23, 0.4, 2.43], [0.55, 0.8, 0.045]);
    stamp('pole', 0x9e8057, [24.7, 2.4, 3], [0.08, 1.2, 0.08]);
    stamp('box', 0x64b5c7, [25.1, 2.83, 3], [0.8, 0.38, 0.06]);
    occupy(23, 3, 3.2);
    // Two climbable towers joined by the lower gatehouse wall.
    for (const s of [-1, 1]) slab(23 + s * 1.7, 3, [0.725, 0.725], 2.05);
    slab(23, 3, [1.05, 0.55], 1.155);
  }
  // Swim rings, shell fans, sea stars, and dune grass provide recognizable close detail.
  for (const [x, z] of [
    [-16, 4],
    [15, -1],
    [16, 17],
    [-17, -19],
  ]) {
    if (!clear(x, z, 1)) continue;
    stamp('ring', 0xf0b1a2, [x, 0.26, z], [1.35, 1.35, 1.35], [Math.PI / 2, 0, 0.1]);
    occupy(x, z, 1);
  }
  for (let i = 0; i < 32; i++) {
    const x = -17 + (i % 8) * 5.2,
      z = -23 + Math.floor(i / 8) * 9.5 + (i % 3) * 0.6;
    if (!clear(x, z, 0.55)) continue;
    if (i % 3 === 0) {
      for (let k = 0; k < 5; k++)
        stamp(
          'rounded',
          0xeaa58a,
          [
            x + Math.sin((k * Math.PI * 2) / 5) * 0.23,
            0.12,
            z + Math.cos((k * Math.PI * 2) / 5) * 0.23,
          ],
          [0.16, 0.11, 0.5],
          [0, (k * Math.PI * 2) / 5, 0],
          false,
        );
    } else {
      stamp(
        'shell',
        i % 2 ? 0xfff0ce : 0xe9baa6,
        [x, 0.09, z],
        [0.72, 0.42, 0.6],
        [Math.PI / 2, i * 0.7, 0],
        false,
      );
      for (let k = -1; k <= 1; k++)
        stamp(
          'rounded',
          0xd5b591,
          [x + k * 0.12, 0.17, z],
          [0.035, 0.04, 0.38],
          [0, k * 0.3, 0],
          false,
        );
    }
  }
  for (const [x, z] of [
    [-15, 9],
    [-18, -10],
    [16, 8],
    [20, -13],
    [30, -8],
    [-16, 19],
  ]) {
    if (!clear(x, z, 0.8)) continue;
    for (let k = 0; k < 5; k++)
      stamp(
        'leaf',
        k % 2 ? 0x77ad82 : 0x99c28a,
        [x, 0.03, z],
        [0.15, 0.55, 0.32],
        [0, (k * Math.PI * 2) / 5, 0],
        false,
      );
  }
  for (const bucket of buckets.values()) {
    const material = new THREE.MeshStandardMaterial({
      color: bucket.color,
      roughness: 0.8,
      side:
        bucket.shape === 'leaf' || bucket.shape === 'roof' || bucket.shape === 'shell'
          ? THREE.DoubleSide
          : THREE.FrontSide,
    });
    const mesh = new THREE.InstancedMesh(
      geometry[bucket.shape].clone(),
      material,
      bucket.matrices.length,
    );
    mesh.name = `beach:${bucket.shape}`;
    bucket.matrices.forEach((matrix, i) => mesh.setMatrixAt(i, matrix));
    mesh.castShadow = bucket.shadow;
    mesh.receiveShadow = true;
    mesh.computeBoundingSphere();
    group.add(mesh);
  }
  Object.values(geometry).forEach((g) => g.dispose());

  const bubbles: Bubble[] = [];
  for (const [cx, cz] of [
    [-12, 4],
    [-8, -2],
    [10, 2],
    [-22, -6],
    [-27, 9],
    [-26, -21],
    [21, -18],
  ])
    for (let i = 0; i < 4; i++)
      bubbles.push({
        x: cx + Math.sin(i * 2.1) * 1.1,
        y: 0.7 + i * 0.75,
        z: cz + Math.cos(i * 1.7) * 0.8,
        radius: 0.22 + (i % 3) * 0.14,
        phase: i * 1.6 + cx * 0.13,
      });
  const shells = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 12, 8),
    new THREE.MeshStandardMaterial({
      color: 0xc4f4ed,
      roughness: 0.12,
      metalness: 0.05,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    }),
    bubbles.length,
  );
  const rims = new THREE.InstancedMesh(
    new THREE.TorusGeometry(1, 0.033, 6, 20),
    new THREE.MeshBasicMaterial({
      color: 0xcbf6ef,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    }),
    bubbles.length,
  );
  const glints = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 8, 6),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
    }),
    bubbles.length,
  );
  shells.name = 'bay-bubbles';
  rims.name = 'bubble-rims';
  glints.name = 'bubble-highlights';
  // Tiny transparent instances should never disappear because their initial bounds were stale.
  shells.frustumCulled = rims.frustumCulled = glints.frustumCulled = false;
  group.add(shells, rims, glints);
  group.userData.beachMotion = {
    shells,
    rims,
    glints,
    bubbles,
    waterEdge: BEACH_WATER_EDGE,
  } satisfies BeachMotion;
  animateBeach(group, 0, true);
}

const bubbleMatrix = new THREE.Matrix4(),
  bubbleRotation = new THREE.Quaternion(),
  bubblePosition = new THREE.Vector3(),
  bubbleScale = new THREE.Vector3();
/** Optional gameplay hook; reduced motion keeps a stable, fully visible bubble arrangement. */
export function animateBeach(group: THREE.Group, time: number, reducedMotion: boolean): void {
  const motion = group.userData.beachMotion as BeachMotion | undefined;
  if (!motion) return;
  for (const [i, b] of motion.bubbles.entries()) {
    const wave = reducedMotion ? 0 : Math.sin(time * 0.7 + b.phase);
    const x = b.x + wave * 0.16,
      y = b.y + wave * 0.24,
      z = b.z;
    bubblePosition.set(x, y, z);
    bubbleScale.setScalar(b.radius);
    bubbleMatrix.compose(bubblePosition, bubbleRotation, bubbleScale);
    motion.shells.setMatrixAt(i, bubbleMatrix);
    motion.rims.setMatrixAt(i, bubbleMatrix);
    bubblePosition.set(x - b.radius * 0.32, y + b.radius * 0.4, z + b.radius * 0.8);
    bubbleScale.set(b.radius * 0.16, b.radius * 0.23, b.radius * 0.075);
    bubbleMatrix.compose(bubblePosition, bubbleRotation, bubbleScale);
    motion.glints.setMatrixAt(i, bubbleMatrix);
  }
  motion.shells.instanceMatrix.needsUpdate =
    motion.rims.instanceMatrix.needsUpdate =
    motion.glints.instanceMatrix.needsUpdate =
      true;
}
