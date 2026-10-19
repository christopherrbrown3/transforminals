import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/** All models use feet at Y=0 and look down -Z. No remote textures. */
const ink = 0x243c3b;
type Rig = { legs: THREE.Group[]; wings: THREE.Group[]; tail?: THREE.Group; head?: THREE.Group };

/** Batch static siblings while retaining animated pivots and their original names. */
export function batchCreatureMeshes(group: THREE.Group): THREE.Group {
  function batch(parent: THREE.Object3D) {
    for (const child of [...parent.children]) if (child.children.length) batch(child);
    const sets = new Map<string, THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>[]>();
    for (const child of parent.children) {
      if (
        !(child instanceof THREE.Mesh) ||
        !(child.material instanceof THREE.MeshStandardMaterial) ||
        child.children.length
      )
        continue;
      const m = child.material;
      if (m.map || m.normalMap || m.transparent) continue;
      const key = [
        m.color.getHex(),
        m.roughness,
        m.metalness,
        m.emissive.getHex(),
        m.emissiveIntensity,
      ].join(':');
      if (!sets.has(key)) sets.set(key, []);
      sets.get(key)!.push(child as THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>);
    }
    for (const meshes of sets.values()) {
      if (meshes.length < 2) continue;
      const parts = meshes.map((mesh) => {
        mesh.updateMatrix();
        const geo = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
        // The model uses vertex normals but no UV-dependent materials.
        geo.deleteAttribute('uv');
        geo.deleteAttribute('uv1');
        geo.deleteAttribute('tangent');
        geo.applyMatrix4(mesh.matrix);
        return geo;
      });
      const geometry = mergeGeometries(parts, false);
      parts.forEach((part) => part.dispose());
      if (!geometry) continue;
      const merged = new THREE.Mesh(geometry, meshes[0].material.clone());
      merged.name = `Toy color batch ${meshes[0].material.color.getHexString()}`;
      merged.castShadow = true;
      merged.receiveShadow = true;
      for (const mesh of meshes) {
        parent.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
      }
      parent.add(merged);
    }
  }
  batch(group);
  return group;
}
const materials = new Map<number, THREE.MeshStandardMaterial>();
function material(color: number) {
  let m = materials.get(color);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.025 });
    materials.set(color, m);
  }
  return m.clone(); // Scene teardown owns each material.
}
function block(
  parent: THREE.Object3D,
  color: number,
  size: number[],
  position: number[],
  rotation = 0,
) {
  // A single bevel segment catches the sunlight while retaining a construction-toy silhouette.
  // Tiny face markings stay flat and crisp rather than accumulating unnecessary triangles.
  const smallest = Math.min(...size);
  const geometry =
    smallest >= 0.12 && Math.max(...size) >= 0.26
      ? new RoundedBoxGeometry(size[0], size[1], size[2], 1, Math.min(0.055, smallest * 0.14))
      : new THREE.BoxGeometry(size[0], size[1], size[2]);
  const mesh = new THREE.Mesh(geometry, material(color));
  mesh.position.set(position[0], position[1], position[2]);
  mesh.rotation.z = rotation;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function orb(parent: THREE.Object3D, color: number, size: number[], position: number[]) {
  const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), material(color));
  mesh.scale.set(size[0], size[1], size[2]);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function cone(
  parent: THREE.Object3D,
  color: number,
  radius: number,
  height: number,
  p: number[],
  sides = 4,
) {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(radius, height, sides), material(color));
  mesh.position.set(p[0], p[1], p[2]);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}
