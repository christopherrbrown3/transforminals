import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { buildDetailedAnimal, animateDetailedAnimal, type AnimalRig } from './animalModels';
import { buildBoss, animateBoss } from './bossModels';

/** All models use feet at Y=0 and look down -Z. No remote textures. */
const ink = 0x243c3b;
type Rig = AnimalRig;

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
      if (m.map || m.normalMap || m.transparent || m.vertexColors) continue;
      const key = [
        m.roughness,
        m.metalness,
        m.emissive.getHex(),
        m.emissiveIntensity,
        m.side,
        m.flatShading,
        m.depthTest,
        m.depthWrite,
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
        // Keep each authored color in linear space while sharing a single draw call.
        const colors = new Float32Array(geo.getAttribute('position').count * 3);
        const color = mesh.material.color.toArray();
        for (let i = 0; i < colors.length; i += 3) colors.set(color, i);
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        return geo;
      });
      const geometry = mergeGeometries(parts, false);
      parts.forEach((part) => part.dispose());
      if (!geometry) continue;
      const material = meshes[0].material.clone();
      material.color.set(0xffffff);
      material.vertexColors = true;
      const merged = new THREE.Mesh(geometry, material);
      merged.name = 'Toy sculpture batch';
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
  } else buildDetailedAnimal(id, g, rig);
  return batchCreatureMeshes(g);
}

export function createBoss(id: string): THREE.Group {
  const g = new THREE.Group();
  g.name = `boss:${id}`;
  g.userData.kind = id;
  buildBoss(id, g);
  return batchCreatureMeshes(g);
}

export function animateCreature(group: THREE.Group, time: number, moving: boolean): void {
  if (group.userData.bossRig) {
    animateBoss(group, time);
    return;
  }
  const rig = group.userData.rig as Rig | undefined;
  if (!rig) return;
  if (rig.motion) {
    animateDetailedAnimal(rig, time, moving);
    return;
  }
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
  // Reserve space for breathing, ears, long tails, and softly curling idle tentacles.
  const scale = Math.min(0.6, 0.97 / size.y, 2.45 / size.x, 2.45 / size.z);
  animal.scale.multiplyScalar(scale);
  animal.position.set(-center.x * scale, 0.24 - bounds.min.y * scale, -center.z * scale);
}
