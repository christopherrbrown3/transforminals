import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { AnimalRig } from './animalModels';

type Point = [number, number, number];
interface BossRig extends AnimalRig {
  arms: THREE.Group[];
  eyes: THREE.Group[];
  accessory?: THREE.Group;
  character: string;
}
const INK = 0x243c3b;
const CREAM = 0xfff0cd;
const GOLD = 0xffd476;

/** Original, texture-free toy sculptures. Static parts are batched by createBoss. */
function mesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, color: number, p: Point) {
  const part = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color, roughness: 0.76, metalness: 0.02 }),
  );
  part.position.set(...p);
  part.castShadow = part.receiveShadow = true;
  parent.add(part);
  return part;
}
function box(parent: THREE.Object3D, color: number, size: Point, p: Point, roll = 0) {
  const radius = Math.min(0.08, Math.min(...size) * 0.2);
  const part = mesh(parent, new RoundedBoxGeometry(...size, 1, radius), color, p);
  part.rotation.z = roll;
  return part;
}
function oval(parent: THREE.Object3D, color: number, size: Point, p: Point) {
  const part = mesh(parent, new THREE.SphereGeometry(1, 12, 8), color, p);
  part.scale.set(...size);
  return part;
}
function rod(parent: THREE.Object3D, color: number, from: Point, to: Point, radius = 0.04) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
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
function tip(parent: THREE.Object3D, color: number, p: Point, radius: number, height: number) {
  return mesh(parent, new THREE.ConeGeometry(radius, height, 5), color, p);
}
function panel(parent: THREE.Object3D, color: number, points: number[][], depth = 0.06) {
  const shape = new THREE.Shape();
  points.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, steps: 1 });
  geometry.translate(0, 0, -depth / 2);
  return mesh(parent, geometry, color, [0, 0, 0]);
}
function joint(parent: THREE.Object3D, name: string, p: Point) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...p);
  parent.add(group);
  return group;
}
function eyes(head: THREE.Group, rig: BossRig, width: number, y: number, z: number, iris: number) {
  for (const side of [-1, 1]) {
    const eye = joint(head, `eye:${side}`, [side * width, y, z]);
    oval(eye, CREAM, [0.19, 0.235, 0.09], [0, 0, 0]);
    oval(eye, iris, [0.115, 0.155, 0.045], [-side * 0.018, -0.01, -0.075]);
    oval(eye, INK, [0.062, 0.105, 0.025], [-side * 0.018, -0.01, -0.11]);
    oval(eye, 0xffffff, [0.035, 0.043, 0.015], [0.015, 0.045, -0.13]);
    rig.eyes.push(eye);
  }
}
function smile(head: THREE.Group, width: number, y: number, z: number) {
  rod(head, INK, [-width, y + 0.065, z], [-width * 0.65, y, z - 0.025], 0.025);
  rod(head, INK, [-width * 0.65, y, z - 0.025], [width * 0.65, y, z - 0.025], 0.025);
  rod(head, INK, [width * 0.65, y, z - 0.025], [width, y + 0.065, z], 0.025);
}
function feet(root: THREE.Group, rig: BossRig, color: number, width = 0.48, toes = false) {
  for (const side of [-1, 1]) {
    const foot = joint(root, `foot:${side}`, [side * width, 0.3, 0]);
    box(foot, color, [0.51, 0.42, 0.68], [0, -0.09, -0.13]);
    if (toes)
      for (const x of [-0.15, 0, 0.15]) oval(foot, CREAM, [0.063, 0.065, 0.095], [x, -0.16, -0.45]);
    rig.legs.push(foot);
  }
}
function arms(root: THREE.Group, rig: BossRig, color: number, width: number, y: number) {
  for (const side of [-1, 1]) {
    const arm = joint(root, `arm:${side}`, [side * width, y, 0]);
    box(arm, color, [0.29, 0.52, 0.32], [side * 0.09, -0.2, -0.05], side * 0.28);
    oval(arm, color, [0.23, 0.19, 0.22], [side * 0.16, -0.42, -0.12]);
    rig.arms.push(arm);
  }
}
function leaf(parent: THREE.Object3D, color: number, p: Point, angle: number, size = 1) {
  const part = panel(parent, color, [
    [0, 0],
    [-0.2, 0.23],
    [-0.12, 0.48],
    [0, 0.62],
    [0.2, 0.3],
  ]);
  part.position.set(...p);
  part.rotation.z = angle;
  part.scale.setScalar(size);
  return part;
}

