import * as THREE from 'three';
interface Burst {
  mesh: THREE.InstancedMesh;
  positions: THREE.Vector3[];
  velocities: THREE.Vector3[];
  life: number;
  duration: number;
}
interface PortalRipple {
  group: THREE.Group;
  life: number;
  duration: number;
}
export class Effects {
  private bursts: Burst[] = [];
  private ripples: PortalRipple[] = [];
  private dummy = new THREE.Object3D();
  reduced = false;
  constructor(private scene: THREE.Scene) {}
  portal(position: THREE.Vector3, color: THREE.ColorRepresentation) {
    const group = new THREE.Group();
    group.name = 'portal-arrival';
    group.position.copy(position);
    const geometry = new THREE.TorusGeometry(1, 0.055, 6, 48);
    for (let i = 0; i < (this.reduced ? 1 : 3); i++) {
      const ring = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7, depthWrite: false }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.16 + i * 0.65;
      group.add(ring);
    }
    this.scene.add(group);
    this.ripples.push({ group, life: 0, duration: this.reduced ? 0.35 : 0.85 });
  }
  get portalActive() {
    return this.ripples.length > 0;
  }
  burst(position: THREE.Vector3, color = 0xffd36d, count = 60) {
    count = this.reduced ? 12 : count;
    const mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.13, 0.13, 0.13),
      new THREE.MeshBasicMaterial({ color }),
      count,
    );
    const positions = [],
      velocities = [];
    for (let i = 0; i < count; i++) {
      positions.push(position.clone());
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      velocities.push(
        new THREE.Vector3(Math.cos(angle) * speed, 3 + Math.random() * 5, Math.sin(angle) * speed),
      );
      mesh.setColorAt(i, new THREE.Color([color, 0xffe5a0, 0xe78f98, 0x9ccfb0, 0xaab8e9][i % 5]));
    }
    mesh.frustumCulled = false;
    this.scene.add(mesh);
    this.bursts.push({ mesh, positions, velocities, life: 0, duration: 2.2 });
  }
  tick(dt: number) {
    this.ripples = this.ripples.filter((ripple) => {
      ripple.life += dt;
      const t = Math.min(1, ripple.life / ripple.duration);
      ripple.group.children.forEach((child, i) => {
        const ring = child as THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
        ring.scale.setScalar(this.reduced ? 2.4 : 1 + (1 - (1 - t) ** 3) * (3 + i * 0.5));
        ring.material.opacity = 0.7 * (1 - t);
        if (!this.reduced) ring.position.y = 0.16 + i * 0.65 + t * 0.8;
      });
      if (t < 1) return true;
      this.scene.remove(ripple.group);
      disposeObject(ripple.group);
      return false;
    });
    for (const b of this.bursts) {
      b.life += dt;
      for (let i = 0; i < b.positions.length; i++) {
        b.velocities[i].y -= 8 * dt;
        b.positions[i].addScaledVector(b.velocities[i], dt);
        this.dummy.position.copy(b.positions[i]);
        this.dummy.rotation.set(b.life * 3 + i, b.life * 2, 0);
        this.dummy.scale.setScalar(Math.max(0, 1 - b.life / b.duration));
        this.dummy.updateMatrix();
        b.mesh.setMatrixAt(i, this.dummy.matrix);
      }
      b.mesh.instanceMatrix.needsUpdate = true;
    }
    this.bursts = this.bursts.filter((b) => {
      if (b.life < b.duration) return true;
      this.scene.remove(b.mesh);
      b.mesh.dispose();
      b.mesh.geometry.dispose();
      (b.mesh.material as THREE.Material).dispose();
      return false;
    });
  }
  clear() {
    for (const ripple of this.ripples) {
      this.scene.remove(ripple.group);
      disposeObject(ripple.group);
    }
    this.ripples = [];
    for (const b of this.bursts) {
      this.scene.remove(b.mesh);
      b.mesh.dispose();
      b.mesh.geometry.dispose();
      (b.mesh.material as THREE.Material).dispose();
    }
    this.bursts = [];
  }
}
export function label(text: string, color = '#fff5dc', width = 5, prominent = false): THREE.Sprite {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const font = prominent ? '600 64px Fredoka, sans-serif' : '600 42px Fredoka, sans-serif';
  ctx.font = font;
  canvas.width = prominent ? Math.ceil(Math.min(1400, ctx.measureText(text).width + 80)) : 768;
  canvas.height = prominent ? 144 : 160;
  ctx.fillStyle = '#294e41';
  ctx.beginPath();
  ctx.roundRect(4, 12, canvas.width - 8, canvas.height - 30, 28);
  ctx.fill();
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 - 3, canvas.width - 60);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, depthTest: true, depthWrite: false }),
  );
  sprite.scale.set(width, (width * canvas.height) / canvas.width, 1);
  sprite.userData.text = text;
  sprite.renderOrder = 1;
  return sprite;
}
export function disposeObject(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(),
    materials = new Set<THREE.Material>(),
    textures = new Set<THREE.Texture>();
  root.traverse((o) => {
    if (o instanceof THREE.InstancedMesh) o.dispose();
    const mesh = o as THREE.Mesh;
    if (mesh.geometry) geometries.add(mesh.geometry);
    if (mesh.material) {
      for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        materials.add(m);
        const map = (m as THREE.MeshStandardMaterial).map;
        if (map) textures.add(map);
      }
    }
  });
  for (const g of geometries) g.dispose();
  for (const t of textures) t.dispose();
  for (const m of materials) m.dispose();
}
