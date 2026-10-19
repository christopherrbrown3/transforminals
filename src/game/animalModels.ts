import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/** Original toy sculptures; anatomical references are recorded in docs/CREATURE_REFERENCE.md. */
export interface AnimalRig {
  legs: THREE.Group[];
  wings: THREE.Group[];
  tail?: THREE.Group;
  head?: THREE.Group;
  ears?: THREE.Group[];
  tailSegments?: THREE.Group[];
  motion?: 'walk' | 'heavy' | 'crawl' | 'fish' | 'fly' | 'tentacles';
  stride?: number;
  wingSpeed?: number;
  wingAmplitude?: number;
}
type Point = [number, number, number];
const INK = 0x263d43,
  IVORY = 0xffefd3;

function mesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, color: number, p: Point) {
  const part = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.02 }),
  );
  part.position.set(...p);
  part.castShadow = true;
  part.receiveShadow = true;
  parent.add(part);
  return part;
}
function box(parent: THREE.Object3D, color: number, size: Point, p: Point, rz = 0) {
  const small = Math.min(...size);
  const geo =
    small > 0.1
      ? new RoundedBoxGeometry(...size, 2, Math.min(0.065, small * 0.2))
      : new THREE.BoxGeometry(...size);
  const part = mesh(parent, geo, color, p);
  part.rotation.z = rz;
  return part;
}
function oval(parent: THREE.Object3D, color: number, size: Point, p: Point) {
  const tiny = Math.max(...size) < 0.1;
  const part = mesh(parent, new THREE.SphereGeometry(1, tiny ? 8 : 12, tiny ? 6 : 8), color, p);
  part.scale.set(...size);
  return part;
}
function rod(parent: THREE.Object3D, color: number, from: Point, to: Point, radius = 0.035) {
  const a = new THREE.Vector3(...from),
    b = new THREE.Vector3(...to);
  const part = mesh(
    parent,
    new THREE.CylinderGeometry(radius, radius, a.distanceTo(b), 6),
    color,
    [0, 0, 0],
  );
  part.position.copy(a).add(b).multiplyScalar(0.5);
  part.quaternion.setFromUnitVectors(THREE.Object3D.DEFAULT_UP, b.sub(a).normalize());
  return part;
}
function tip(
  parent: THREE.Object3D,
  color: number,
  radius: number,
  height: number,
  p: Point,
  rz = 0,
) {
  const part = mesh(parent, new THREE.ConeGeometry(radius, height, 5), color, p);
  part.rotation.z = rz;
  return part;
}
/** Solid thin outlines give wings, flippers, and fins real silhouettes from both sides. */
function plate(
  parent: THREE.Object3D,
  color: number,
  points: Array<[number, number]>,
  plane: 'xz' | 'yz' = 'xz',
  depth = 0.065,
) {
  const shape = new THREE.Shape();
  points.forEach(([a, b], i) => {
    const x = plane === 'xz' ? a : -a,
      y = plane === 'xz' ? -b : b;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    steps: 1,
    curveSegments: 1,
  });
  geo.translate(0, 0, -depth / 2);
  if (plane === 'xz') geo.rotateX(-Math.PI / 2);
  else geo.rotateY(Math.PI / 2);
  return mesh(parent, geo, color, [0, 0, 0]);
}
function joint(parent: THREE.Object3D, p: Point, name: string) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...p);
  parent.add(group);
  return group;
}
function eyes(parent: THREE.Object3D, x: number, y: number, z: number, size = 1, iris = 0x82623d) {
  for (const s of [-1, 1]) {
    oval(parent, IVORY, [0.12 * size, 0.145 * size, 0.065 * size], [s * x, y, z]);
    const eye = oval(
      parent,
      iris,
      [0.075 * size, 0.1 * size, 0.04 * size],
      [s * x, y, z - 0.055 * size],
    );
    eye.material.roughness = 0.28;
    oval(parent, INK, [0.043 * size, 0.072 * size, 0.022 * size], [s * x, y, z - 0.086 * size]);
    oval(
      parent,
      0xffffff,
      [0.025 * size, 0.028 * size, 0.012 * size],
      [s * x - 0.021 * size, y + 0.035 * size, z - 0.105 * size],
    );
  }
}
function smile(parent: THREE.Object3D, width: number, y: number, z: number) {
  rod(parent, INK, [-width, y + 0.03, z], [0, y, z - 0.025], 0.018);
  rod(parent, INK, [0, y, z - 0.025], [width, y + 0.03, z], 0.018);
}
function whiskers(parent: THREE.Object3D, x: number, y: number, z: number, length = 0.25) {
  for (const s of [-1, 1])
    for (const offset of [-0.055, 0.055])
      rod(
        parent,
        0xf1dec1,
        [s * x, y + offset, z],
        [s * (x + length), y + offset * 2, z + 0.04],
        0.012,
      );
}
function paw(
  g: THREE.Group,
  rig: AnimalRig,
  color: number,
  x: number,
  y: number,
  z: number,
  width: number,
  foot = color,
  hoof = false,
) {
  const p = joint(g, [x, y, z], 'leg');
  box(p, color, [width, y, width], [0, -y / 2, 0]);
  box(p, foot, [width * 1.18, 0.18, width * 1.5], [0, -y + 0.09, -width * 0.15]);
  if (hoof) box(p, INK, [0.025, 0.11, 0.035], [0, -y + 0.07, -width * 0.92]);
  else
    for (const toe of [-1, 0, 1])
      box(
        p,
        foot === color ? 0xdcc9ad : color,
        [0.025, 0.06, 0.025],
        [toe * width * 0.23, -y + 0.07, -width * 0.91],
      );
  rig.legs.push(p);
  return p;
}
function fourPaws(
  g: THREE.Group,
  rig: AnimalRig,
  color: number,
  width: number,
  height: number,
  front: number,
  back: number,
  thickness: number,
  foot = color,
  hoof = false,
) {
  for (const z of [front, back])
    for (const s of [-1, 1]) paw(g, rig, color, s * width, height, z, thickness, foot, hoof);
}
function tail(g: THREE.Group, rig: AnimalRig, p: Point) {
  const t = joint(g, p, 'tail');
  rig.tail = t;
  return t;
}
function feature(g: THREE.Group, ...features: string[]) {
  g.userData.features = features;
  g.userData.artVersion = 2;
}