function sproutzilla(root: THREE.Group, head: THREE.Group, rig: BossRig) {
  oval(root, 0x63985d, [0.75, 0.78, 0.63], [0, 1.01, 0.04]);
  oval(root, 0xc4d58c, [0.5, 0.55, 0.12], [0, 0.97, -0.54]);
  for (const y of [0.76, 0.99, 1.22]) box(root, 0x9fb979, [0.63, 0.045, 0.03], [0, y, -0.655]);
  feet(root, rig, 0x507c52, 0.48, true);
  arms(root, rig, 0x78aa64, 0.72, 1.33);
  oval(head, 0x78aa64, [0.86, 0.46, 0.67], [0, -0.02, 0]);
  oval(head, 0xa6c77e, [0.66, 0.24, 0.4], [0, -0.2, -0.52]);
  eyes(head, rig, 0.35, 0.08, -0.62, 0x98622e);
  for (const side of [-1, 1]) {
    oval(head, 0x547c50, [0.065, 0.045, 0.035], [side * 0.22, -0.12, -0.9]);
    oval(head, 0xd6b878, [0.1, 0.065, 0.025], [side * 0.6, -0.12, -0.72]);
    leaf(head, 0x488a62, [side * 0.57, 0.12, 0.18], side * -0.95, 0.66);
  }
  smile(head, 0.31, -0.3, -0.89);
  const tail = joint(root, 'leafy tail', [0, 0.63, 0.48]);
  oval(tail, 0x63985d, [0.36, 0.28, 0.83], [0, 0, 0.57]);
  oval(tail, 0x78aa64, [0.22, 0.21, 0.53], [0, 0.14, 1.12]);
  for (let i = 0; i < 4; i++) leaf(tail, 0xc2d585, [0, 0.16, 0.25 + i * 0.32], 0, 0.52);
  rig.tail = tail;
}

function frosty(root: THREE.Group, head: THREE.Group, rig: BossRig) {
  oval(root, 0xe0efee, [1.02, 0.85, 0.77], [0, 0.94, 0]);
  feet(root, rig, 0xc9dfe4, 0.49);
  oval(head, 0xf5fbf5, [0.75, 0.5, 0.67], [0, -0.13, 0]);
  eyes(head, rig, 0.27, -0.08, -0.62, 0x6c99ab);
  const nose = tip(head, 0xef9d52, [0, -0.19, -0.86], 0.12, 0.48);
  nose.rotation.x = -Math.PI / 2;
  smile(head, 0.29, -0.4, -0.6);
  box(head, 0x345e71, [1.5, 0.1, 1.15], [0, 0.26, 0]);
  box(head, 0x345e71, [0.84, 0.19, 0.76], [0, 0.39, 0]);
  box(head, 0xde8b91, [0.87, 0.08, 0.79], [0, 0.32, 0]);
  box(root, 0xd97582, [1.38, 0.21, 1.13], [0, 1.47, -0.015]);
  const scarf = joint(root, 'scarf tails', [0.45, 1.42, -0.62]);
  box(scarf, 0xd97582, [0.27, 0.61, 0.1], [0, -0.25, 0], -0.13);
  for (const y of [-0.1, -0.33]) box(scarf, CREAM, [0.27, 0.065, 0.11], [0, y, -0.01], -0.13);
  for (const x of [-0.09, 0, 0.09]) rod(scarf, CREAM, [x, -0.51, 0], [x, -0.62, 0], 0.027);
  rig.accessory = scarf;
  for (const y of [0.61, 0.92, 1.2]) oval(root, 0x436370, [0.07, 0.075, 0.04], [0, y, -0.76]);
  for (const side of [-1, 1]) {
    const arm = joint(root, `mitten:${side}`, [side * 0.82, 1.22, 0]);
    rod(arm, 0x8e7057, [0, 0, 0], [side * 0.52, 0.17, -0.06], 0.07);
    oval(arm, 0xd97582, [0.21, 0.25, 0.17], [side * 0.58, 0.2, -0.06]);
    oval(arm, 0xeaa2a1, [0.1, 0.12, 0.12], [side * 0.43, 0.13, -0.18]);
    rig.arms.push(arm);
  }
}

