import * as THREE from 'three';
import { expect, it } from 'vitest';
import { batchCreatureMeshes } from './creatures';
import { disposeObject } from './effects';

it('preserves colored geometry and moving pivots while reducing compatible materials to one draw', () => {
  const group = new THREE.Group();
  const pivot = new THREE.Group();
  pivot.name = 'moving head';
  group.add(pivot);
  const red = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshStandardMaterial({ color: 0xe6873e }),
  );
  const cream = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshStandardMaterial({ color: 0xfff0cd }),
  );
  red.position.x = -1;
  cream.position.x = 1;
  pivot.add(red, cream);
  const before = new THREE.Box3().setFromObject(group);
  const expectedColors = [red.material.color.toArray(), cream.material.color.toArray()];
  batchCreatureMeshes(group);
  expect(group.children).toEqual([pivot]);
  expect(pivot.children).toHaveLength(1);
  const merged = pivot.children[0] as THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  expect(merged.material.vertexColors).toBe(true);
  const color = merged.geometry.getAttribute('color');
  const colors = new Set<string>();
  for (let i = 0; i < color.count; i++)
    colors.add([color.getX(i), color.getY(i), color.getZ(i)].map((n) => n.toFixed(4)).join(','));
  expect(colors).toEqual(new Set(expectedColors.map((c) => c.map((n) => n.toFixed(4)).join(','))));
  const after = new THREE.Box3().setFromObject(group);
  expect(after.min.toArray()).toEqual(before.min.toArray());
  expect(after.max.toArray()).toEqual(before.max.toArray());
  pivot.rotation.y = Math.PI / 2;
  group.updateMatrixWorld(true);
  expect(new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3()).z).toBeCloseTo(3);
  disposeObject(group);
});