function fox(id: string, g: THREE.Group, rig: AnimalRig) {
  const arctic = id === 'arctic-fox',
    fur = arctic ? 0xe8f1f3 : 0xda7a36,
    pale = arctic ? 0xffffff : IVORY;
  rig.motion = 'walk';
  rig.stride = 0.38;
  box(
    g,
    fur,
    [arctic ? 0.88 : 0.68, arctic ? 0.72 : 0.58, arctic ? 1.25 : 1.42],
    [0, arctic ? 0.68 : 0.76, 0.14],
  );
  oval(g, pale, [arctic ? 0.43 : 0.33, 0.39, 0.22], [0, 0.76, -0.42]);
  fourPaws(
    g,
    rig,
    fur,
    arctic ? 0.28 : 0.23,
    arctic ? 0.31 : 0.44,
    -0.36,
    0.63,
    arctic ? 0.29 : 0.21,
    arctic ? 0xd0e0e8 : 0x4b3e3d,
  );
  const h = joint(g, [0, arctic ? 1.04 : 1.13, -0.64], 'head');
  rig.head = h;
  box(h, fur, [arctic ? 0.79 : 0.65, 0.55, 0.62], [0, 0, 0]);
  // Tapered two-part muzzle and flared cheek ruffs differ from the round, short Arctic face.
  for (const s of [-1, 1])
    oval(h, pale, [arctic ? 0.26 : 0.24, 0.19, 0.26], [s * 0.22, -0.11, -0.24]);
  box(
    h,
    pale,
    [arctic ? 0.39 : 0.36, 0.21, arctic ? 0.3 : 0.47],
    [0, -0.12, arctic ? -0.39 : -0.48],
  );
  oval(h, INK, [0.105, 0.075, 0.07], [0, -0.06, arctic ? -0.57 : -0.73]);
  eyes(h, arctic ? 0.22 : 0.19, 0.08, -0.33, 0.8, arctic ? 0x578aa2 : 0xa77a3d);
  smile(h, 0.12, -0.23, arctic ? -0.55 : -0.64);
  rig.ears = [];
  for (const s of [-1, 1]) {
    const ear = joint(h, [s * (arctic ? 0.29 : 0.24), 0.29, 0.03], 'ear');
    rig.ears.push(ear);
    if (arctic) {
      oval(ear, fur, [0.17, 0.21, 0.12], [0, 0.13, 0]);
      oval(ear, 0xc4d3df, [0.1, 0.13, 0.04], [0, 0.13, -0.1]);
    } else {
      tip(ear, 0x55403b, 0.2, 0.51, [0, 0.19, 0], -s * 0.14);
      tip(ear, fur, 0.16, 0.43, [0, 0.15, -0.035], -s * 0.14);
      tip(ear, pale, 0.09, 0.29, [0, 0.15, -0.13], -s * 0.14);
    }
  }
  const t = tail(g, rig, [0, 0.7, 0.73]);
  oval(t, fur, [arctic ? 0.33 : 0.28, arctic ? 0.33 : 0.29, 0.6], [0, 0.15, 0.47]);
  oval(t, pale, [0.25, 0.25, 0.3], [0, 0.19, 0.95]);
  for (const s of [-1, 1]) box(t, fur, [0.18, 0.22, 0.35], [s * 0.2, 0.12, 0.55], s * 0.25);
  t.rotation.x = -0.25;
  feature(
    g,
    arctic ? 'compact winter body' : 'long pointed muzzle',
    arctic ? 'short round ears' : 'dark-backed triangular ears',
    'bushy pale-tipped tail',
    arctic ? 'furred broad paws' : 'dark stockings',
  );
}

function cat(id: string, g: THREE.Group, rig: AnimalRig) {
  const lion = id === 'lion',
    fur = lion ? 0xd9aa55 : 0xe99738,
    dark = lion ? 0x8c5033 : 0x3e3932;
  rig.motion = 'walk';
  rig.stride = 0.36;
  box(g, fur, [0.88, 0.73, 1.65], [0, 0.91, 0.18]);
  oval(g, fur, [0.47, 0.48, 0.43], [0, 0.88, -0.35]);
  box(g, IVORY, [0.62, 0.22, 1.22], [0, 0.6, 0.05]);
  fourPaws(g, rig, fur, 0.3, 0.49, -0.42, 0.8, 0.28, lion ? fur : IVORY);
  const h = joint(g, [0, 1.2, -0.71], 'head');
  rig.head = h;
  if (lion) {
    oval(h, dark, [0.7, 0.72, 0.49], [0, 0, 0.13]);
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5;
      box(
        h,
        i % 2 ? 0xa16338 : dark,
        [0.32, 0.4, 0.28],
        [Math.sin(a) * 0.53, Math.cos(a) * 0.53, 0.03],
        -a,
      );
    }
  }
  box(h, fur, [0.77, 0.64, 0.67], [0, 0, 0]);
  for (const s of [-1, 1]) {
    oval(h, lion ? fur : dark, [0.17, 0.19, 0.1], [s * 0.31, 0.36, 0.02]);
    oval(h, lion ? 0xc78264 : IVORY, [0.1, 0.1, 0.035], [s * 0.31, 0.37, -0.075]);
    oval(h, IVORY, [0.23, 0.18, 0.18], [s * 0.16, -0.15, -0.37]);
    box(h, IVORY, [0.23, 0.075, 0.04], [s * 0.22, 0.2, -0.34], s * 0.16);
  }
  eyes(h, 0.22, 0.065, -0.35, 0.88, 0x9e8648);
  oval(h, 0x81524e, [0.125, 0.085, 0.065], [0, -0.09, -0.53]);
  smile(h, 0.21, -0.26, -0.56);
  whiskers(h, 0.23, -0.19, -0.48);
  const t = tail(g, rig, [0, 0.94, 0.95]);
  rod(t, fur, [0, 0, 0], [0.05, 0.05, 0.53], 0.09);
  rod(t, fur, [0.05, 0.05, 0.53], [0.1, 0.32, 0.93], 0.075);
  if (lion) oval(t, dark, [0.16, 0.19, 0.16], [0.1, 0.34, 0.94]);
  else {
    for (const s of [-1, 1]) {
      for (let i = 0; i < 5; i++)
        box(
          g,
          dark,
          [0.035, 0.47 - (i % 2) * 0.1, 0.105],
          [s * 0.448, 0.98, -0.42 + i * 0.29],
          s * (0.18 + (i % 2) * 0.15),
        );
      for (let i = 0; i < 3; i++)
        box(h, dark, [0.18, 0.045, 0.045], [s * 0.3, 0.09 - i * 0.1, -0.354], s * 0.3);
    }
    for (let i = 0; i < 4; i++) box(g, dark, [0.67, 0.025, 0.09], [0, 1.28, -0.29 + i * 0.37], 0);
    for (let i = 0; i < 4; i++)
      box(t, dark, [0.17, 0.16, 0.07], [i * 0.023, i < 2 ? 0.03 : 0.16, 0.16 + i * 0.21]);
    box(h, dark, [0.07, 0.14, 0.04], [0, 0.24, -0.35]);
  }
  feature(
    g,
    lion ? 'layered radial mane' : 'body, face, and tail stripes',
    'round ears',
    'broad cat paws',
    'split whisker pads',
    lion ? 'tufted tail' : 'white belly and brow marks',
  );
}

