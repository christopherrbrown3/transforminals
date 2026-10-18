import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** All models use feet at Y=0 and look down -Z. No remote textures. */
const ink = 0x243c3b;
type Rig = { legs: THREE.Group[]; wings: THREE.Group[]; tail?: THREE.Group; head?: THREE.Group };

/** Batch static siblings while retaining animated pivots and their original names. */
export function batchCreatureMeshes(group: THREE.Group): THREE.Group {
  function batch(parent: THREE.Object3D) {
    for (const child of [...parent.children]) if (child.children.length) batch(child);
    const sets = new Map<string, THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>[]>();
    for (const child of parent.children) {
      if (!(child instanceof THREE.Mesh) || !(child.material instanceof THREE.MeshStandardMaterial) || child.children.length) continue;
      const m = child.material;
      if (m.map || m.normalMap || m.transparent) continue;
      const key = [m.color.getHex(), m.roughness, m.metalness, m.emissive.getHex(), m.emissiveIntensity].join(':');
      if (!sets.has(key)) sets.set(key, []);
      sets.get(key)!.push(child as THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>);
    }
    for (const meshes of sets.values()) {
      if (meshes.length < 2) continue;
      const parts = meshes.map(mesh => {
        mesh.updateMatrix();
        const geo = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
        // The model uses vertex normals but no UV-dependent materials.
        geo.deleteAttribute('uv'); geo.deleteAttribute('uv1'); geo.deleteAttribute('tangent');
        geo.applyMatrix4(mesh.matrix); return geo;
      });
      const geometry = mergeGeometries(parts, false);
      parts.forEach(part => part.dispose());
      if (!geometry) continue;
      const merged = new THREE.Mesh(geometry, meshes[0].material.clone());
      merged.name = `Toy color batch ${meshes[0].material.color.getHexString()}`;
      merged.castShadow = true; merged.receiveShadow = true;
      for (const mesh of meshes) { parent.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); }
      parent.add(merged);
    }
  }
  batch(group);
  return group;
}
const materials = new Map<number, THREE.MeshStandardMaterial>();
function material(color: number) {
  let m = materials.get(color);
  if (!m) { m = new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0.03 }); materials.set(color, m); }
  return m.clone(); // Scene teardown owns each material.
}
function block(parent: THREE.Object3D, color: number, size: number[], position: number[], rotation = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material(color));
  mesh.position.set(position[0], position[1], position[2]); mesh.rotation.z = rotation;
  mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function orb(parent: THREE.Object3D, color: number, size: number[], position: number[]) {
  const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), material(color));
  mesh.scale.set(size[0], size[1], size[2]); mesh.position.set(position[0], position[1], position[2]);
  mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function cone(parent: THREE.Object3D, color: number, radius: number, height: number, p: number[], sides = 4) {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(radius, height, sides), material(color));
  mesh.position.set(p[0], p[1], p[2]); mesh.castShadow = true; parent.add(mesh); return mesh;
}
function eyes(parent: THREE.Object3D, width: number, y: number, z: number, big = false) {
  for (const s of [-1, 1]) {
    block(parent, 0xfff8e8, [big ? .29 : .2, big ? .33 : .23, .065], [s * width, y, z]);
    block(parent, ink, [big ? .13 : .09, big ? .19 : .13, .07], [s * width + .015, y - .015, z - .04]);
    block(parent, 0xffffff, [.035, .045, .02], [s * width + .03, y + .025, z - .083]);
  }
}
function limb(root: THREE.Group, rig: Rig, color: number, x: number, y: number, z: number, h: number, w: number) {
  const pivot = new THREE.Group(); pivot.position.set(x, y, z); root.add(pivot);
  block(pivot, color, [w, h, w], [0, -h / 2, 0]); rig.legs.push(pivot); return pivot;
}
function quad(id: string, g: THREE.Group, rig: Rig) {
  const palette: Record<string, number> = { fox: 0xe6873e, 'arctic-fox': 0xe8f6f3, tiger: 0xf3ab48, lion: 0xe4b45b, giraffe: 0xf2cf72, hippo: 0x9f91bc, camel: 0xcfa56a, rat: 0x9b9ba7, 'giant-cow': 0xf6e9d2 };
  const c = palette[id] ?? 0xe6873e;
  const tall = id === 'giraffe', large = id === 'hippo' || id === 'giant-cow', rat = id === 'rat';
  const legH = tall ? .9 : large ? .5 : .42;
  const bodyY = legH + .38, bw = large ? 1.2 : tall ? .72 : .73;
  block(g, c, [bw, large ? .95 : .67, large ? 1.65 : 1.3], [0, bodyY, .13]);
  for (const x of [-1, 1]) for (const z of [-.3, .65]) {
    const p = limb(g, rig, c, x * (bw / 2 - .13), legH, z, legH, .25);
    block(p, id === 'fox' ? 0x553d3c : id === 'giraffe' ? 0x8c674c : c, [.27, .17, .35], [0, -legH + .08, -.04]);
  }
  const hy = tall ? 2.15 : large ? 1.12 : 1.05;
  if (tall) block(g, c, [.43, 1.38, .45], [0, 1.55, -.45], -.08);
  const head = new THREE.Group(); head.position.set(0, hy, -.6); g.add(head); rig.head = head;
  if (id === 'lion') orb(head, 0x9b613c, [.65, .65, .45], [0, .03, .07]);
  block(head, c, [large ? 1.05 : .68, large ? .65 : .6, large ? .85 : .62], [0, 0, 0]);
  block(head, id.includes('fox') ? 0xfff0cd : c, [large ? 1.08 : .45, large ? .34 : .26, .42], [0, -.15, -.4]);
  block(head, id === 'giant-cow' ? 0xeaa5a1 : ink, [large ? .55 : .21, .13, .12], [0, -.1, -.64]);
  eyes(head, large ? .3 : .19, .1, large ? -.45 : -.335);
  for (const s of [-1, 1]) {
    if (rat || id === 'hippo') { orb(head, c, [rat ? .24 : .15, rat ? .25 : .15, .09], [s * .35, .32, 0]); if (rat) orb(head, 0xeab2b2, [.16, .17, .045], [s * .35, .32, -.08]); }
    else { const ear = cone(head, c, .23, .39, [s * .24, .45, .02]); ear.rotation.z = -s * .16; cone(head, id.includes('fox') ? ink : 0xe7a29c, .12, .25, [s * .24, .45, -.075]); }
    if (tall || id === 'giant-cow') { block(head, 0xa28157, [.09, .27, .1], [s * .22, .45, -.03]); orb(head, 0x845b42, [.1, .08, .1], [s * .22, .61, -.03]); }
  }
  const tail = new THREE.Group(); tail.position.set(0, bodyY, .8); g.add(tail); rig.tail = tail;
  if (id.includes('fox')) { block(tail, c, [.43, .43, .8], [0, .15, .3]); block(tail, 0xffefcf, [.4, .4, .32], [0, .15, .83]); tail.rotation.x = -.35; }
  else { block(tail, rat ? 0xe9b8b3 : c, [.11, .11, .7], [0, 0, .3]); if (id === 'lion' || tall) orb(tail, 0x8f613e, [.15, .15, .18], [0, 0, .67]); }
  if (id === 'camel') { orb(g, c, [.43, .53, .4], [0, 1.23, .1]); }
  if (id === 'tiger') for (const s of [-1, 1]) for (const z of [-.3, .1, .5]) block(g, 0x514135, [.025, .53, .11], [s * .375, bodyY + .04, z], .14);
  if (tall) for (const s of [-1, 1]) for (let i = 0; i < 5; i++) block(g, 0xb58345, [.025, .16, .19], [s * (i < 3 ? .37 : .23), i < 3 ? bodyY : 1.4 + (i - 3) * .3, i < 3 ? -.3 + i * .4 : -.48]);
  if (id === 'giant-cow') { for (const s of [-1, 1]) { block(g, ink, [.025, .52, .5], [s * .61, 1, .3]); block(g, ink, [.026, .35, .33], [s * .61, .85, -.35]); } g.scale.setScalar(1.45); }
  if (rat) g.scale.setScalar(.8);
}
function aquatic(id: string, g: THREE.Group, rig: Rig) {
  const whale = id === 'whale-shark', pir = id === 'piranha', long = id === 'barracuda' || id === 'leviathan';
  const c = id === 'leviathan' ? 0x6d64c8 : whale ? 0x427b93 : pir ? 0xef9b74 : id === 'barracuda' ? 0x9ab9ba : 0x648ca9;
  const len = long ? 2.3 : whale ? 2.1 : 1.5;
  orb(g, c, [pir ? .65 : .55, pir ? .65 : .48, len / 2], [0, .8, 0]);
  block(g, 0xe6eddb, [.68, .17, len * .67], [0, .53, -.12]);
  const head = new THREE.Group(); head.position.set(0, .85, -len * .36); g.add(head); rig.head = head;
  block(head, c, [.8, .53, .5], [0, 0, -.08]); eyes(head, .25, .05, -.34);
  block(head, 0x39556a, [.43, .055, .04], [0, -.13, -.36]);
  for (const s of [-1, 1]) { const fin = cone(g, c, .36, .65, [s * .61, .65, .05], 3); fin.rotation.z = s * -1.2; }
  cone(g, c, .29, .58, [0, 1.38, .12], 3);
  const tail = new THREE.Group(); tail.position.set(0, .82, len * .5); g.add(tail); rig.tail = tail;
  const fluke = cone(tail, c, .53, .18, [0, 0, .15], 3); fluke.rotation.z = Math.PI / 2; fluke.rotation.x = Math.PI / 2;
  if (whale) for (let i = 0; i < 14; i++) block(g, 0xbce2dd, [.08, .06, .1], [(i % 3 - 1) * .23, 1.19 - Math.abs(i % 3 - 1) * .06, -.65 + Math.floor(i / 3) * .3]);
  if (id === 'leviathan') { for (let i = 0; i < 5; i++) cone(g, 0xc8a6ef, .16, .38, [0, 1.28, -.65 + i * .35], 4); g.scale.setScalar(1.2); }
}
function reptile(id: string, g: THREE.Group, rig: Rig) {
  const mech = id === 'mecha-reptile', salamander = id === 'salamander';
  const c = mech ? 0x92b5bf : salamander ? 0xf5a458 : 0x55a18d;
  if (salamander) { block(g, c, [.65, .35, 1.4], [0, .4, .05]); block(g, c, [.8, .35, .65], [0, .45, -.65]); eyes(g, .25, .53, -.99); for (const s of [-1, 1]) for (const z of [-.35, .6]) limb(g, rig, c, s * .4, .22, z, .22, .23); }
  else { block(g, c, [1.1, 1.35, .85], [0, 1.05, .1]); block(g, mech ? 0xcee5dc : 0xc7d786, [.66, .95, .06], [0, 1, -.35]); const head = new THREE.Group(); head.position.set(0, 1.95, -.35); g.add(head); rig.head = head; block(head, c, [.85, .65, .9], [0, 0, 0]); block(head, c, [.9, .32, .45], [0, -.13, -.51]); eyes(head, .25, .12, -.47); for (const s of [-1, 1]) { limb(g, rig, c, s * .38, .6, .13, .6, .43); block(g, c, [.26, .65, .3], [s * .67, 1.13, -.23], s * -.25); } }
  const tail = new THREE.Group(); tail.position.set(0, salamander ? .4 : .7, .55); g.add(tail); rig.tail = tail; block(tail, c, [.4, .3, 1.1], [0, 0, .45]); block(tail, c, [.25, .2, .65], [0, -.02, 1.25]);
  for (let i = 0; i < 4; i++) cone(g, mech ? 0x80e8e7 : 0xc7d786, .2, .45, [0, salamander ? .75 : 1.75 - i * .26, .4 + i * .3], 3);
  if (mech) { for (const s of [-1, 1]) orb(g, 0xf3c96a, [.16, .16, .12], [s * .67, 1.42, -.25]); block(g, 0x5fe0e4, [.32, .34, .07], [0, 1.25, -.4]); }
}
export function createCreature(id: string): THREE.Group {
  const g = new THREE.Group(); g.name = `creature:${id}`;
  const rig: Rig = { legs: [], wings: [] }; g.userData.rig = rig; g.userData.kind = id;
  if (id === 'human') {
    block(g, 0x438f88, [.6, .62, .36], [0, .87, 0]);
    block(g, 0xf5c79c, [.59, .55, .5], [0, 1.45, 0]);
    block(g, 0x5f463c, [.65, .16, .55], [0, 1.74, .02]); block(g, 0x5f463c, [.16, .28, .55], [-.25, 1.6, .02]);
    eyes(g, .16, 1.48, -.27); block(g, 0xc98572, [.14, .035, .02], [0, 1.29, -.27]);
    for (const s of [-1, 1]) { limb(g, rig, 0x4c6775, s * .17, .57, 0, .53, .24); block(g, 0xf5c79c, [.2, .52, .24], [s * .43, .88, 0], s * .1); block(g, 0xffd277, [.27, .15, .39], [s * .17, .08, -.06]); }
    block(g, 0xf0be6a, [.43, .48, .2], [0, .89, .27]);
  } else if (['shark', 'piranha', 'barracuda', 'whale-shark', 'leviathan'].includes(id)) aquatic(id, g, rig);
  else if (['giant-reptile', 'mecha-reptile', 'salamander'].includes(id)) reptile(id, g, rig);
  else if (id === 'turtle') {
    orb(g, 0x6c9e70, [.75, .55, .85], [0, .53, .1]); block(g, 0xc5d18a, [.87, .18, 1.04], [0, .29, .1]);
    block(g, 0x91bb77, [.5, .4, .57], [0, .48, -.82]); eyes(g, .15, .53, -1.12);
    for (const s of [-1, 1]) for (const z of [-.35, .6]) limb(g, rig, 0x91bb77, s * .55, .25, z, .25, .3);
    for (let i = 0; i < 3; i++) block(g, 0x4f7f5b, [.26, .04, .3], [0, 1.08 - Math.abs(i - 1) * .1, -.3 + i * .39]);
  } else if (id === 'kraken') {
    orb(g, 0xb381c4, [.65, .8, .65], [0, 1.2, 0]); eyes(g, .23, 1.21, -.6, true);
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; const p = new THREE.Group(); p.position.set(Math.sin(a) * .35, .6, Math.cos(a) * .35); p.rotation.y = a; g.add(p); block(p, 0xa271b7, [.23, .23, .85], [0, -.12, .35]); block(p, 0xd6a6cf, [.25, .27, .26], [0, -.23, .85]); rig.wings.push(p); }
  } else if (['bat', 'falcon', 'glow-moth'].includes(id)) {
    const moth = id === 'glow-moth', bat = id === 'bat', c = moth ? 0xffdf8b : bat ? 0x8877aa : 0x738997;
    orb(g, c, [.33, .48, .36], [0, .85, 0]); block(g, c, [.5, .41, .44], [0, 1.21, -.18]); eyes(g, .14, 1.24, -.42);
    if (!moth) block(g, bat ? 0xdfa2c1 : 0xf4c55f, [.16, .13, .26], [0, 1.07, -.5]);
    for (const s of [-1, 1]) { const wing = new THREE.Group(); wing.position.set(s * .23, 1.06, 0); g.add(wing); orb(wing, moth ? 0xa6e0c1 : c, [.7, .1, moth ? .65 : .46], [s * .57, 0, .04]); if (moth) orb(wing, 0xffd988, [.25, .105, .26], [s * .73, 0, -.07]); rig.wings.push(wing); if (bat) cone(g, c, .16, .33, [s * .18, 1.55, -.1]); }
    for (const s of [-1, 1]) block(g, 0xf1c56e, [.1, .18, .23], [s * .13, .34, -.03]);
  } else quad(id, g, rig);
  return batchCreatureMeshes(g);
}

