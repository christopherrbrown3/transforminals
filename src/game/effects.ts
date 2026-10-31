import * as THREE from 'three';
import type { ParticleShape, PowerSpec } from './powers';
interface Burst {
  mesh: THREE.InstancedMesh;
  positions: THREE.Vector3[];
  velocities: THREE.Vector3[];
  life: number;
  duration: number;
  gravity: number;
  drag: number;
}
/** A short-lived mesh driven by normalized time t from 0 to 1, then disposed. */
interface Timed {
  object: THREE.Object3D;
  life: number;
  duration: number;
  update: (t: number) => void;
}
interface SprayOptions {
  origin: THREE.Vector3;
  count: number;
  colors: number[];
  shape: ParticleShape;
  velocity: (i: number) => THREE.Vector3;
  gravity?: number;
  drag?: number;
  duration?: number;
}
function particleGeometry(shape: ParticleShape): THREE.BufferGeometry {
  switch (shape) {
    case 'ball':
      return new THREE.IcosahedronGeometry(0.1, 0);
    case 'bubble':
      return new THREE.SphereGeometry(0.13, 8, 6);
    case 'leaf':
      return new THREE.OctahedronGeometry(0.14).scale(1, 0.3, 0.6);
    case 'flake':
      return new THREE.OctahedronGeometry(0.13).scale(1, 1, 0.2);
    case 'box':
      return new THREE.BoxGeometry(0.13, 0.13, 0.13);
  }
}
/** A soft four-point star drawn in memory for space twinkles; no image file is needed. */
function twinkleTexture() {
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const u = ((x + 0.5) / size) * 2 - 1,
        v = ((y + 0.5) / size) * 2 - 1;
      const ray = (a: number, b: number) =>
        Math.max(0, 1 - Math.abs(a)) * Math.max(0, 1 - Math.abs(b) * 9);
      const glow = Math.max(0, 1 - Math.hypot(u, v) * 2.2) ** 2;
      const alpha = Math.min(1, Math.max(ray(u, v), ray(v, u)) + glow);
      data.set([255, 255, 255, Math.round(alpha * 255)], (y * size + x) * 4);
    }
  const texture = new THREE.DataTexture(data, size, size);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