function giraffe(g: THREE.Group, rig: AnimalRig) {
  const fur = 0xeec36c,
    spot = 0xa7743e;
  rig.motion = 'walk';
  rig.stride = 0.22;
  box(g, fur, [0.76, 0.65, 1.35], [0, 1.15, 0.23]);
  fourPaws(g, rig, fur, 0.25, 0.89, -0.25, 0.72, 0.19, 0x665144, true);
  box(g, fur, [0.43, 1.3, 0.47], [0, 1.81, -0.39]);
  for (let i = 0; i < 5; i++) box(g, 0x805638, [0.17, 0.19, 0.14], [0, 1.35 + i * 0.22, -0.11]);
  const h = joint(g, [0, 2.39, -0.49], 'head');
  rig.head = h;
  box(h, fur, [0.52, 0.4, 0.8], [0, 0, -0.12]);
  oval(h, 0xd2aa6c, [0.29, 0.18, 0.26], [0, -0.07, -0.54]);
  eyes(h, 0.185, 0.08, -0.43, 0.76, 0x614b32);
  for (const s of [-1, 1]) {
    oval(h, fur, [0.23, 0.1, 0.13], [s * 0.39, 0.17, 0.04]);
    oval(h, 0xc48c60, [0.15, 0.05, 0.08], [s * 0.4, 0.22, 0.025]);
    rod(h, fur, [s * 0.16, 0.18, 0], [s * 0.18, 0.47, 0.02], 0.065);
    oval(h, 0x6f5037, [0.09, 0.08, 0.09], [s * 0.18, 0.49, 0.02]);
    oval(h, INK, [0.035, 0.025, 0.025], [s * 0.14, 0.01, -0.77]);
    for (let i = 0; i < 4; i++)
      box(
        g,
        spot,
        [0.035, 0.23, 0.24],
        [s * 0.388, 1.15 + (i % 2) * 0.12, -0.25 + i * 0.3],
        (i % 2) * 0.2,
      );
    for (let i = 0; i < 5; i++)
      box(g, spot, [0.025, 0.16, 0.22], [s * 0.221, 1.42 + i * 0.2, -0.39], ((i % 2) - 0.5) * 0.25);
  }
  const t = tail(g, rig, [0, 1.15, 0.9]);
  rod(t, fur, [0, 0, 0], [0, -0.37, 0.36], 0.055);
  oval(t, 0x805638, [0.12, 0.18, 0.12], [0, -0.43, 0.39]);
  feature(
    g,
    'long neck and legs',
    'paired tufted ossicones',
    'leaf-shaped ears',
    'irregular chestnut patches',
    'short upright mane',
  );
}

function hippo(g: THREE.Group, rig: AnimalRig) {
  const fur = 0xa190b0;
  rig.motion = 'heavy';
  rig.stride = 0.2;
  oval(g, fur, [0.77, 0.65, 0.99], [0, 0.85, 0.17]);
  box(g, fur, [1.25, 0.75, 1.45], [0, 0.79, 0.17]);
  fourPaws(g, rig, fur, 0.47, 0.37, -0.38, 0.68, 0.33);
  for (const leg of rig.legs)
    for (const t of [-1, 0, 1]) box(leg, 0xd7c1c1, [0.07, 0.065, 0.04], [t * 0.09, -0.31, -0.31]);
  const h = joint(g, [0, 1.02, -0.74], 'head');
  rig.head = h;
  box(h, fur, [1.02, 0.65, 0.74], [0, 0, 0.03]);
  box(h, 0xb5a0b9, [1.18, 0.44, 0.69], [0, -0.16, -0.43]);
  box(h, 0xc3a6bb, [1.08, 0.15, 0.62], [0, -0.4, -0.4]);
  for (const s of [-1, 1]) {
    oval(h, fur, [0.19, 0.18, 0.17], [s * 0.38, 0.31, -0.13]);
    oval(h, 0xbca9bf, [0.13, 0.16, 0.095], [s * 0.46, 0.39, 0.17]);
    oval(h, INK, [0.07, 0.035, 0.055], [s * 0.33, 0.075, -0.66]);
    box(h, IVORY, [0.12, 0.17, 0.09], [s * 0.34, -0.32, -0.73]);
  }
  eyes(h, 0.38, 0.33, -0.285, 0.77, 0x655272);
  smile(h, 0.43, -0.35, -0.777);
  const t = tail(g, rig, [0, 0.83, 1.04]);
  box(t, fur, [0.13, 0.12, 0.4], [0, 0, 0.18]);
  box(t, 0x877691, [0.26, 0.1, 0.16], [0, 0, 0.4]);
  feature(
    g,
    'barrel body',
    'wide double muzzle',
    'raised eyes, ears, and nostrils',
    'short splayed toes',
    'small fan tail',
  );
}

function camel(g: THREE.Group, rig: AnimalRig) {
  const fur = 0xc99c60;
  rig.motion = 'walk';
  rig.stride = 0.25;
  box(g, fur, [0.83, 0.72, 1.52], [0, 1.08, 0.2]);
  oval(g, 0xb88c51, [0.43, 0.65, 0.52], [0, 1.46, 0.26]);
  fourPaws(g, rig, fur, 0.27, 0.77, -0.33, 0.79, 0.19, 0xa9855c, true);
  for (const p of rig.legs) box(p, 0xbd9c72, [0.32, 0.13, 0.39], [0, -0.7, -0.035]);
  rod(g, fur, [0, 1.03, -0.45], [0, 1.65, -0.76], 0.24);
  rod(g, fur, [0, 1.65, -0.76], [0, 1.96, -0.68], 0.19);
  const h = joint(g, [0, 2.05, -0.76], 'head');
  rig.head = h;
  box(h, fur, [0.5, 0.4, 0.68], [0, 0, -0.1]);
  oval(h, 0xe0ba83, [0.28, 0.17, 0.23], [0, -0.12, -0.44]);
  eyes(h, 0.17, 0.07, -0.39, 0.7, 0x6c5134);
  for (const s of [-1, 1]) {
    oval(h, fur, [0.13, 0.19, 0.1], [s * 0.28, 0.18, 0.07]);
    rod(h, 0x705038, [s * 0.1, 0.2, -0.43], [s * 0.25, 0.2, -0.43], 0.025);
    oval(h, 0x896846, [0.05, 0.02, 0.025], [s * 0.12, -0.025, -0.64]);
  }
  smile(h, 0.17, -0.23, -0.6);
  for (let i = 0; i < 4; i++)
    box(g, 0xa97d47, [0.18, 0.2, 0.17], [0, 1.42 + i * 0.16, -0.55 + i * 0.02]);
  const t = tail(g, rig, [0, 1.12, 0.96]);
  rod(t, fur, [0, 0, 0], [0, -0.4, 0.24], 0.05);
  oval(t, 0x8b623b, [0.1, 0.17, 0.09], [0, -0.45, 0.25]);
  feature(
    g,
    'single dromedary hump',
    'long curved neck',
    'broad two-toed padded feet',
    'eyelash brows and split lip',
  );
}

function rat(g: THREE.Group, rig: AnimalRig) {
  const fur = 0x949099;
  rig.motion = 'crawl';
  rig.stride = 0.32;
  oval(g, fur, [0.43, 0.37, 0.72], [0, 0.51, 0.2]);
  fourPaws(g, rig, fur, 0.27, 0.24, -0.27, 0.62, 0.15, 0xe6b0aa);
  const h = joint(g, [0, 0.69, -0.47], 'head');
  rig.head = h;
  oval(h, fur, [0.32, 0.27, 0.35], [0, 0, 0]);
  oval(h, 0xc7b7b4, [0.17, 0.15, 0.28], [0, -0.1, -0.28]);
  oval(h, 0xe2a6a4, [0.09, 0.06, 0.065], [0, -0.06, -0.53]);
  eyes(h, 0.2, 0.065, -0.25, 0.65, 0x38313b);
  for (const s of [-1, 1]) {
    oval(h, fur, [0.2, 0.23, 0.065], [s * 0.3, 0.2, 0.03]);
    oval(h, 0xe1b5b3, [0.135, 0.16, 0.03], [s * 0.3, 0.21, -0.035]);
  }
  whiskers(h, 0.13, -0.09, -0.42, 0.35);
  box(h, IVORY, [0.1, 0.1, 0.04], [0, -0.21, -0.43]);
  const t = tail(g, rig, [0, 0.45, 0.77]);
  const points: Point[] = [
    [0, 0, 0],
    [0.1, -0.1, 0.4],
    [0.32, -0.18, 0.73],
    [0.5, -0.13, 0.95],
    [0.53, 0, 1.09],
  ];
  for (let i = 1; i < points.length; i++)
    rod(t, 0xd9aaa7, points[i - 1], points[i], 0.065 - i * 0.01);
  g.scale.setScalar(0.8);
  feature(
    g,
    'low pear-shaped body',
    'large round ears',
    'tapering whiskered muzzle',
    'pink dexterous paws',
    'long curved bare tail',
  );
}