function sandwich(root: THREE.Group, head: THREE.Group, rig: BossRig) {
  feet(root, rig, 0x6f5571, 0.55);
  box(root, 0xc48b4f, [1.9, 0.31, 1.2], [0, 0.48, 0]);
  box(root, 0xf6d399, [1.72, 0.18, 1.1], [0, 0.56, -0.07]);
  box(root, 0xcf7159, [1.79, 0.24, 1.16], [0, 0.87, 0]);
  box(root, 0xf4bf57, [1.95, 0.12, 1.22], [0, 1.07, 0]);
  for (let i = 0; i < 7; i++) {
    const x = -0.84 + i * 0.28;
    oval(root, i % 2 ? 0x79a65e : 0x9cc272, [0.23, 0.09, 0.69], [x, 0.71, -0.02]);
    oval(root, 0x9cc272, [0.22, 0.09, 0.66], [x, 1.18, 0]);
  }
  const cheese = panel(root, 0xffd779, [
    [-0.75, 1.08],
    [-0.28, 1.08],
    [-0.42, 0.8],
  ]);
  cheese.position.z = -0.66;
  box(head, 0xbc8348, [1.94, 0.65, 1.25], [0, -0.38, 0]);
  box(head, 0xf1cb8a, [1.75, 0.52, 0.13], [0, -0.36, -0.6]);
  eyes(head, rig, 0.38, -0.3, -0.71, 0x9d6f3b);
  smile(head, 0.29, -0.56, -0.7);
  for (const x of [-0.66, -0.13, 0.18, 0.65])
    oval(head, 0xffe5b4, [0.045, 0.017, 0.08], [x, -0.042, -0.2 + x * 0.25]);
  // A broad plum hat with a floppy tip off to the side keeps the landing center clear.
  box(head, 0x71547e, [2.18, 0.12, 1.44], [0, 0.03, 0]);
  const hat = tip(head, 0x71547e, [0, 0.24, 0.06], 0.65, 0.4);
  hat.scale.z = 0.8;
  box(head, 0xc697ac, [1.01, 0.11, 0.75], [0, 0.12, -0.04]);
  leaf(head, 0x71547e, [0.53, 0.15, 0.11], -1.3, 0.75);
  arms(root, rig, 0x92714e, 1.01, 1.19);
  const wand = rig.arms[1];
  rod(wand, 0x71547e, [0.18, -0.45, -0.13], [0.48, 0.42, -0.13], 0.047);
  oval(wand, 0x8ea85e, [0.15, 0.18, 0.15], [0.5, 0.46, -0.13]);
  oval(wand, 0xc87856, [0.06, 0.07, 0.025], [0.5, 0.46, -0.27]);
}

function flushington(root: THREE.Group, head: THREE.Group, rig: BossRig) {
  feet(root, rig, 0x3d6574, 0.55);
  box(root, 0xd0e1e4, [0.85, 0.55, 0.83], [0, 0.55, 0.23]);
  oval(root, 0xf2f3e7, [0.95, 0.45, 1.05], [0, 1, -0.13]);
  // An open seat and recessed water make the toilet readable from the follow camera.
  const seat = mesh(root, new THREE.TorusGeometry(0.71, 0.13, 6, 24), 0xfffae9, [0, 1.28, -0.2]);
  seat.rotation.x = Math.PI / 2;
  seat.scale.y = 1.18;
  oval(root, 0x438f99, [0.65, 0.035, 0.75], [0, 1.22, -0.2]);
  box(root, 0xc4dadd, [1.34, 1.25, 0.48], [0, 1.35, 0.65]);
  box(root, 0xfffae9, [1.48, 0.16, 0.6], [0, 2, 0.65]);
  box(root, GOLD, [0.3, 0.13, 0.14], [0.48, 1.7, 0.36]);
  box(root, 0x8eb1bc, [0.92, 0.07, 0.025], [0, 1.8, 0.395]);
  oval(head, 0x91bca1, [0.53, 0.43, 0.47], [0, -0.18, -0.27]);
  eyes(head, rig, 0.23, -0.13, -0.69, 0x487f85);
  oval(head, 0xb6d4ad, [0.16, 0.12, 0.14], [0, -0.28, -0.75]);
  for (const side of [-1, 1])
    oval(head, 0xfff0cd, [0.23, 0.075, 0.07], [side * 0.18, -0.37, -0.73]).rotation.z =
      side * -0.16;
  smile(head, 0.19, -0.49, -0.65);
  box(head, 0x345c70, [1.2, 0.11, 0.88], [0, 0.22, -0.22]);
  box(head, 0x345c70, [0.84, 0.23, 0.71], [0, 0.36, -0.2]);
  box(head, GOLD, [1.01, 0.065, 0.05], [0, 0.23, -0.68]);
  oval(head, GOLD, [0.12, 0.12, 0.03], [0, 0.35, -0.57]);
  rod(head, 0x345c70, [0, 0.28, -0.61], [0, 0.42, -0.61], 0.022);
  rod(head, 0x345c70, [-0.065, 0.32, -0.61], [0.065, 0.32, -0.61], 0.022);
  arms(root, rig, 0x345c70, 0.89, 1.35);
  for (const arm of rig.arms) {
    box(arm, GOLD, [0.33, 0.08, 0.35], [0, -0.07, 0]);
    oval(arm, CREAM, [0.22, 0.17, 0.2], [Math.sign(arm.position.x) * 0.16, -0.42, -0.14]);
  }
}