export function createBoss(id: string): THREE.Group {
  const g = new THREE.Group(); g.name = `boss:${id}`; const rig: Rig = { legs: [], wings: [] }; g.userData.rig = rig; g.userData.kind = id;
  const head = new THREE.Group(); head.position.y = id === 'demon-lizard' ? 2.85 : 1.95; g.add(head); rig.head = head;
  if (id === 'sproutzilla') {
    block(g, 0x9a7450, [1.05, 1.4, .85], [0, .8, 0]); orb(head, 0x6fa36a, [1.15, .72, .85], [0, 0, 0]);
    for (const s of [-1, 1]) { block(g, 0x9a7450, [.35, .75, .4], [s * .75, 1, 0], s * -.4); limb(g, rig, 0x725a43, s * .35, .45, 0, .45, .45); cone(head, 0xffd77b, .22, .4, [s * .6, .7, 0]); } eyes(head, .38, .05, -.77, true);
  } else if (id === 'frosty') {
    orb(g, 0xe7f5f3, [1.1, .85, .85], [0, .85, 0]); orb(head, 0xf8ffff, [.8, .68, .7], [0, 0, 0]); eyes(head, .25, .08, -.66, true); const nose = cone(head, 0xf5a24f, .14, .6, [0, -.08, -.9]); nose.rotation.x = -Math.PI / 2; block(head, 0x53768c, [1.05, .15, .9], [0, .65, 0]); block(head, 0x53768c, [.65, .6, .65], [0, .98, 0]); block(g, 0xde8b91, [1.4, .2, 1.1], [0, 1.4, 0]);
  } else if (id === 'sandwich') {
    for (const [y, c, w, h] of [[.4, 0xe9b66f, 1.8, .45], [.78, 0x92bd61, 2, .13], [.98, 0xe78865, 1.8, .23], [1.16, 0xf5d36e, 2, .12], [1.43, 0xe9b66f, 1.8, .43]]) block(g, c, [w, h, 1.2], [0, y, 0]); block(head, 0xf4d18b, [1.65, .5, 1.2], [0, 0, 0]); eyes(head, .35, .02, -.63, true); for (const s of [-1, 1]) block(g, 0xa57a50, [.27, .65, .3], [s * 1.05, .65, 0], s * -.3);
  } else if (id === 'flushington') {
    block(g, 0xe1e9ee, [.8, .8, .85], [0, .4, .25]); orb(g, 0xf8faf3, [1, .57, 1.15], [0, .92, -.16]); block(g, 0xc7d5df, [1.4, 1.5, .5], [0, 1.3, .6]); block(g, 0xfafff6, [1.57, .2, .65], [0, 2.1, .6]); block(head, 0xa1d7a6, [.9, .65, .8], [0, -.1, -.2]); eyes(head, .25, -.04, -.63, true); block(g, 0xffd171, [.35, .17, .12], [.52, 1.78, .31]);
  } else if (id === 'lava-lump') {
    orb(g, 0x805c68, [1.35, 1.2, 1], [0, 1.1, 0]); orb(head, 0x8d6571, [.92, .57, .82], [0, 0, -.1]); eyes(head, .31, .03, -.86, true); for (const s of [-1, 1]) { block(g, 0xffba68, [.16, 1.3, .08], [s * .43, 1.1, -.89], s * -.2); cone(head, 0xffc363, .23, .55, [s * .55, .55, 0]); }
  } else {
    block(g, 0x9167a7, [1.6, 1.8, 1.05], [0, 1.3, .2]); block(g, 0xe4abbb, [.95, 1.25, .1], [0, 1.3, -.38]); block(head, 0x9167a7, [1.35, .8, 1.2], [0, 0, 0]); block(head, 0xb97cbd, [1.4, .32, .6], [0, -.25, -.6]); eyes(head, .4, .1, -.63, true); for (const s of [-1, 1]) { cone(head, 0xf6d997, .23, .65, [s * .52, .6, .1]); limb(g, rig, 0x9167a7, s * .55, .6, .2, .6, .6); block(g, 0x9167a7, [.4, .9, .4], [s * 1.02, 1.5, 0], s * -.25); const wing = new THREE.Group(); wing.position.set(s * .7, 2, .5); g.add(wing); const w = cone(wing, 0xbf8dc2, .9, .2, [s * .65, .1, .1], 3); w.rotation.x = Math.PI / 2; rig.wings.push(wing); }
    const tail = new THREE.Group(); tail.position.set(0, .7, .7); g.add(tail); block(tail, 0x9167a7, [.5, .4, 1.7], [0, 0, .7]); rig.tail = tail;
  }
  // Every boss has a broad, clear crown to land on.
  block(head, 0xffd476, [id === 'demon-lizard' ? 1.2 : .9, .08, .8], [0, .5, 0]);
  g.userData.headHeight = head.position.y + .54;
  return batchCreatureMeshes(g);
}

export function animateCreature(group: THREE.Group, time: number, moving: boolean): void {
  const rig = group.userData.rig as Rig | undefined;
  if (!rig) return;
  rig.legs.forEach((leg, i) => { leg.rotation.x = moving ? Math.sin(time * 11 + i * Math.PI) * .42 : Math.sin(time * 2 + i) * .025; });
  rig.wings.forEach((wing, i) => { wing.rotation.z = Math.sin(time * (moving ? 12 : 5)) * .24 * (i % 2 ? 1 : -1); });
  if (rig.tail) rig.tail.rotation.y = Math.sin(time * (moving ? 9 : 3)) * .21;
  if (rig.head) rig.head.rotation.z = Math.sin(time * 2) * .035;
}