function cow(g: THREE.Group, rig: AnimalRig) {
  const fur = 0xf5e8d3;
  rig.motion = 'heavy';
  rig.stride = 0.22;
  box(g, fur, [1.12, 0.91, 1.75], [0, 1.05, 0.22]);
  fourPaws(g, rig, fur, 0.38, 0.62, -0.41, 0.87, 0.27, 0x514744, true);
  const h = joint(g, [0, 1.34, -0.8], 'head');
  rig.head = h;
  box(h, fur, [0.7, 0.79, 0.72], [0, 0, 0]);
  box(h, 0xe6aaa5, [0.82, 0.37, 0.45], [0, -0.26, -0.43]);
  eyes(h, 0.23, 0.1, -0.39, 0.9, 0x654f39);
  for (const s of [-1, 1]) {
    oval(h, fur, [0.28, 0.13, 0.16], [s * 0.46, 0.17, 0.03]);
    oval(h, 0xd89f99, [0.18, 0.065, 0.09], [s * 0.49, 0.21, -0.05]);
    rod(h, 0xd7c7a2, [s * 0.25, 0.34, 0.03], [s * 0.4, 0.53, 0.03], 0.065);
    tip(h, 0xf2dfb6, 0.085, 0.24, [s * 0.43, 0.6, 0.03], -s * 0.35);
    oval(h, 0x976c68, [0.07, 0.04, 0.03], [s * 0.23, -0.23, -0.66]);
    for (const [y, z, w, d] of [
      [1.19, 0.4, 0.43, 0.5],
      [0.95, -0.34, 0.32, 0.4],
      [1.25, 0.92, 0.24, 0.21],
    ])
      box(g, 0x384548, [0.025, w, d], [s * 0.565, y, z], s * 0.17);
  }
  box(h, 0x384548, [0.26, 0.23, 0.025], [-0.18, 0.25, -0.37], -0.23);
  smile(h, 0.25, -0.4, -0.66);
  box(g, 0xe3aca4, [0.42, 0.22, 0.39], [0, 0.52, 0.57]);
  const t = tail(g, rig, [0, 1.1, 1.03]);
  rod(t, fur, [0, 0, 0], [0, -0.5, 0.3], 0.055);
  oval(t, 0x384548, [0.13, 0.2, 0.12], [0, -0.55, 0.32]);
  g.scale.setScalar(1.45);
  feature(
    g,
    'deep dairy-cow barrel',
    'irregular dark patches',
    'broad pink nostril muzzle',
    'sideways ears and curved horns',
    'cloven hooves and tufted tail',
  );
}

function fish(id: string, g: THREE.Group, rig: AnimalRig) {
  const whale = id === 'whale-shark',
    pir = id === 'piranha',
    barr = id === 'barracuda';
  const color = whale ? 0x477e94 : pir ? 0xa4a9a3 : barr ? 0x88a8ac : 0x7198af;
  rig.motion = 'fish';
  rig.wingSpeed = 4;
  rig.wingAmplitude = 0.11;
  const len = whale ? 2.5 : pir ? 1.15 : barr ? 2.9 : 2.05,
    w = whale ? 0.68 : pir ? 0.32 : barr ? 0.31 : 0.48,
    h = pir ? 0.67 : whale ? 0.43 : barr ? 0.29 : 0.43;
  oval(g, color, [w, h, len * 0.53], [0, 0.87, 0]);
  oval(g, pir ? 0xe58968 : 0xe0e6d8, [w * 0.82, h * 0.42, len * 0.44], [0, 0.87 - h * 0.6, -0.08]);
  const head = joint(g, [0, 0.87, -len * 0.4], 'head');
  rig.head = head;
  if (whale) box(head, color, [1.12, 0.55, 0.62], [0, 0, -0.12]);
  else if (barr) {
    box(head, color, [0.43, 0.35, 0.8], [0, 0, -0.14]);
    box(head, 0xcbd5c8, [0.38, 0.13, 0.88], [0, -0.16, -0.21]);
  } else oval(head, color, [w * 0.88, h * 0.8, 0.43], [0, 0.03, -0.08]);
  eyes(
    head,
    whale ? 0.43 : pir ? 0.23 : barr ? 0.17 : 0.28,
    pir ? 0.2 : 0.1,
    whale ? -0.45 : barr ? -0.55 : -0.4,
    whale ? 0.75 : pir ? 0.9 : 0.7,
    0xc3a268,
  );
  const mouth = whale ? 0.92 : pir ? 0.36 : barr ? 0.29 : 0.43,
    mz = barr ? -0.65 : whale ? -0.45 : -0.43;
  box(
    head,
    0x344d5a,
    [mouth, whale ? 0.075 : pir ? 0.1 : 0.045, 0.035],
    [0, whale ? -0.11 : pir ? -0.12 : -0.12, mz],
  );
  if (pir || barr)
    for (let i = 0; i < (pir ? 4 : 3); i++)
      tip(
        head,
        IVORY,
        0.035,
        0.075,
        [-mouth * 0.35 + (i * mouth * 0.7) / (pir ? 3 : 2), -0.155, mz - 0.02],
        Math.PI,
      );
  for (const s of [-1, 1]) {
    const f = joint(g, [s * w * 0.8, 0.69, -0.1], 'pectoral-fin');
    rig.wings.push(f);
    f.userData.side = s;
    plate(f, color, [
      [0, -0.18],
      [s * (pir ? 0.36 : 0.74), 0.25],
      [s * 0.29, 0.42],
      [0, 0.25],
    ]);
    if (!pir && !barr)
      plate(f, 0x425c70, [
        [s * 0.5, 0.17],
        [s * 0.74, 0.25],
        [s * 0.45, 0.34],
      ]);
    const count = pir || barr ? 1 : 5;
    for (let i = 0; i < count; i++)
      box(
        g,
        0x4b6470,
        [0.02, pir ? 0.34 : 0.23, 0.035],
        [s * (w * 0.93), 0.87, -len * 0.23 + i * 0.09],
      );
    if (barr)
      for (let i = 0; i < 7; i++)
        box(g, 0x506c77, [0.025, 0.21, 0.07], [s * 0.29, 0.91, -0.6 + i * 0.24], s * 0.2);
  }
  const dorsal = plate(
    g,
    color,
    [
      [-0.25, 0.87 + h * 0.7],
      [0.05, 0.87 + h + (pir ? 0.27 : 0.5)],
      [0.46, 0.87 + h * 0.7],
    ],
    'yz',
  );
  if (barr) {
    dorsal.position.z = -0.35;
    dorsal.scale.y = 0.8;
    dorsal.position.y = 0.23;
  }
  if (!pir)
    plate(
      g,
      color,
      [
        [0.65, 0.96],
        [0.82, 1.2],
        [1.04, 0.94],
      ],
      'yz',
    );
  if (id === 'shark')
    plate(
      g,
      0x425c70,
      [
        [-0.03, 1.55],
        [0.05, 1.8],
        [0.2, 1.53],
      ],
      'yz',
    );
  const t = tail(g, rig, [0, 0.87, len * 0.49]);
  oval(t, color, [w * 0.34, h * 0.36, 0.25], [0, 0, 0.1]);
  plate(
    t,
    color,
    [
      [0.13, 0],
      [0.58, pir ? 0.5 : 0.72],
      [0.5, 0.14],
      [0.34, 0],
      [0.58, pir ? -0.42 : -0.5],
      [0.13, -0.09],
    ],
    'yz',
  );
  if (whale) {
    for (let row = -2; row <= 2; row++)
      for (let i = 0; i < 7; i++) {
        const x = row * 0.18,
          z = -0.85 + i * 0.29,
          ellipse = Math.max(0.1, 1 - (x / w) ** 2 - (z / (len * 0.53)) ** 2);
        oval(g, 0xd7e8da, [0.036, 0.025, 0.045], [x, 0.87 + h * Math.sqrt(ellipse) + 0.008, z]);
      }
    for (const s of [-1, 1])
      for (let i = 0; i < 7; i++) {
        const z = -0.8 + i * 0.26;
        const section = Math.sqrt(1 - (z / (len * 0.53)) ** 2);
        oval(
          g,
          0xd7e8da,
          [0.025, 0.035, 0.04],
          [s * (w * 0.85 * section + 0.005), 0.87 + h * 0.527 * section, z],
        );
      }
    for (const x of [-0.35, 0, 0.35])
      for (const z of [-0.27, -0.07]) oval(head, 0xd7e8da, [0.035, 0.022, 0.04], [x, 0.28, z]);
  }
  if (pir)
    for (const s of [-1, 1])
      for (let i = 0; i < 5; i++)
        box(
          g,
          0x657c78,
          [0.025, 0.075, 0.065],
          [s * 0.318, 1.05 + (i % 2) * 0.16, -0.25 + Math.floor(i / 2) * 0.2],
          0.2,
        );
  feature(
    g,
    whale
      ? 'broad flat filter-feeding head'
      : pir
        ? 'deep, laterally compressed body'
        : barr
          ? 'long torpedo body and projecting lower jaw'
          : 'streamlined shark body',
    whale
      ? 'rows of pale spots'
      : pir
        ? 'coral belly and small teeth'
        : barr
          ? 'separate dorsal fins and flank bars'
          : 'five gill slits and dark fin tips',
    'vertical forked tail',
    'paired pectoral fins',
  );
}