function lavaLump(root: THREE.Group, head: THREE.Group, rig: BossRig) {
  oval(root, 0xf4ac69, [0.89, 0.85, 0.72], [0, 1.02, 0]);
  // Separated basalt plates expose peach seams, like a warm popcorn kernel.
  for (const [x, y, z, w, h] of [
    [-0.55, 0.77, -0.45, 0.56, 0.64],
    [0.48, 0.73, -0.49, 0.62, 0.57],
    [-0.48, 1.37, -0.43, 0.63, 0.48],
    [0.5, 1.34, -0.44, 0.6, 0.5],
    [0, 1.03, -0.69, 0.4, 0.57],
    [0, 0.88, 0.56, 1.22, 1.04],
  ])
    box(root, 0x725969, [w, h, 0.24], [x, y, z], x * 0.17);
  feet(root, rig, 0x665465, 0.55, true);
  arms(root, rig, 0x806475, 0.94, 1.4);
  oval(head, 0x866777, [0.88, 0.47, 0.7], [0, -0.02, 0]);
  oval(head, 0xb78383, [0.64, 0.24, 0.25], [0, -0.2, -0.54]);
  eyes(head, rig, 0.34, 0.06, -0.65, 0xc58943);
  smile(head, 0.3, -0.31, -0.78);
  for (const side of [-1, 1]) {
    tip(head, 0xf0af6f, [side * 0.64, 0.25, 0.08], 0.19, 0.42);
    oval(head, 0xffcb86, [0.09, 0.05, 0.028], [side * 0.59, -0.14, -0.66]);
    box(rig.arms[side === -1 ? 0 : 1], 0xf4ac69, [0.31, 0.07, 0.34], [0, -0.12, 0]);
  }
  for (const [x, y, z, size] of [
    [-0.62, 0.28, 0.36, 0.15],
    [0.62, 0.3, 0.32, 0.17],
  ]) {
    oval(head, CREAM, [size, size, size], [x, y, z]);
    oval(head, 0xffd79c, [size * 0.7, size * 0.7, size * 0.7], [x + 0.1, y + 0.07, z]);
  }
}

function demonLizard(root: THREE.Group, head: THREE.Group, rig: BossRig) {
  oval(root, 0x88649d, [0.99, 1.12, 0.77], [0, 1.49, 0.12]);
  oval(root, 0xd29aaf, [0.65, 0.82, 0.16], [0, 1.36, -0.59]);
  for (const y of [0.86, 1.13, 1.4, 1.67, 1.94])
    box(root, 0xb77e9e, [0.9 - Math.abs(1.4 - y) * 0.45, 0.05, 0.04], [0, y, -0.75]);
  feet(root, rig, 0x75548d, 0.64, true);
  arms(root, rig, 0x9872ac, 0.97, 1.94);
  for (const arm of rig.arms)
    for (const x of [-0.1, 0.03, 0.16])
      oval(arm, CREAM, [0.05, 0.06, 0.08], [x + Math.sign(arm.position.x) * 0.11, -0.46, -0.3]);
  box(head, 0x9971aa, [1.62, 0.81, 1.17], [0, -0.08, 0]);
  oval(head, 0xc591ba, [0.77, 0.28, 0.48], [0, -0.3, -0.58]);
  eyes(head, rig, 0.4, 0.07, -0.62, 0xc89543);
  for (const side of [-1, 1]) {
    box(head, 0x78578f, [0.45, 0.105, 0.13], [side * 0.4, 0.31, -0.63], side * -0.12);
    oval(head, 0x78578f, [0.075, 0.05, 0.04], [side * 0.28, -0.2, -1.015]);
    const horn = tip(head, CREAM, [side * 0.69, 0.24, 0.16], 0.2, 0.5);
    horn.rotation.z = side * -0.33;
    box(head, CREAM, [0.11, 0.15, 0.07], [side * 0.43, -0.4, -0.94]);
    leaf(head, 0x9971aa, [side * 0.73, 0, 0.2], side * -1.1, 0.65);
    const wing = joint(root, `storybook wing:${side}`, [side * 0.72, 1.97, 0.57]);
    const points = [
      [0, 0],
      [side * 0.62, 0.96],
      [side * 1.65, 0.74],
      [side * 1.44, -0.22],
      [side * 0.89, 0.01],
      [side * 0.62, -0.52],
    ];
    panel(wing, 0xb47bb4, points, 0.09);
    for (const p of [
      [side * 1.65, 0.74],
      [side * 1.44, -0.22],
      [side * 0.62, -0.52],
    ])
      rod(wing, 0x75548d, [0, 0, -0.07], [p[0], p[1], -0.07], 0.055);
    rod(wing, 0x75548d, [0, 0, -0.07], [side * 0.62, 0.96, -0.07], 0.065);
    rod(wing, 0x75548d, [side * 0.62, 0.96, -0.07], [side * 1.65, 0.74, -0.07], 0.055);
    rig.wings.push(wing);
  }
  smile(head, 0.36, -0.45, -1.01);
  const tail = joint(root, 'curled dragon tail', [0, 0.72, 0.69]);
  oval(tail, 0x88649d, [0.4, 0.32, 0.85], [0.1, 0, 0.53]);
  oval(tail, 0x9971aa, [0.29, 0.25, 0.66], [0.28, 0.14, 1.16]);
  oval(tail, 0xb88ac1, [0.19, 0.29, 0.3], [0.37, 0.4, 1.6]);
  for (let i = 0; i < 4; i++)
    tip(tail, 0xe3bd8f, [i * 0.09, 0.34 + i * 0.05, 0.23 + i * 0.34], 0.15 - i * 0.015, 0.25);
  rig.tail = tail;
}