interface PortalRipple {
  group: THREE.Group;
  life: number;
  duration: number;
}
export class Effects {
  private bursts: Burst[] = [];
  private ripples: PortalRipple[] = [];
  private timed: Timed[] = [];
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
    this.bursts.push({ mesh, positions, velocities, life: 0, duration: 2.2, gravity: 8, drag: 0 });
  }
  /** Power particles: leaves, snowflakes, bubbles, sand, glitter, cheese crumbs and more. */
  spray(options: SprayOptions) {
    const count = this.reduced ? Math.max(3, Math.round(options.count * 0.3)) : options.count;
    const bubble = options.shape === 'bubble';
    const mesh = new THREE.InstancedMesh(
      particleGeometry(options.shape),
      new THREE.MeshBasicMaterial({
        transparent: bubble,
        opacity: bubble ? 0.62 : 1,
        depthWrite: !bubble,
      }),
      count,
    );
    const positions: THREE.Vector3[] = [],
      velocities: THREE.Vector3[] = [];
    const tint = new THREE.Color();
    for (let i = 0; i < count; i++) {
      positions.push(options.origin.clone());
      velocities.push(options.velocity(i));
      mesh.setColorAt(i, tint.setHex(options.colors[i % options.colors.length]));
    }
    mesh.frustumCulled = false;
    this.scene.add(mesh);
    this.bursts.push({
      mesh,
      positions,
      velocities,
      life: 0,
      duration: options.duration ?? 0.9,
      gravity: options.gravity ?? 4,
      drag: options.drag ?? 1.5,
    });
  }
  /** A few particles left behind by moving powers and by animals rocketing to space. */
  trail(position: THREE.Vector3, colors: number[], shape: ParticleShape = 'box') {
    this.spray({
      origin: position,
      count: 3,
      colors,
      shape,
      velocity: () =>
        new THREE.Vector3(Math.random() - 0.5, Math.random() * 1.5, Math.random() - 0.5),
      gravity: 1,
      duration: 0.55,
    });
  }
  private animate(object: THREE.Object3D, duration: number, update: (t: number) => void) {
    this.scene.add(object);
    update(0);
    this.timed.push({ object, life: 0, duration, update });
  }
  get active() {
    return this.timed.length + this.bursts.length;
  }
  /** Plays a power's look from the player's chest height along their facing direction. */
  power(spec: PowerSpec, origin: THREE.Vector3, facing: THREE.Vector3, scale = 1) {
    const forward = facing.clone().setY(0).normalize();
    const yaw = Math.atan2(forward.x, forward.z);
    const material = (color: number, opacity = 0.8) =>
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
    const fan = (i: number, count: number, speed: number, lift = 0) => {
      const spread = THREE.MathUtils.degToRad(Math.min(spec.arc, 300));
      const angle = yaw + (count > 1 ? (i / (count - 1) - 0.5) * spread : 0);
      const jitter = 0.75 + Math.random() * 0.5;
      return new THREE.Vector3(
        Math.sin(angle) * speed * jitter,
        lift + (Math.random() - 0.3) * 1.5,
        Math.cos(angle) * speed * jitter,
      );
    };
    switch (spec.style) {
      case 'boop': {
        // A cartoon glove pops out and springs back.
        const glove = new THREE.Group();
        const fist = new THREE.Mesh(
          new THREE.SphereGeometry(0.42, 12, 10),
          material(spec.colors[0], 1),
        );
        fist.scale.set(1, 0.9, 1.15);
        const cuff = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 0.3, 0.3, 12),
          material(spec.colors[1], 1),
        );
        cuff.rotation.x = Math.PI / 2;
        cuff.position.z = -0.45;
        glove.add(fist, cuff);
        glove.rotation.y = yaw;
        this.animate(glove, 0.38, (t) => {
          glove.position.copy(origin).addScaledVector(forward, 0.7 + Math.sin(t * Math.PI) * 2.3);
          glove.scale.setScalar(scale * (0.6 + Math.sin(t * Math.PI) * 0.6));
        });
        this.spray({
          origin: origin.clone().addScaledVector(forward, 2.4),
          count: 14,
          colors: [spec.colors[2], 0xffffff],
          shape: 'box',
          velocity: (i) => fan(i, 14, 5, 2),
        });
        break;
      }
      case 'trail':
        this.spray({
          origin,
          count: 16,
          colors: spec.colors,
          shape: spec.particle,
          velocity: () =>
            forward
              .clone()
              .multiplyScalar(-3 - Math.random() * 2)
              .add(new THREE.Vector3(Math.random() - 0.5, Math.random() * 2, Math.random() - 0.5)),
        });
        break;
      case 'cone':
        this.spray({
          origin,
          count: 30,
          colors: spec.colors,
          shape: spec.particle,
          velocity: (i) => fan(i, 30, spec.reach * 1.6),
          gravity: spec.particle === 'bubble' ? -1.5 : spec.particle === 'ball' ? 3 : 1,
          drag: 1.8,
          duration: 1,
        });
        break;
      case 'rings':
        for (let i = 0; i < (this.reduced ? 1 : 3); i++) {
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(1, 0.07, 6, 32),
            material(spec.colors[i % spec.colors.length]),
          );
          ring.rotation.y = yaw;
          const width = Math.tan(THREE.MathUtils.degToRad(spec.arc / 2)) * spec.reach;
          this.animate(ring, 0.75, (t) => {
            const u = THREE.MathUtils.clamp(t * 1.35 - i * 0.18, 0, 1);
            ring.visible = t * 1.35 >= i * 0.18;
            ring.position.copy(origin).addScaledVector(forward, 0.8 + u * spec.reach);
            ring.scale.setScalar(Math.max(0.01, 0.5 + u * width));
            (ring.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - u);
          });
        }
        break;
      case 'beam': {
        const beam = new THREE.Mesh(
          new THREE.CylinderGeometry(0.22, 0.32, 1, 10).rotateX(Math.PI / 2).translate(0, 0, 0.5),
          material(spec.colors[0], 0.9),
        );
        beam.rotation.y = yaw;
        beam.position.copy(origin);
        this.animate(beam, 0.42, (t) => {
          beam.scale.set(1 - t * 0.8, 1 - t * 0.8, spec.reach * Math.min(1, t * 6));
        });
        this.spray({
          origin: origin.clone().addScaledVector(forward, spec.reach * 0.8),
          count: 18,
          colors: spec.colors,
          shape: 'box',
          velocity: () =>
            new THREE.Vector3(
              (Math.random() - 0.5) * 6,
              Math.random() * 5,
              (Math.random() - 0.5) * 6,
            ),
        });
        break;
      }
      case 'shockwave':
      case 'geyser': {
        const ground = origin.clone().setY(0.15);
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(1, 0.12, 6, 40),
          material(spec.colors[0]),
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.copy(ground);
        this.animate(ring, 0.6, (t) => {
          ring.scale.setScalar(0.4 + t * spec.reach);
          (ring.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - t);
        });
        this.spray({
          origin: ground.clone().setY(0.4),
          count: 34,
          colors: spec.colors,
          shape: spec.particle,
          velocity: (i) => {
            const a = (i / 34) * Math.PI * 2;
            return new THREE.Vector3(
              Math.sin(a) * spec.reach * 1.4,
              3 + Math.random() * 3,
              Math.cos(a) * spec.reach * 1.4,
            );
          },
          gravity: 9,
          drag: 1.2,
        });
        if (spec.style === 'geyser') {
          const column = new THREE.Mesh(
            new THREE.CylinderGeometry(0.55, 0.9, 1, 12).translate(0, 0.5, 0),
            material(spec.colors[0], 0.7),
          );
          column.position.copy(ground);
          this.animate(column, 0.9, (t) => {
            column.scale.set(
              1 - t * 0.6,
              Math.max(0.01, Math.sin(Math.min(1, t * 1.4) * Math.PI) * 7 * scale),
              1 - t * 0.6,
            );
          });
          this.spray({
            origin: ground.clone().setY(5 * scale),
            count: 24,
            colors: [0xffffff, spec.colors[0]],
            shape: 'bubble',
            velocity: () =>
              new THREE.Vector3(
                (Math.random() - 0.5) * 7,
                4 + Math.random() * 4,
                (Math.random() - 0.5) * 7,
              ),
            gravity: 9,
            duration: 1.1,
          });
        }
        break;
      }
      case 'swing': {
        // A leafy arc sweeps across the front, like a neck swinging side to side.
        const arc = THREE.MathUtils.degToRad(spec.arc);
        const sweep = new THREE.Mesh(
          new THREE.TorusGeometry(spec.reach * 0.75, 0.12, 6, 24, arc),
          material(spec.colors[0]),
        );
        sweep.rotation.set(-Math.PI / 2, 0, yaw - Math.PI / 2 - arc / 2);
        sweep.position.copy(origin);
        this.animate(sweep, 0.5, (t) => {
          sweep.scale.setScalar(0.6 + t * 0.5);
          (sweep.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - t);
        });
        this.spray({
          origin,
          count: 26,
          colors: spec.colors,
          shape: spec.particle,
          velocity: (i) => fan(i, 26, spec.reach * 1.5, 1.5),
          gravity: 2,
        });
        break;
      }
    }
  }
  /** A warm glow that rides along with an animal on its way to space. */
  comet(target: THREE.Object3D, duration: number) {
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: twinkleTexture(),
        color: 0xffe7a3,
        transparent: true,
        depthWrite: false,
        fog: false,
      }),
    );
    glow.renderOrder = 2;
    this.animate(glow, duration, (t) => {
      glow.position.copy(target.position).add(new THREE.Vector3(0, 0.5, 0));
      glow.scale.setScalar(2.4 + Math.sin(t * 40) * 0.4);
      glow.material.rotation = t * 6;
    });
  }
  /** The cartoon "ding" sparkle where a launched animal disappears into space. */
  twinkle(position: THREE.Vector3) {
    const star = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: twinkleTexture(),
        color: 0xfff1b8,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        fog: false,
      }),
    );
    star.position.copy(position);
    star.renderOrder = 3;
    this.animate(star, 0.9, (t) => {
      star.scale.setScalar(0.01 + Math.sin(t * Math.PI) * 12);
      star.material.rotation = t * 2.5;
    });
  }
  tick(dt: number) {
    this.timed = this.timed.filter((item) => {
      item.life += dt;
      const t = Math.min(1, item.life / item.duration);
      item.update(t);
      if (t < 1) return true;
      this.scene.remove(item.object);
      disposeObject(item.object);
      return false;
    });
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
        b.velocities[i].y -= b.gravity * dt;
        if (b.drag) b.velocities[i].multiplyScalar(Math.max(0, 1 - b.drag * dt));
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
    for (const item of this.timed) {
      this.scene.remove(item.object);
      disposeObject(item.object);
    }
    this.timed = [];
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
    new THREE.SpriteMaterial({ map: tex, depthTest: !prominent, depthWrite: false }),
  );
  sprite.scale.set(width, (width * canvas.height) / canvas.width, 1);
  sprite.userData.text = text;
  sprite.renderOrder = prominent ? 2 : 1;
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