function turtle(g: THREE.Group, rig: AnimalRig) {
  rig.motion = 'fish';
  rig.wingSpeed = 3.3;
  rig.wingAmplitude = 0.2;
  oval(g, 0x4c7961, [0.73, 0.43, 0.94], [0, 0.62, 0.13]);
  oval(g, 0xd7c58c, [0.72, 0.13, 0.88], [0, 0.36, 0.1]);
  // Raised, individually outlined scutes follow the dome, unlike a generic green blob.
  for (let row = -1; row <= 1; row++)
    for (let i = 0; i < 3; i++) {
      const x = row * 0.35,
        z = -0.38 + i * 0.45,
        y = 0.62 + 0.42 * Math.sqrt(Math.max(0.1, 1 - (x / 0.9) ** 2 - ((z - 0.1) / 1.2) ** 2));
      const scute = oval(
        g,
        row === 0 ? 0x87a977 : 0x72956b,
        [row === 0 ? 0.23 : 0.2, 0.055, 0.25],
        [x, y, z],
      );
      scute.rotation.z = -row * 0.3;
    }
  const head = joint(g, [0, 0.57, -0.9], 'head');
  rig.head = head;
  oval(head, 0x8fb17a, [0.26, 0.23, 0.34], [0, 0, -0.12]);
  eyes(head, 0.16, 0.08, -0.4, 0.65, 0x70593d);
  smile(head, 0.13, -0.09, -0.43);
  for (const s of [-1, 1]) {
    const fore = joint(g, [s * 0.51, 0.43, -0.38], 'front-flipper');
    fore.userData.side = s;
    rig.wings.push(fore);
    plate(fore, 0x8fb17a, [
      [0, -0.15],
      [s * 0.75, 0.12],
      [s * 0.89, 0.54],
      [s * 0.65, 0.6],
      [s * 0.26, 0.26],
      [0, 0.14],
    ]);
    for (let i = 0; i < 3; i++)
      box(
        fore,
        0x6c9467,
        [0.1, 0.025, 0.14],
        [s * (0.3 + i * 0.17), 0.045, 0.15 + i * 0.09],
        s * 0.3,
      );
    const back = joint(g, [s * 0.5, 0.43, 0.7], 'rear-flipper');
    back.userData.side = s;
    rig.wings.push(back);
    plate(back, 0x8fb17a, [
      [0, -0.1],
      [s * 0.38, 0.13],
      [s * 0.35, 0.42],
      [0, 0.28],
    ]);
  }
  feature(
    g,
    'domed scute-patterned carapace',
    'flat pale plastron',
    'long paddle foreflippers',
    'smaller steering hindflippers',
    'beaked turtle face',
  );
}

function kraken(g: THREE.Group, rig: AnimalRig) {
  rig.motion = 'tentacles';
  oval(g, 0xb27cbb, [0.64, 0.77, 0.67], [0, 1.13, 0.08]);
  oval(g, 0xc89acb, [0.5, 0.25, 0.47], [0, 0.64, -0.06]);
  const h = joint(g, [0, 1.1, -0.52], 'head');
  rig.head = h;
  eyes(h, 0.26, 0, -0.03, 1.15, 0x8d689a);
  smile(h, 0.14, -0.21, -0.055);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4,
      p = joint(g, [Math.sin(a) * 0.36, 0.56, Math.cos(a) * 0.36], `arm-${i + 1}`);
    p.rotation.y = a;
    rig.wings.push(p);
    p.userData.side = i % 2 ? 1 : -1;
    const points: Point[] = [
      [0, 0, 0],
      [0, -0.16, 0.38],
      [0.08, -0.2, 0.75],
      [0.23, -0.08, 1.0],
      [0.29, 0.12, 1.11],
    ];
    for (let k = 1; k < points.length; k++)
      rod(p, k < 3 ? 0xa56bae : 0xc593c2, points[k - 1], points[k], 0.16 - k * 0.026);
    for (let k = 0; k < 4; k++)
      for (const s of [-1, 1])
        oval(p, 0xf0c1da, [0.055, 0.025, 0.06], [s * 0.065, -0.12 - k * 0.035, 0.17 + k * 0.18]);
  }
  feature(
    g,
    'bulbous octopus mantle',
    'eight individually curled arms',
    'paired sucker rows',
    'large expressive eyes',
  );
}