const builders: Record<string, (root: THREE.Group, head: THREE.Group, rig: BossRig) => void> = {
  sproutzilla,
  frosty,
  sandwich,
  flushington,
  'lava-lump': lavaLump,
  'demon-lizard': demonLizard,
};

export function buildBoss(id: string, root: THREE.Group): void {
  const headY = id === 'demon-lizard' ? 2.85 : 1.95;
  const head = joint(root, 'expressive head', [0, headY, 0]);
  const rig: BossRig = { character: id, legs: [], wings: [], arms: [], eyes: [], head };
  root.userData.rig = rig;
  root.userData.bossRig = rig;
  (builders[id] ?? demonLizard)(root, head, rig);

  // The level landing cap stays independent of the expressive head's idle tilt.
  // Its exact top preserves the existing jump physics: 2.49 / 3.39 before runtime scaling.
  const radius = id === 'demon-lizard' ? 0.72 : 0.59;
  const top = headY + 0.54;
  mesh(root, new THREE.CylinderGeometry(radius, radius * 0.94, 0.14, 24), GOLD, [0, top - 0.07, 0]);
  const inset = mesh(
    root,
    new THREE.CylinderGeometry(radius * 0.77, radius * 0.77, 0.012, 24),
    0xb78135,
    [0, top - 0.005, 0],
  );
  inset.name = 'landing target';
  const star = panel(
    root,
    CREAM,
    Array.from({ length: 10 }, (_, i) => {
      const angle = (i * Math.PI) / 5;
      const r = radius * (i % 2 ? 0.28 : 0.57);
      return [Math.sin(angle) * r, Math.cos(angle) * r];
    }),
    0.008,
  );
  star.rotation.x = -Math.PI / 2;
  star.position.y = top;
  root.userData.headHeight = top;
}

/** Small appendage motion leaves the root, landing cap, and gameplay collider untouched. */
export function animateBoss(root: THREE.Group, time: number): void {
  const rig = root.userData.bossRig as BossRig;
  const slow = Math.sin(time * 1.8);
  if (rig.head) rig.head.rotation.z = slow * 0.025;
  rig.arms.forEach((arm, i) => {
    arm.rotation.z = Math.sin(time * 2.1 + i * 1.7) * 0.08;
  });
  rig.legs.forEach((leg, i) => {
    leg.rotation.x = Math.sin(time * 1.8 + i * Math.PI) * 0.018;
  });
  rig.wings.forEach((wing, i) => {
    wing.rotation.y = (i ? -1 : 1) * (0.12 + slow * 0.1);
  });
  if (rig.tail) rig.tail.rotation.y = slow * 0.13;
  if (rig.accessory) rig.accessory.rotation.x = slow * 0.07;
  const phase = (time + (rig.character.length % 3)) % 4.7;
  const blink = phase > 4.5 ? 1 - Math.sin(((phase - 4.5) / 0.2) * Math.PI) * 0.92 : 1;
  rig.eyes.forEach((eye) => {
    eye.scale.y = blink;
  });
}