function eyes(parent: THREE.Object3D, width: number, y: number, z: number, big = false) {
  for (const s of [-1, 1]) {
    block(parent, 0xfff8e8, [big ? 0.29 : 0.2, big ? 0.33 : 0.23, 0.065], [s * width, y, z]);
    block(
      parent,
      ink,
      [big ? 0.13 : 0.09, big ? 0.19 : 0.13, 0.07],
      [s * width + 0.015, y - 0.015, z - 0.04],
    );
    block(parent, 0xffffff, [0.035, 0.045, 0.02], [s * width + 0.03, y + 0.025, z - 0.083]);
  }
}
function limb(
  root: THREE.Group,
  rig: Rig,
  color: number,
  x: number,
  y: number,
  z: number,
  h: number,
  w: number,
) {
  const pivot = new THREE.Group();
  pivot.position.set(x, y, z);
  root.add(pivot);
  block(pivot, color, [w, h, w], [0, -h / 2, 0]);
  rig.legs.push(pivot);
  return pivot;
}
function quad(id: string, g: THREE.Group, rig: Rig) {
  const palette: Record<string, number> = {
    fox: 0xe6873e,
    'arctic-fox': 0xe8f6f3,
    tiger: 0xf3ab48,
    lion: 0xe4b45b,
    giraffe: 0xf2cf72,
    hippo: 0x9f91bc,
    camel: 0xcfa56a,
    rat: 0x9b9ba7,
    'giant-cow': 0xf6e9d2,
  };
  const c = palette[id] ?? 0xe6873e;
  const tall = id === 'giraffe',
    large = id === 'hippo' || id === 'giant-cow',
    rat = id === 'rat';
  const legH = tall ? 0.9 : large ? 0.5 : 0.42;
  const bodyY = legH + 0.38,
    bw = large ? 1.2 : tall ? 0.72 : 0.73;
  block(g, c, [bw, large ? 0.95 : 0.67, large ? 1.65 : 1.3], [0, bodyY, 0.13]);
  for (const x of [-1, 1])
    for (const z of [-0.3, 0.65]) {
      const p = limb(g, rig, c, x * (bw / 2 - 0.13), legH, z, legH, 0.25);
      block(
        p,
        id === 'fox' ? 0x553d3c : id === 'giraffe' ? 0x8c674c : c,
        [0.27, 0.17, 0.35],
        [0, -legH + 0.08, -0.04],
      );
    }
  const hy = tall ? 2.15 : large ? 1.12 : 1.05;
  if (tall) block(g, c, [0.43, 1.38, 0.45], [0, 1.55, -0.45], -0.08);
  const head = new THREE.Group();
  head.position.set(0, hy, -0.6);
  g.add(head);
  rig.head = head;
  if (id === 'lion') orb(head, 0x9b613c, [0.65, 0.65, 0.45], [0, 0.03, 0.07]);
  block(head, c, [large ? 1.05 : 0.68, large ? 0.65 : 0.6, large ? 0.85 : 0.62], [0, 0, 0]);
  block(
    head,
    id.includes('fox') ? 0xfff0cd : c,
    [large ? 1.08 : 0.45, large ? 0.34 : 0.26, 0.42],
    [0, -0.15, -0.4],
  );
  block(
    head,
    id === 'giant-cow' ? 0xeaa5a1 : ink,
    [large ? 0.55 : 0.21, 0.13, 0.12],
    [0, -0.1, -0.64],
  );
  eyes(head, large ? 0.3 : 0.19, 0.1, large ? -0.45 : -0.335);
  if (id.includes('fox')) {
    block(g, 0xfff0cd, [0.46, 0.41, 0.05], [0, bodyY - 0.04, -0.535]);
    for (const s of [-1, 1]) block(head, 0xfff0cd, [0.24, 0.18, 0.08], [s * 0.23, -0.13, -0.33]);
  }
  if (id === 'hippo')
    for (const s of [-1, 1]) block(head, 0x706382, [0.1, 0.06, 0.04], [s * 0.3, -0.05, -0.63]);
  for (const s of [-1, 1]) {
    if (rat || id === 'hippo') {
      orb(head, c, [rat ? 0.24 : 0.15, rat ? 0.25 : 0.15, 0.09], [s * 0.35, 0.32, 0]);
      if (rat) orb(head, 0xeab2b2, [0.16, 0.17, 0.045], [s * 0.35, 0.32, -0.08]);
    } else {
      const ear = cone(head, c, 0.23, 0.39, [s * 0.24, 0.45, 0.02]);
      ear.rotation.z = -s * 0.16;
      cone(head, id.includes('fox') ? ink : 0xe7a29c, 0.12, 0.25, [s * 0.24, 0.45, -0.075]);
    }
    if (tall || id === 'giant-cow') {
      block(head, 0xa28157, [0.09, 0.27, 0.1], [s * 0.22, 0.45, -0.03]);
      orb(head, 0x845b42, [0.1, 0.08, 0.1], [s * 0.22, 0.61, -0.03]);
    }
  }
  const tail = new THREE.Group();
  tail.position.set(0, bodyY, 0.8);
  g.add(tail);
  rig.tail = tail;
  if (id.includes('fox')) {
    block(tail, c, [0.43, 0.43, 0.8], [0, 0.15, 0.3]);
    block(tail, 0xffefcf, [0.4, 0.4, 0.32], [0, 0.15, 0.83]);
    tail.rotation.x = -0.35;
  } else {
    block(tail, rat ? 0xe9b8b3 : c, [0.11, 0.11, 0.7], [0, 0, 0.3]);
    if (id === 'lion' || tall) orb(tail, 0x8f613e, [0.15, 0.15, 0.18], [0, 0, 0.67]);
  }
  if (id === 'camel') {
    orb(g, c, [0.43, 0.53, 0.4], [0, 1.23, 0.1]);
  }
  if (id === 'tiger')
    for (const s of [-1, 1])
      for (const z of [-0.3, 0.1, 0.5])
        block(g, 0x514135, [0.025, 0.53, 0.11], [s * 0.375, bodyY + 0.04, z], 0.14);
  if (tall)
    for (const s of [-1, 1])
      for (let i = 0; i < 5; i++)
        block(
          g,
          0xb58345,
          [0.025, 0.16, 0.19],
          [
            s * (i < 3 ? 0.37 : 0.23),
            i < 3 ? bodyY : 1.4 + (i - 3) * 0.3,
            i < 3 ? -0.3 + i * 0.4 : -0.48,
          ],
        );
  if (id === 'giant-cow') {
    for (const s of [-1, 1]) {
      block(g, ink, [0.025, 0.52, 0.5], [s * 0.61, 1, 0.3]);
      block(g, ink, [0.026, 0.35, 0.33], [s * 0.61, 0.85, -0.35]);
    }
    g.scale.setScalar(1.45);
  }
  if (rat) g.scale.setScalar(0.8);
}
function aquatic(id: string, g: THREE.Group, rig: Rig) {
  const whale = id === 'whale-shark',
    pir = id === 'piranha',
    long = id === 'barracuda' || id === 'leviathan';
  const c =
    id === 'leviathan'
      ? 0x6d64c8
      : whale
        ? 0x427b93
        : pir
          ? 0xef9b74
          : id === 'barracuda'
            ? 0x9ab9ba
            : 0x648ca9;
  const len = long ? 2.3 : whale ? 2.1 : 1.5;
  orb(g, c, [pir ? 0.65 : 0.55, pir ? 0.65 : 0.48, len / 2], [0, 0.8, 0]);
  block(g, 0xe6eddb, [0.68, 0.17, len * 0.67], [0, 0.53, -0.12]);
  const head = new THREE.Group();
  head.position.set(0, 0.85, -len * 0.36);
  g.add(head);
  rig.head = head;
  block(head, c, [0.8, 0.53, 0.5], [0, 0, -0.08]);
  eyes(head, 0.25, 0.05, -0.34);
  block(head, 0x39556a, [0.43, 0.055, 0.04], [0, -0.13, -0.36]);
  for (const s of [-1, 1]) {
    const fin = cone(g, c, 0.36, 0.65, [s * 0.61, 0.65, 0.05], 3);
    fin.rotation.z = s * -1.2;
  }
  cone(g, c, 0.29, 0.58, [0, 1.38, 0.12], 3);
  const tail = new THREE.Group();
  tail.position.set(0, 0.82, len * 0.5);
  g.add(tail);
  rig.tail = tail;
  const fluke = cone(tail, c, 0.53, 0.18, [0, 0, 0.15], 3);
  fluke.rotation.z = Math.PI / 2;
  fluke.rotation.x = Math.PI / 2;
  if (whale)
    for (let i = 0; i < 14; i++)
      block(
        g,
        0xbce2dd,
        [0.08, 0.06, 0.1],
        [
          ((i % 3) - 1) * 0.23,
          1.19 - Math.abs((i % 3) - 1) * 0.06,
          -0.65 + Math.floor(i / 3) * 0.3,
        ],
      );
  if (id === 'leviathan') {
    for (let i = 0; i < 5; i++) cone(g, 0xc8a6ef, 0.16, 0.38, [0, 1.28, -0.65 + i * 0.35], 4);
    g.scale.setScalar(1.2);
  }
}
function reptile(id: string, g: THREE.Group, rig: Rig) {
  const mech = id === 'mecha-reptile',
    salamander = id === 'salamander';
  const c = mech ? 0x92b5bf : salamander ? 0xf5a458 : 0x55a18d;
  if (salamander) {
    block(g, c, [0.65, 0.35, 1.4], [0, 0.4, 0.05]);
    block(g, c, [0.8, 0.35, 0.65], [0, 0.45, -0.65]);
    eyes(g, 0.25, 0.53, -0.99);
    for (const s of [-1, 1])
      for (const z of [-0.35, 0.6]) limb(g, rig, c, s * 0.4, 0.22, z, 0.22, 0.23);
  } else {
    block(g, c, [1.1, 1.35, 0.85], [0, 1.05, 0.1]);
    block(g, mech ? 0xcee5dc : 0xc7d786, [0.66, 0.95, 0.06], [0, 1, -0.35]);
    const head = new THREE.Group();
    head.position.set(0, 1.95, -0.35);
    g.add(head);
    rig.head = head;
    block(head, c, [0.85, 0.65, 0.9], [0, 0, 0]);
    block(head, c, [0.9, 0.32, 0.45], [0, -0.13, -0.51]);
    eyes(head, 0.25, 0.12, -0.47);
    for (const s of [-1, 1]) {
      limb(g, rig, c, s * 0.38, 0.6, 0.13, 0.6, 0.43);
      block(g, c, [0.26, 0.65, 0.3], [s * 0.67, 1.13, -0.23], s * -0.25);
    }
  }
  const tail = new THREE.Group();
  tail.position.set(0, salamander ? 0.4 : 0.7, 0.55);
  g.add(tail);
  rig.tail = tail;
  block(tail, c, [0.4, 0.3, 1.1], [0, 0, 0.45]);
  block(tail, c, [0.25, 0.2, 0.65], [0, -0.02, 1.25]);
  for (let i = 0; i < 4; i++)
    cone(
      g,
      mech ? 0x80e8e7 : 0xc7d786,
      0.2,
      0.45,
      [0, salamander ? 0.75 : 1.75 - i * 0.26, 0.4 + i * 0.3],
      3,
    );
  if (mech) {
    for (const s of [-1, 1]) orb(g, 0xf3c96a, [0.16, 0.16, 0.12], [s * 0.67, 1.42, -0.25]);
    block(g, 0x5fe0e4, [0.32, 0.34, 0.07], [0, 1.25, -0.4]);
    for (const s of [-1, 1]) {
      block(g, 0x647e8e, [0.34, 0.23, 0.54], [s * 0.66, 1.42, -0.1]);
      for (let k = 0; k < 3; k++)
        block(g, 0xcfe2df, [0.24, 0.055, 0.04], [s * 0.34, 0.76 + k * 0.14, -0.35]);
    }
  }
}
export function createCreature(id: string): THREE.Group {
  const g = new THREE.Group();
  g.name = `creature:${id}`;
  const rig: Rig = { legs: [], wings: [] };
  g.userData.rig = rig;
  g.userData.kind = id;
  if (id === 'human') {
    block(g, 0x438f88, [0.6, 0.62, 0.36], [0, 0.87, 0]);
    block(g, 0xf5c79c, [0.59, 0.55, 0.5], [0, 1.45, 0]);
    block(g, 0x5f463c, [0.65, 0.16, 0.55], [0, 1.74, 0.02]);
    block(g, 0x5f463c, [0.16, 0.28, 0.55], [-0.25, 1.6, 0.02]);
    block(g, 0x705141, [0.3, 0.13, 0.32], [0.12, 1.78, -0.13], -0.08);
    eyes(g, 0.16, 1.48, -0.27);
    block(g, 0xc98572, [0.14, 0.035, 0.02], [0, 1.29, -0.27]);
    for (const s of [-1, 1]) {
      const leg = limb(g, rig, 0x4c6775, s * 0.17, 0.57, 0, 0.53, 0.24);
      block(g, 0xf5c79c, [0.2, 0.52, 0.24], [s * 0.43, 0.88, 0], s * 0.1);
      block(leg, 0xffd277, [0.27, 0.15, 0.39], [0, -0.49, -0.06]);
      block(leg, 0xfff0cd, [0.28, 0.04, 0.4], [0, -0.545, -0.06]);
      block(g, 0x32726f, [0.12, 0.52, 0.04], [s * 0.19, 0.9, -0.19]);
    }
    block(g, 0xf0be6a, [0.43, 0.48, 0.2], [0, 0.89, 0.27]);
    block(g, 0xffd984, [0.35, 0.14, 0.04], [0, 1.05, 0.39]);
    block(g, 0x987348, [0.08, 0.11, 0.025], [0, 0.93, 0.4]);
  } else if (['shark', 'piranha', 'barracuda', 'whale-shark', 'leviathan'].includes(id))
    aquatic(id, g, rig);
  else if (['giant-reptile', 'mecha-reptile', 'salamander'].includes(id)) reptile(id, g, rig);
  else if (id === 'turtle') {
    orb(g, 0x6c9e70, [0.75, 0.55, 0.85], [0, 0.53, 0.1]);
    block(g, 0xc5d18a, [0.87, 0.18, 1.04], [0, 0.29, 0.1]);
    block(g, 0x91bb77, [0.5, 0.4, 0.57], [0, 0.48, -0.82]);
    eyes(g, 0.15, 0.53, -1.12);
    for (const s of [-1, 1])
      for (const z of [-0.35, 0.6]) limb(g, rig, 0x91bb77, s * 0.55, 0.25, z, 0.25, 0.3);
    for (let i = 0; i < 3; i++)
      block(g, 0x4f7f5b, [0.26, 0.04, 0.3], [0, 1.08 - Math.abs(i - 1) * 0.1, -0.3 + i * 0.39]);
  } else if (id === 'kraken') {
    orb(g, 0xb381c4, [0.65, 0.8, 0.65], [0, 1.2, 0]);
    eyes(g, 0.23, 1.21, -0.6, true);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const p = new THREE.Group();
      p.position.set(Math.sin(a) * 0.35, 0.6, Math.cos(a) * 0.35);
      p.rotation.y = a;
      g.add(p);
      block(p, 0xa271b7, [0.23, 0.23, 0.85], [0, -0.12, 0.35]);
      block(p, 0xd6a6cf, [0.25, 0.27, 0.26], [0, -0.23, 0.85]);
      rig.wings.push(p);
    }
  } else if (['bat', 'falcon', 'glow-moth'].includes(id)) {
    const moth = id === 'glow-moth',
      bat = id === 'bat',
      c = moth ? 0xffdf8b : bat ? 0x8877aa : 0x738997;
    orb(g, c, [0.33, 0.48, 0.36], [0, 0.85, 0]);
    block(g, c, [0.5, 0.41, 0.44], [0, 1.21, -0.18]);
    eyes(g, 0.14, 1.24, -0.42);
    if (!moth) block(g, bat ? 0xdfa2c1 : 0xf4c55f, [0.16, 0.13, 0.26], [0, 1.07, -0.5]);
    for (const s of [-1, 1]) {
      const wing = new THREE.Group();
      wing.position.set(s * 0.23, 1.06, 0);
      g.add(wing);
      orb(wing, moth ? 0xa6e0c1 : c, [0.7, 0.1, moth ? 0.65 : 0.46], [s * 0.57, 0, 0.04]);
      if (moth) orb(wing, 0xffd988, [0.25, 0.105, 0.26], [s * 0.73, 0, -0.07]);
      rig.wings.push(wing);
      if (bat) cone(g, c, 0.16, 0.33, [s * 0.18, 1.55, -0.1]);
    }
    for (const s of [-1, 1]) block(g, 0xf1c56e, [0.1, 0.18, 0.23], [s * 0.13, 0.34, -0.03]);
  } else quad(id, g, rig);
  return batchCreatureMeshes(g);
}