function leviathan(g: THREE.Group, rig: AnimalRig) {
  rig.motion = 'fish';
  rig.stride = 0.2;
  rig.wingAmplitude = 0.18;
  rig.tailSegments = [];
  const color = 0x7279ba;
  oval(g, color, [0.51, 0.48, 0.79], [0, 0.88, -0.24]);
  oval(g, 0xb9d2c5, [0.38, 0.16, 0.6], [0, 0.56, -0.34]);
  const h = joint(g, [0, 1.15, -0.97], 'head');
  rig.head = h;
  box(h, color, [0.76, 0.6, 0.72], [0, 0, 0]);
  box(h, 0x95a9d1, [0.66, 0.26, 0.48], [0, -0.17, -0.43]);
  eyes(h, 0.23, 0.09, -0.39, 0.9, 0x64bcb4);
  smile(h, 0.2, -0.25, -0.69);
  for (const s of [-1, 1]) {
    rod(h, 0xe1cbee, [s * 0.24, 0.24, 0.03], [s * 0.43, 0.56, 0.23], 0.07);
    rod(h, 0xe1cbee, [s * 0.43, 0.56, 0.23], [s * 0.4, 0.72, 0.38], 0.035);
    const f = joint(g, [s * 0.4, 0.82, -0.3], 'sea-dragon-fin');
    rig.wings.push(f);
    f.userData.side = s;
    plate(f, 0x97d0d0, [
      [0, -0.2],
      [s * 0.68, 0.2],
      [s * 0.48, 0.52],
      [s * 0.15, 0.32],
      [0, 0.3],
    ]);
  }
  let parent: THREE.Object3D = g;
  for (let i = 0; i < 5; i++) {
    const segment = joint(parent, i === 0 ? [0, 0.86, 0.37] : [0, 0, 0.48], `serpent-tail-${i}`);
    oval(segment, color, [0.39 - i * 0.055, 0.34 - i * 0.045, 0.4], [0, 0, 0.23]);
    plate(
      segment,
      0xc1b2e2,
      [
        [0, 0.2],
        [0.2, 0.58 - i * 0.05],
        [0.4, 0.18],
      ],
      'yz',
    );
    rig.tailSegments.push(segment);
    parent = segment;
  }
  plate(
    parent,
    0x9acdcf,
    [
      [0, 0],
      [0.42, 0.32],
      [0.63, 0],
      [0.42, -0.28],
    ],
    'yz',
  );
  feature(
    g,
    'long articulated sea-serpent body',
    'five waving tail segments',
    'branching head horns',
    'mint fan fins and lavender crest',
  );
}

function salamander(g: THREE.Group, rig: AnimalRig) {
  rig.motion = 'crawl';
  rig.stride = 0.33;
  const color = 0x70585a;
  oval(g, color, [0.38, 0.25, 0.74], [0, 0.37, 0.1]);
  const h = joint(g, [0, 0.43, -0.67], 'head');
  rig.head = h;
  oval(h, color, [0.4, 0.22, 0.39], [0, 0, -0.03]);
  eyes(h, 0.25, 0.14, -0.25, 0.72, 0xb39248);
  smile(h, 0.24, -0.06, -0.4);
  for (const z of [-0.37, 0.61])
    for (const s of [-1, 1]) {
      const p = joint(g, [s * 0.27, 0.31, z], 'splayed-leg');
      rig.legs.push(p);
      rod(p, color, [0, 0, 0], [s * 0.25, -0.16, 0.08], 0.09);
      for (let i = 0; i < 3; i++)
        rod(
          p,
          0xe1ad60,
          [s * 0.23, -0.16, 0.08],
          [s * (0.34 + i * 0.045), -0.21, -0.04 + i * 0.1],
          0.035,
        );
    }
  const t = tail(g, rig, [0, 0.35, 0.69]);
  oval(t, color, [0.22, 0.18, 0.5], [0, 0, 0.35]);
  oval(t, color, [0.11, 0.1, 0.4], [0, 0, 0.9]);
  for (const s of [-1, 1])
    for (let i = 0; i < 5; i++)
      oval(
        g,
        0xf1b34f,
        [0.09, 0.035, 0.12],
        [s * (i % 2 ? 0.18 : 0.22), 0.56 + (i % 2) * 0.04, -0.4 + i * 0.24],
      );
  for (const s of [-1, 1]) oval(h, 0xf1b34f, [0.09, 0.035, 0.16], [s * 0.23, 0.19, -0.03]);
  for (let i = 0; i < 3; i++)
    oval(t, 0xf1b34f, [0.07, 0.025, 0.13], [0, 0.17 - i * 0.025, 0.2 + i * 0.25]);
  feature(
    g,
    'low smooth amphibian body',
    'splayed limbs and delicate toes',
    'bright fire-salamander blotches',
    'long tapering tail without reptile plates',
  );
}

function reptile(id: string, g: THREE.Group, rig: AnimalRig) {
  const mech = id === 'mecha-reptile',
    c = mech ? 0x91b6c2 : 0x569a79,
    belly = mech ? 0xd2ded7 : 0xc4d68c;
  rig.motion = 'heavy';
  rig.stride = 0.28;
  box(g, c, [1.12, 1.28, 0.92], [0, 1.1, 0.15]);
  for (let i = 0; i < 4; i++)
    box(g, belly, [0.72 - i * 0.035, 0.2, 0.075], [0, 0.68 + i * 0.24, -0.33]);
  for (const s of [-1, 1]) {
    const p = paw(g, rig, c, s * 0.37, 0.64, 0.16, 0.4, mech ? 0x617e8d : c);
    oval(p, c, [0.27, 0.36, 0.3], [0, -0.1, 0.04]);
    for (let i = 0; i < 3; i++) box(p, IVORY, [0.085, 0.08, 0.13], [(i - 1) * 0.12, -0.57, -0.38]);
    box(g, c, [0.27, 0.56, 0.29], [s * 0.65, 1.18, -0.23], s * -0.3);
    box(g, mech ? 0x617e8d : c, [0.32, 0.21, 0.4], [s * 0.71, 0.95, -0.37]);
  }
  const h = joint(g, [0, 1.94, -0.35], 'head');
  rig.head = h;
  box(h, c, [0.88, 0.63, 0.89], [0, 0, 0]);
  box(h, c, [0.91, 0.31, 0.5], [0, -0.13, -0.51]);
  box(h, belly, [0.78, 0.13, 0.43], [0, -0.34, -0.5]);
  eyes(h, 0.27, 0.13, -0.47, 0.9, mech ? 0x55c8d2 : 0x9e8e3f);
  smile(h, 0.31, -0.23, -0.77);
  for (const s of [-1, 1]) {
    box(h, mech ? 0x617e8d : 0x3d7a5c, [0.3, 0.12, 0.15], [s * 0.27, 0.29, -0.39], s * 0.15);
    oval(h, INK, [0.04, 0.025, 0.025], [s * 0.25, 0.01, -0.77]);
  }
  const t = tail(g, rig, [0, 0.72, 0.58]);
  for (let i = 0; i < 4; i++) {
    box(t, c, [0.48 - i * 0.09, 0.36 - i * 0.055, 0.52], [0, -i * 0.06, 0.18 + i * 0.43]);
    plate(
      t,
      mech ? 0x74dfe1 : 0xa8c976,
      [
        [i * 0.43, 0.1 - i * 0.06],
        [0.15 + i * 0.43, 0.55 - i * 0.1],
        [0.4 + i * 0.43, 0.1 - i * 0.06],
      ],
      'yz',
    );
  }
  for (let i = 0; i < 4; i++)
    plate(
      g,
      mech ? 0x74dfe1 : 0xa8c976,
      [
        [0.24, 1.05 + i * 0.28],
        [0.52, 1.32 + i * 0.28],
        [0.67, 1.03 + i * 0.28],
      ],
      'yz',
    );
  if (mech) {
    box(g, 0x4b687b, [0.62, 0.46, 0.12], [0, 1.28, -0.4]);
    box(g, 0x7de1df, [0.35, 0.25, 0.04], [0, 1.29, -0.48]);
    for (const s of [-1, 1]) {
      oval(g, 0xe2ba69, [0.17, 0.17, 0.13], [s * 0.67, 1.39, -0.25]);
      box(g, 0x647f8d, [0.45, 0.22, 0.46], [s * 0.65, 1.53, -0.09]);
      for (let i = 0; i < 3; i++)
        box(h, 0x4b687b, [0.035, 0.045, 0.27], [s * 0.449, -0.13 + i * 0.095, 0.02]);
      for (const y of [0.69, 1.5]) oval(g, 0xe9d5a4, [0.045, 0.045, 0.025], [s * 0.42, y, -0.33]);
    }
    g.userData.features = [
      'segmented metal armor',
      'round brass shoulder joints',
      'teal chest reactor',
      'vented cheeks',
      'mechanical dorsal plates',
    ];
  } else {
    for (const s of [-1, 1])
      for (let i = 0; i < 4; i++)
        oval(
          g,
          0x3c795d,
          [0.025, 0.1, 0.12],
          [s * 0.563, 0.83 + (i % 2) * 0.23, -0.07 + Math.floor(i / 2) * 0.3],
        );
    g.userData.features = [
      'bipedal reptile haunches',
      'segmented pale belly',
      'leaf-shaped dorsal plates',
      'heavy tapering tail',
      'toes and small claws',
    ];
  }
  g.userData.artVersion = 2;
}

