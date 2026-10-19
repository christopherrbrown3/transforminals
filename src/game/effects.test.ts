import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { disposeObject, Effects } from './effects';

describe('scene resource cleanup', () => {
  it('releases instance buffers and deduplicates shared geometry, material, and texture disposal', () => {
    const texture = new THREE.Texture();
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const instances = new THREE.InstancedMesh(geometry, material, 3);
    instances.setColorAt(0, new THREE.Color(0xffd36d));
    const nested = new THREE.Group();
    nested.add(instances, new THREE.Mesh(geometry, material));
    const root = new THREE.Group();
    root.add(nested);
    const onInstanceDispose = vi.fn();
    const onGeometryDispose = vi.fn();
    const onMaterialDispose = vi.fn();
    const onTextureDispose = vi.fn();
    instances.addEventListener('dispose', onInstanceDispose);
    geometry.addEventListener('dispose', onGeometryDispose);
    material.addEventListener('dispose', onMaterialDispose);
    texture.addEventListener('dispose', onTextureDispose);

    disposeObject(root);

    expect(onInstanceDispose).toHaveBeenCalledTimes(1);
    expect(onGeometryDispose).toHaveBeenCalledTimes(1);
    expect(onMaterialDispose).toHaveBeenCalledTimes(1);
    expect(onTextureDispose).toHaveBeenCalledTimes(1);
  });

  it.each(['expire', 'clear'] as const)(
    'releases burst instance buffers on %s exactly once',
    (cleanup) => {
      const scene = new THREE.Scene();
      const effects = new Effects(scene);
      effects.burst(new THREE.Vector3(), 0xffd36d, 4);
      const mesh = scene.children[0] as THREE.InstancedMesh;
      const onInstanceDispose = vi.fn();
      const onGeometryDispose = vi.fn();
      const onMaterialDispose = vi.fn();
      mesh.addEventListener('dispose', onInstanceDispose);
      mesh.geometry.addEventListener('dispose', onGeometryDispose);
      (mesh.material as THREE.Material).addEventListener('dispose', onMaterialDispose);

      if (cleanup === 'expire') effects.tick(2.3);
      else effects.clear();
      effects.clear();
      effects.tick(3);

      expect(scene.children).toHaveLength(0);
      expect(onInstanceDispose).toHaveBeenCalledTimes(1);
      expect(onGeometryDispose).toHaveBeenCalledTimes(1);
      expect(onMaterialDispose).toHaveBeenCalledTimes(1);
    },
  );
});