export function createBoss(id: string): THREE.Group {
  const g = new THREE.Group();
  g.name = `boss:${id}`;
  const rig: Rig = { legs: [], wings: [] };
  g.userData.rig = rig;
  g.userData.kind = id;
  const head = new THREE.Group();
  head.position.y = id === 'demon-lizard' ? 2.85 : 1.95;
  g.add(head);
  rig.head = head;
  if (id === 'sproutzilla') {
    block(g, 0x9a7450, [1.05, 1.4, 0.85], [0, 0.8, 0]);
    orb(head, 0x6fa36a, [1.15, 0.72, 0.85], [0, 0, 0]);
    for (const s of [-1, 1]) {
      block(g, 0x9a7450, [0.35, 0.75, 0.4], [s * 0.75, 1, 0], s * -0.4);
      limb(g, rig, 0x725a43, s * 0.35, 0.45, 0, 0.45, 0.45);
      cone(head, 0xffd77b, 0.22, 0.4, [s * 0.6, 0.7, 0]);
    }
    eyes(head, 0.38, 0.05, -0.77, true);
  } else if (id === 'frosty') {
    orb(g, 0xe7f5f3, [1.1, 0.85, 0.85], [0, 0.85, 0]);
    orb(head, 0xf8ffff, [0.8, 0.68, 0.7], [0, 0, 0]);
    eyes(head, 0.25, 0.08, -0.66, true);
    const nose = cone(head, 0xf5a24f, 0.14, 0.6, [0, -0.08, -0.9]);
    nose.rotation.x = -Math.PI / 2;
    block(head, 0x53768c, [1.05, 0.15, 0.9], [0, 0.65, 0]);
    block(head, 0x53768c, [0.65, 0.6, 0.65], [0, 0.98, 0]);
    block(g, 0xde8b91, [1.4, 0.2, 1.1], [0, 1.4, 0]);
  } else if (id === 'sandwich') {
    for (const [y, c, w, h] of [
      [0.4, 0xe9b66f, 1.8, 0.45],
      [0.78, 0x92bd61, 2, 0.13],
      [0.98, 0xe78865, 1.8, 0.23],
      [1.16, 0xf5d36e, 2, 0.12],
      [1.43, 0xe9b66f, 1.8, 0.43],
    ])
      block(g, c, [w, h, 1.2], [0, y, 0]);
    block(head, 0xf4d18b, [1.65, 0.5, 1.2], [0, 0, 0]);
    eyes(head, 0.35, 0.02, -0.63, true);
    for (const s of [-1, 1]) block(g, 0xa57a50, [0.27, 0.65, 0.3], [s * 1.05, 0.65, 0], s * -0.3);
  } else if (id === 'flushington') {
    block(g, 0xe1e9ee, [0.8, 0.8, 0.85], [0, 0.4, 0.25]);
    orb(g, 0xf8faf3, [1, 0.57, 1.15], [0, 0.92, -0.16]);
    block(g, 0xc7d5df, [1.4, 1.5, 0.5], [0, 1.3, 0.6]);
    block(g, 0xfafff6, [1.57, 0.2, 0.65], [0, 2.1, 0.6]);
    block(head, 0xa1d7a6, [0.9, 0.65, 0.8], [0, -0.1, -0.2]);
    eyes(head, 0.25, -0.04, -0.63, true);
    block(g, 0xffd171, [0.35, 0.17, 0.12], [0.52, 1.78, 0.31]);
  } else if (id === 'lava-lump') {
    orb(g, 0x805c68, [1.35, 1.2, 1], [0, 1.1, 0]);
    orb(head, 0x8d6571, [0.92, 0.57, 0.82], [0, 0, -0.1]);
    eyes(head, 0.31, 0.03, -0.86, true);
    for (const s of [-1, 1]) {
      block(g, 0xffba68, [0.16, 1.3, 0.08], [s * 0.43, 1.1, -0.89], s * -0.2);
      cone(head, 0xffc363, 0.23, 0.55, [s * 0.55, 0.55, 0]);
    }
  } else {
    block(g, 0x9167a7, [1.6, 1.8, 1.05], [0, 1.3, 0.2]);
    block(g, 0xe4abbb, [0.95, 1.25, 0.1], [0, 1.3, -0.38]);
    block(head, 0x9167a7, [1.35, 0.8, 1.2], [0, 0, 0]);
    block(head, 0xb97cbd, [1.4, 0.32, 0.6], [0, -0.25, -0.6]);
    eyes(head, 0.4, 0.1, -0.63, true);
    for (const s of [-1, 1]) {
      cone(head, 0xf6d997, 0.23, 0.65, [s * 0.52, 0.6, 0.1]);
      limb(g, rig, 0x9167a7, s * 0.55, 0.6, 0.2, 0.6, 0.6);
      block(g, 0x9167a7, [0.4, 0.9, 0.4], [s * 1.02, 1.5, 0], s * -0.25);
      const wing = new THREE.Group();
      wing.position.set(s * 0.7, 2, 0.5);
      g.add(wing);
      const w = cone(wing, 0xbf8dc2, 0.9, 0.2, [s * 0.65, 0.1, 0.1], 3);
      w.rotation.x = Math.PI / 2;
      rig.wings.push(wing);
    }
    const tail = new THREE.Group();
    tail.position.set(0, 0.7, 0.7);
    g.add(tail);
    block(tail, 0x9167a7, [0.5, 0.4, 1.7], [0, 0, 0.7]);
    rig.tail = tail;
  }
  // Every boss has a broad, clear crown to land on.
  block(head, 0xffd476, [id === 'demon-lizard' ? 1.2 : 0.9, 0.08, 0.8], [0, 0.5, 0]);
  g.userData.headHeight = head.position.y + 0.54;
  return batchCreatureMeshes(g);
}

export function animateCreature(group: THREE.Group, time: number, moving: boolean): void {
  const rig = group.userData.rig as Rig | undefined;
  if (!rig) return;
  rig.legs.forEach((leg, i) => {
    leg.rotation.x = moving
      ? Math.sin(time * 11 + i * Math.PI) * 0.42
      : Math.sin(time * 2 + i) * 0.025;
  });
  rig.wings.forEach((wing, i) => {
    wing.rotation.z = Math.sin(time * (moving ? 12 : 5)) * 0.24 * (i % 2 ? 1 : -1);
  });
  if (rig.tail) rig.tail.rotation.y = Math.sin(time * (moving ? 9 : 3)) * 0.21;
  if (rig.head) rig.head.rotation.z = Math.sin(time * 2) * 0.035;
}

/** Fit the measured model, including its intrinsic species scale, below a cage roof. */
export function fitCagedCreature(animal: THREE.Group): void {
  const bounds = new THREE.Box3().setFromObject(animal);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const scale = Math.min(0.6, 1.05 / size.y, 2.6 / size.x, 2.6 / size.z);
  animal.scale.multiplyScalar(scale);
  animal.position.set(-center.x * scale, 0.2 - bounds.min.y * scale, -center.z * scale);
}