function flyer(id: string, g: THREE.Group, rig: AnimalRig) {
  const bat = id === 'bat',
    moth = id === 'glow-moth';
  rig.motion = 'fly';
  rig.wingSpeed = moth ? 13 : bat ? 9 : 5.4;
  rig.wingAmplitude = moth ? 0.29 : bat ? 0.4 : 0.31;
  const c = bat ? 0x7c6894 : moth ? 0xe8cf93 : 0x627c91;
  oval(g, c, [moth ? 0.22 : 0.31, moth ? 0.47 : 0.42, 0.34], [0, 0.83, 0.06]);
  if (!moth) oval(g, bat ? 0xb49ebc : IVORY, [0.235, 0.33, 0.13], [0, 0.83, -0.25]);
  const h = joint(g, [0, 1.18, -0.2], 'head');
  rig.head = h;
  oval(h, c, [0.3, 0.26, 0.28], [0, 0, 0]);
  if (!bat && !moth) {
    oval(h, 0x354d61, [0.32, 0.22, 0.29], [0, 0.08, 0.01]);
    for (const s of [-1, 1]) box(h, 0x354d61, [0.1, 0.27, 0.08], [s * 0.23, -0.08, -0.22]);
    box(h, 0xe8c76e, [0.19, 0.14, 0.2], [0, -0.07, -0.31]);
    const beak = tip(h, 0x47515a, 0.095, 0.2, [0, -0.16, -0.41], Math.PI);
    beak.rotation.x = -0.25;
    for (let i = 0; i < 4; i++)
      box(g, 0x596c7a, [0.27 - i * 0.025, 0.027, 0.045], [0, 0.63 + i * 0.12, -0.373]);
  } else if (bat) {
    oval(h, 0xc69aad, [0.14, 0.085, 0.1], [0, -0.1, -0.25]);
    rig.ears = [];
    for (const s of [-1, 1]) {
      const ear = joint(h, [s * 0.22, 0.17, 0.02], 'ear');
      rig.ears.push(ear);
      oval(ear, c, [0.14, 0.34, 0.085], [s * 0.025, 0.2, 0]);
      oval(ear, 0xc49ab8, [0.085, 0.23, 0.03], [s * 0.025, 0.2, -0.075]);
    }
  } else {
    for (const s of [-1, 1]) {
      rod(h, 0xa68558, [s * 0.1, 0.14, 0], [s * 0.24, 0.47, -0.03], 0.025);
      for (let k = 0; k < 4; k++)
        rod(
          h,
          0xe2c783,
          [s * (0.13 + k * 0.028), 0.21 + k * 0.055, -0.03],
          [s * (0.25 + k * 0.025), 0.18 + k * 0.055, -0.04],
          0.018,
        );
    }
    for (let i = 0; i < 4; i++) box(g, 0xcaa66c, [0.29, 0.055, 0.29], [0, 0.55 + i * 0.13, 0.06]);
  }
  eyes(h, moth ? 0.13 : 0.16, 0.02, -0.25, moth ? 0.75 : 0.72, bat ? 0x997698 : 0x9a7b3e);
  for (const s of [-1, 1]) {
    const wing = joint(g, [s * 0.23, 1.02, 0.05], 'wing');
    rig.wings.push(wing);
    wing.userData.side = s;
    if (bat) {
      const outline: Array<[number, number]> = [
        [0, -0.1],
        [s * 0.47, -0.38],
        [s * 1.22, -0.18],
        [s * 1.6, 0.09],
        [s * 1.04, 0.16],
        [s * 0.95, 0.49],
        [s * 0.62, 0.35],
        [s * 0.37, 0.64],
        [s * 0.19, 0.4],
        [0, 0.37],
      ];
      plate(wing, 0x9c84ad, outline);
      for (const [x, z] of [
        [1.6, 0.09],
        [0.95, 0.49],
        [0.37, 0.64],
      ])
        rod(wing, 0x695780, [0, 0.045, -0.07], [s * x, 0.045, z], 0.026);
      rod(wing, 0x695780, [0, 0.045, -0.07], [s * 0.47, 0.045, -0.38], 0.045);
      tip(wing, IVORY, 0.045, 0.15, [s * 0.49, 0.1, -0.38], -s * 0.5);
    } else if (moth) {
      plate(wing, 0xa3d6b2, [
        [0, -0.16],
        [s * 0.55, -0.58],
        [s * 1.15, -0.48],
        [s * 1.32, -0.12],
        [s * 0.98, 0.26],
        [s * 0.37, 0.33],
        [0, 0.12],
      ]);
      plate(wing, 0x8abfa1, [
        [0, 0.13],
        [s * 0.63, 0.1],
        [s * 1.06, 0.49],
        [s * 0.73, 0.82],
        [s * 0.47, 0.68],
        [s * 0.42, 1.25],
        [s * 0.28, 1.37],
        [s * 0.17, 0.68],
        [0, 0.43],
      ]);
      for (const [x, z, r] of [
        [0.77, -0.13, 0.19],
        [0.57, 0.47, 0.14],
      ]) {
        oval(wing, 0xd9c982, [r, 0.045, r], [s * x, 0.05, z]);
        oval(wing, 0x716b83, [r * 0.65, 0.05, r * 0.65], [s * x, 0.06, z]);
        oval(wing, 0xd9ece0, [r * 0.34, 0.055, r * 0.34], [s * x, 0.07, z]);
      }
      for (const [x, z] of [
        [1.13, -0.4],
        [0.94, 0.19],
        [0.72, 0.64],
      ])
        rod(wing, 0xc5e6c0, [0, 0.045, 0.05], [s * x, 0.045, z], 0.018);
    } else {
      plate(wing, 0x637f93, [
        [0, -0.2],
        [s * 0.59, -0.32],
        [s * 1.61, 0.19],
        [s * 1.17, 0.37],
        [s * 0.65, 0.32],
        [0, 0.38],
      ]);
      for (let i = 0; i < 5; i++) {
        const feather = box(
          wing,
          i % 2 ? 0x526b80 : 0x7891a1,
          [0.17, 0.075, 0.63 - i * 0.045],
          [s * (0.53 + i * 0.21), 0.02, 0.29 + i * 0.035],
        );
        feather.rotation.y = -s * (0.25 + i * 0.12);
        box(wing, 0xaeb8b8, [0.12, 0.025, 0.065], [s * (0.56 + i * 0.21), 0.065, 0.32 + i * 0.035]);
      }
    }
  }
  for (const s of [-1, 1]) {
    if (moth)
      for (let i = 0; i < 3; i++)
        rod(
          g,
          0xb49b6a,
          [s * 0.16, 0.65 + i * 0.12, 0.04],
          [s * 0.3, 0.48 + i * 0.12, -0.13],
          0.023,
        );
    else {
      rod(g, bat ? 0x705578 : 0xd4aa52, [s * 0.14, 0.52, 0.06], [s * 0.15, 0.25, 0.03], 0.045);
      for (let k = 0; k < 3; k++)
        rod(
          g,
          bat ? 0x705578 : 0xd4aa52,
          [s * 0.15, 0.25, 0.03],
          [s * 0.15 + (k - 1) * 0.07, 0.2, -0.12],
          0.025,
        );
    }
  }
  if (!moth) {
    const t = tail(g, rig, [0, 0.63, 0.29]);
    if (bat)
      plate(t, 0x9c84ad, [
        [-0.17, 0],
        [0, 0.44],
        [0.17, 0],
      ]);
    else
      for (let i = -1; i <= 1; i++) {
        const f = box(t, 0x536d83, [0.17, 0.07, 0.65], [i * 0.13, 0, 0.24]);
        f.rotation.y = i * 0.13;
        for (let k = 0; k < 3; k++)
          box(t, 0xc1c6bc, [0.15, 0.02, 0.05], [i * 0.13, 0.05, 0.05 + k * 0.16]);
      }
  }
  feature(
    g,
    bat
      ? 'scalloped wing membranes'
      : moth
        ? 'four scalloped wings with long hindwing tails'
        : 'pointed layered feather wings',
    bat ? 'visible finger spars' : moth ? 'four ringed eyespots' : 'barred breast and tail',
    bat
      ? 'large sensitive ears'
      : moth
        ? 'feathery antennae and six legs'
        : 'dark helmet and cheek moustache',
    bat
      ? 'thumb claws and tail membrane'
      : moth
        ? 'segmented fuzzy body'
        : 'hooked beak and gripping talons',
  );
}

export function buildDetailedAnimal(id: string, g: THREE.Group, rig: AnimalRig): void {
  if (id === 'fox' || id === 'arctic-fox') fox(id, g, rig);
  else if (id === 'tiger' || id === 'lion') cat(id, g, rig);
  else if (id === 'giraffe') giraffe(g, rig);
  else if (id === 'hippo') hippo(g, rig);
  else if (id === 'camel') camel(g, rig);
  else if (id === 'rat') rat(g, rig);
  else if (id === 'giant-cow') cow(g, rig);
  else if (['shark', 'piranha', 'barracuda', 'whale-shark'].includes(id)) fish(id, g, rig);
  else if (id === 'turtle') turtle(g, rig);
  else if (id === 'kraken') kraken(g, rig);
  else if (id === 'leviathan') leviathan(g, rig);
  else if (id === 'salamander') salamander(g, rig);
  else if (id === 'giant-reptile' || id === 'mecha-reptile') reptile(id, g, rig);
  else if (['bat', 'falcon', 'glow-moth'].includes(id)) flyer(id, g, rig);
  else fox('fox', g, rig);
  // Floor placement is intrinsic to each model, including fish, long tails, and broad flippers.
  const bounds = new THREE.Box3().setFromObject(g);
  const shift = -bounds.min.y / g.scale.y;
  for (const child of g.children) child.position.y += shift;
  for (const part of [
    ...rig.legs,
    ...rig.wings,
    ...(rig.ears ?? []),
    ...(rig.tailSegments ?? []),
    ...(rig.tail ? [rig.tail] : []),
    ...(rig.head ? [rig.head] : []),
  ])
    part.userData.restRotation = part.rotation.toArray().slice(0, 3);
}

export function animateDetailedAnimal(rig: AnimalRig, time: number, moving: boolean): void {
  const speed = rig.motion === 'heavy' ? 6 : rig.motion === 'crawl' ? 12 : 9;
  rig.legs.forEach((leg, i) => {
    const rest = leg.userData.restRotation ?? [0, 0, 0];
    // Diagonal pairs move together; four identical swing phases looked like paddling.
    const phase = rig.legs.length === 4 ? [0, Math.PI, Math.PI, 0][i] : i * Math.PI;
    leg.rotation.x = rest[0] + (moving ? Math.sin(time * speed + phase) * (rig.stride ?? 0.3) : 0);
    if (rig.motion === 'crawl')
      leg.rotation.y = rest[1] + (moving ? Math.sin(time * speed + phase) * 0.18 : 0);
  });
  rig.wings.forEach((wing, i) => {
    const rest = wing.userData.restRotation ?? [0, 0, 0],
      side = wing.userData.side ?? (i % 2 ? 1 : -1);
    if (rig.motion === 'tentacles') {
      wing.rotation.x =
        rest[0] + Math.sin(time * (moving ? 4 : 1.6) + i * 0.8) * (moving ? 0.17 : 0.07);
      wing.rotation.z = rest[2] + Math.cos(time * 2 + i) * 0.06;
    } else
      wing.rotation.z =
        rest[2] +
        Math.sin(time * (moving ? (rig.wingSpeed ?? 8) : 2.8) + (i > 1 ? Math.PI * 0.4 : 0)) *
          (moving ? (rig.wingAmplitude ?? 0.3) : 0.09) *
          -side;
  });
  if (rig.tail) {
    const rest = rig.tail.userData.restRotation ?? [0, 0, 0];
    rig.tail.rotation.y =
      rest[1] +
      Math.sin(time * (moving ? (rig.motion === 'fish' ? 7 : 6) : 2)) *
        (rig.motion === 'fish' ? 0.3 : 0.17);
  }
  rig.tailSegments?.forEach((segment, i) => {
    segment.rotation.y = Math.sin(time * (moving ? 4 : 1.7) - i * 0.7) * 0.18;
  });
  if (rig.head) {
    const rest = rig.head.userData.restRotation ?? [0, 0, 0];
    rig.head.rotation.z = rest[2] + Math.sin(time * 1.6) * 0.025;
    rig.head.rotation.x =
      rest[0] + Math.sin(time * (moving ? speed : 1.7)) * (moving ? 0.025 : 0.012);
  }
  rig.ears?.forEach((ear, i) => {
    const rest = ear.userData.restRotation ?? [0, 0, 0];
    ear.rotation.z = rest[2] + Math.sin(time * 1.9 + i * 2) * 0.06;
  });
}
