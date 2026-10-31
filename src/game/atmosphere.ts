import * as THREE from 'three';

/**
 * Region atmosphere: a graded sky, fogged toy silhouettes beyond the playable disc, drifting
 * clouds, ambient motes and underwater light shafts. Nothing here collides or sits inside the
 * playable radius, so gameplay geometry and the world colliders stay unchanged.
 */
export interface Atmosphere {
  group: THREE.Group;
  /** Horizon haze. Fog and the clear color use it so distant scenery melts into the sky. */
  horizon: number;
  hemisphere: { sky: number; ground: number; intensity: number };
  sun: { color: number; intensity: number };
  tick(time: number, camera: THREE.Camera, reduced: boolean): void;
  /** Sheds clouds, shafts and motes when the device cannot hold its frame rate. */
  setLite(lite: boolean): void;
}

type Range = [number, number];
type SilhouetteKind =
  'hills' | 'peaks' | 'mesas' | 'towers' | 'spires' | 'trees' | 'pines' | 'isles';
interface Layer {
  kind: SilhouetteKind;
  colors: number[];
  count: number;
  radius: Range;
  width: Range;
  height: Range;
  /** Base height. Below zero lets lowland shapes rise from behind the diorama rim. */
  base?: number;
  /** Extra random height above the base, for shapes that float. */
  lift?: Range;
  /** Snowcaps, rooftops, island turf or canopy color, depending on the kind. */
  accent?: number;
  glow?: boolean;
}
interface MoteStyle {
  colors: number[];
  count: number;
  size: number;
  velocity: [number, number, number];
  sway: number;
  height: Range;
  additive?: boolean;
}
interface AtmosphereStyle {
  zenith: number;
  horizon: number;
  /** Soft brighter band just above the visible horizon. */
  haze: number;
  hemisphere: [sky: number, ground: number, intensity: number];
  sun: [color: number, intensity: number];
  /** Lowland ring around the diorama; omitted for the floating Rift. */
  floor?: { color: number; y: number };
  layers: Layer[];
  clouds?: number;
  stars?: number;
  shafts?: number;
  motes?: MoteStyle;
}

export const ATMOSPHERES: Record<string, AtmosphereStyle> = {
  meadow: {
    zenith: 0x6fbfe4,
    horizon: 0xd3eedf,
    haze: 0xf4f6dc,
    hemisphere: [0xeef6ff, 0x6b7f5a, 1.35],
    sun: [0xfff6e6, 2.9],
    floor: { color: 0x93c47c, y: -2.6 },
    layers: [
      {
        kind: 'hills',
        colors: [0x7fb36f, 0x8cbf78, 0x74aa6a],
        count: 18,
        radius: [56, 70],
        width: [11, 19],
        height: [4, 8],
        base: -3,
      },
      {
        kind: 'trees',
        colors: [0x5f9c69, 0x6daa6c],
        count: 34,
        radius: [49, 58],
        width: [2.2, 3.4],
        height: [3.5, 5.5],
        base: -2.6,
        accent: 0x8b6b4d,
      },
      {
        kind: 'hills',
        colors: [0x86b49a, 0x93bfa3],
        count: 14,
        radius: [82, 100],
        width: [20, 32],
        height: [9, 15],
        base: -3,
      },
    ],
    clouds: 0xffffff,
    motes: {
      colors: [0xfff3b8, 0xffffff, 0xffe2a8],
      count: 70,
      size: 0.15,
      velocity: [0.32, 0.04, 0.12],
      sway: 0.7,
      height: [0.4, 5],
    },
  },
  winter: {
    zenith: 0x7fb0d6,
    horizon: 0xdbe9f1,
    haze: 0xf6fbff,
    hemisphere: [0xf1f7ff, 0x8a9aa8, 1.35],
    sun: [0xfffaf2, 2.7],
    floor: { color: 0xe3edf2, y: -2.6 },
    layers: [
      {
        kind: 'hills',
        colors: [0xeef4f7, 0xe2ecf1],
        count: 16,
        radius: [54, 66],
        width: [10, 17],
        height: [3, 6],
        base: -3,
      },
      {
        kind: 'pines',
        colors: [0x6f9ea6, 0x5f8f99],
        count: 30,
        radius: [49, 60],
        width: [2, 3],
        height: [4.5, 7],
        base: -2.6,
        accent: 0xf3f7f2,
      },
      {
        kind: 'peaks',
        colors: [0xa9c4d6, 0x9db9cd, 0xb6cfdd],
        count: 13,
        radius: [76, 100],
        width: [14, 24],
        height: [16, 28],
        base: -4,
        accent: 0xf7fbff,
      },
    ],
    clouds: 0xffffff,
    motes: {
      colors: [0xffffff, 0xf2f8ff],
      count: 210,
      size: 0.2,
      velocity: [0.2, -1.05, 0.08],
      sway: 0.55,
      height: [-0.2, 11],
    },
  },
  savannah: {
    zenith: 0x92c9da,
    horizon: 0xf5e2b5,
    haze: 0xfff1cf,
    hemisphere: [0xfff8ea, 0x8a8060, 1.3],
    sun: [0xfff3e0, 2.85],
    floor: { color: 0xcfc078, y: -2.6 },
    layers: [
      {
        kind: 'hills',
        colors: [0xc6b96d, 0xbeae64],
        count: 14,
        radius: [55, 68],
        width: [12, 20],
        height: [2.5, 5],
        base: -3,
      },
      {
        kind: 'trees',
        colors: [0x8e9a53, 0x9aa55c],
        count: 16,
        radius: [50, 60],
        width: [4.2, 6],
        height: [3.5, 5],
        base: -2.6,
        accent: 0x7e6243,
      },
      {
        kind: 'mesas',
        colors: [0xd3a971, 0xc8995f],
        count: 11,
        radius: [78, 100],
        width: [9, 18],
        height: [6, 11],
        base: -3,
      },
    ],
    clouds: 0xfffaf0,
    motes: {
      colors: [0xfff0c4, 0xffe6a8],
      count: 55,
      size: 0.12,
      velocity: [0.45, 0.03, 0.05],
      sway: 0.4,
      height: [0.3, 4],
    },
  },
  desert: {
    zenith: 0x8fcbe0,
    horizon: 0xf6e1bb,
    haze: 0xfff3d6,
    hemisphere: [0xfffaf0, 0x9a8a6c, 1.3],
    sun: [0xfff4e4, 2.85],
    floor: { color: 0xe6c88f, y: -2.6 },
    layers: [
      {
        kind: 'hills',
        colors: [0xebcb8e, 0xe1bd80, 0xf0d39c],
        count: 18,
        radius: [53, 68],
        width: [13, 22],
        height: [3, 6],
        base: -3,
      },
      {
        kind: 'mesas',
        colors: [0xd09f6b, 0xc48f60, 0xd9ad79],
        count: 12,
        radius: [76, 100],
        width: [8, 16],
        height: [8, 16],
        base: -3,
      },
    ],
    clouds: 0xfffaf0,
    motes: {
      colors: [0xfff7da, 0xffe9bd],
      count: 45,
      size: 0.11,
      velocity: [0.6, 0.02, 0.1],
      sway: 0.35,
      height: [0.2, 3],
    },
  },
  beach: {
    zenith: 0x5fbfe2,
    horizon: 0xd0f0f2,
    haze: 0xf2fbf4,
    hemisphere: [0xf0fbff, 0x9a937c, 1.3],
    sun: [0xfff8ea, 2.9],
    // Continues the offshore water already drawn around the bay.
    floor: { color: 0x4caec7, y: -0.14 },
    layers: [
      {
        kind: 'isles',
        colors: [0xe8d8a8],
        count: 6,
        radius: [72, 96],
        width: [6, 11],
        height: [1.5, 3],
        base: -0.6,
        accent: 0x74ac86,
      },
      {
        kind: 'trees',
        colors: [0x74ac86],
        count: 9,
        radius: [72, 96],
        width: [2, 3],
        height: [3, 4.5],
        base: 0,
        accent: 0x9b7957,
      },
    ],
    clouds: 0xffffff,
  },
  ocean: {
    zenith: 0x9bdcd8,
    horizon: 0x5b9db2,
    haze: 0x74b6c2,
    hemisphere: [0xe2fbf8, 0x5a8590, 1.6],
    sun: [0xeefff9, 2.5],
    floor: { color: 0x7eb6ad, y: -2.6 },
    layers: [
      {
        kind: 'hills',
        colors: [0x6c9fa6, 0x7aaaa7],
        count: 16,
        radius: [54, 68],
        width: [9, 16],
        height: [3, 7],
        base: -3,
      },
      {
        kind: 'spires',
        colors: [0x4f9384, 0x5c9f86, 0x6aa98a],
        count: 40,
        radius: [48, 62],
        width: [0.7, 1.3],
        height: [6, 12],
        base: -2.6,
      },
      {
        kind: 'towers',
        colors: [0x9fc6bc, 0x8fbab2],
        count: 7,
        radius: [78, 96],
        width: [2.5, 4],
        height: [10, 16],
        base: -3,
        accent: 0xb8d6c8,
      },
    ],
    shafts: 0xe2fff4,
    motes: {
      colors: [0xe7fff8, 0xc6efe6, 0xffffff],
      count: 120,
      size: 0.13,
      velocity: [0.05, 0.42, 0.02],
      sway: 0.35,
      height: [0, 10],
    },
  },
  volcano: {
    zenith: 0x8a7aa8,
    horizon: 0xe6b4a4,
    haze: 0xffcfb0,
    hemisphere: [0xfff2ee, 0x5e5463, 1.35],
    sun: [0xfff0e4, 2.8],
    floor: { color: 0x5e586c, y: -2.6 },
    layers: [
      {
        kind: 'spires',
        colors: [0x5a566d, 0x635d74],
        count: 22,
        radius: [50, 62],
        width: [1.6, 3],
        height: [5, 10],
        base: -2.6,
      },
      {
        kind: 'peaks',
        colors: [0x5b566e, 0x4f4b63, 0x66607a],
        count: 12,
        radius: [72, 98],
        width: [16, 26],
        height: [15, 26],
        base: -4,
        accent: 0xffa978,
        glow: true,
      },
    ],
    motes: {
      colors: [0xffb468, 0xff9152, 0xffd08a],
      count: 85,
      size: 0.16,
      velocity: [0.12, 0.75, 0.05],
      sway: 0.45,
      height: [0, 9],
    },
  },
  underground: {
    zenith: 0x40465f,
    horizon: 0x737995,
    haze: 0x828aa6,
    hemisphere: [0xe6e9f8, 0x575b72, 1.55],
    sun: [0xf6f2ff, 2.4],
    floor: { color: 0x474b62, y: -2.6 },
    layers: [
      {
        kind: 'spires',
        colors: [0x5d627e, 0x686d89, 0x555a74],
        count: 60,
        radius: [47, 64],
        width: [2, 4.5],
        height: [8, 20],
        base: -2.6,
      },
      {
        kind: 'spires',
        colors: [0xa4dce0, 0xcdb3ed],
        count: 18,
        radius: [47, 56],
        width: [0.6, 1.1],
        height: [1.5, 3],
        base: -0.4,
        glow: true,
      },
      {
        kind: 'spires',
        colors: [0x4b5069, 0x52576f],
        count: 26,
        radius: [70, 92],
        width: [6, 10],
        height: [20, 32],
        base: -3,
      },
    ],
    shafts: 0xf1ead2,
    motes: {
      colors: [0xd7f8c8, 0xa9f1e2, 0xe6d6ff],
      count: 55,
      size: 0.17,
      velocity: [0.05, 0.05, 0.03],
      sway: 1.3,
      height: [0.4, 4],
      additive: true,
    },
  },
  rifts: {
    zenith: 0x37336c,
    horizon: 0xb4a3d4,
    haze: 0xd7c4ec,
    hemisphere: [0xf3ecff, 0x625c7c, 1.4],
    sun: [0xfcf4ff, 2.7],
    layers: [
      {
        kind: 'isles',
        colors: [0x7f7697, 0x8a81a2, 0x9488ae],
        count: 14,
        radius: [54, 92],
        width: [5, 12],
        height: [5, 10],
        base: -3,
        lift: [0, 9],
        accent: 0xc3b1d6,
      },
      {
        kind: 'spires',
        colors: [0x6c6383, 0x5f5878],
        count: 16,
        radius: [60, 100],
        width: [2, 3.5],
        height: [12, 26],
        base: -14,
        lift: [0, 6],
      },
    ],
    stars: 0xfff6ff,
    motes: {
      colors: [0xf3c4ff, 0x8fe8d2, 0xffe08f],
      count: 90,
      size: 0.18,
      velocity: [0.03, 0.18, 0.04],
      sway: 0.9,
      height: [0.3, 7],
    },
  },
  city: {
    zenith: 0x79bde0,
    horizon: 0xd6eae5,
    haze: 0xf4f6e6,
    hemisphere: [0xf0f8ff, 0x768a86, 1.35],
    sun: [0xfff6ea, 2.9],
    floor: { color: 0xa5bdb3, y: -2.6 },
    layers: [
      {
        kind: 'trees',
        colors: [0x74a883, 0x81b38a],
        count: 22,
        radius: [49, 56],
        width: [2.2, 3.2],
        height: [3, 4.5],
        base: -2.6,
        accent: 0x8b6b4d,
      },
      {
        kind: 'towers',
        colors: [0xa9c3cb, 0xd9c0b0, 0xcfcba5, 0xb3b9d0],
        count: 22,
        radius: [58, 74],
        width: [4, 7],
        height: [7, 17],
        base: -2.6,
        accent: 0xe8dfc4,
      },
      {
        kind: 'towers',
        colors: [0xa7bcc6, 0xbdb5c8, 0xc2c8b4],
        count: 22,
        radius: [84, 104],
        width: [5, 9],
        height: [14, 30],
        base: -3,
        accent: 0xd8d9cf,
      },
    ],
    clouds: 0xffffff,
  },
};

const srgb = (hex: number) =>
  new THREE.Vector3(((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255);

// Colors arrive already sRGB-encoded so the horizon matches the fog and clear colors exactly.
const skyShader = {
  vertexShader: /* glsl */ `
    varying vec3 vDirection;
    void main() {
      vDirection = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      // Pin to the far plane: drawn after the opaque world, only uncovered pixels run the shader.
      gl_Position.z = gl_Position.w;
    }`,
  fragmentShader: /* glsl */ `
    uniform vec3 zenith;
    uniform vec3 horizon;
    uniform vec3 haze;
    varying vec3 vDirection;
    void main() {
      // The play camera looks down, so the visible sky band sits just below eye level.
      float e = normalize(vDirection).y;
      vec3 color = mix(horizon, mix(horizon, zenith, 0.6), smoothstep(-0.22, 0.02, e));
      color = mix(color, zenith, smoothstep(0.0, 0.5, e));
      color = mix(color, haze, exp(-pow((e + 0.17) / 0.06, 2.0)) * 0.35);
      float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
      gl_FragColor = vec4(color + (grain - 0.5) / 255.0, 1.0);
    }`,
};

const shaftShader = {
  vertexShader: /* glsl */ `
    uniform float time;
    varying vec2 vUv;
    varying float vPulse;
    void main() {
      vUv = uv;
      vec4 local = vec4(position, 1.0);
      float phase = 0.0;
      #ifdef USE_INSTANCING
        local = instanceMatrix * local;
        phase = instanceMatrix[3].x * 0.37 + instanceMatrix[3].z * 0.21;
      #endif
      vPulse = 0.65 + 0.35 * sin(time * 0.6 + phase);
      gl_Position = projectionMatrix * modelViewMatrix * local;
    }`,
  fragmentShader: /* glsl */ `
    uniform vec3 color;
    uniform float opacity;
    varying vec2 vUv;
    varying float vPulse;
    void main() {
      float across = pow(1.0 - abs(vUv.x * 2.0 - 1.0), 1.6);
      float down = smoothstep(0.0, 0.55, vUv.y) * (0.45 + 0.55 * vUv.y);
      gl_FragColor = vec4(color * across * down * vPulse * opacity, 1.0);
    }`,
};

function seeded(id: string) {
  let seed = [...id].reduce((n, ch) => n * 37 + ch.charCodeAt(0), 977) >>> 0;
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

/** A soft round sprite generated in memory, so motes need no image file or DOM canvas. */
function dotTexture() {
  const size = 32;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x + 0.5 - size / 2, y + 0.5 - size / 2) / (size / 2);
      const a = Math.max(0, 1 - d) ** 1.7;
      data.set([255, 255, 255, Math.round(a * 255)], (y * size + x) * 4);
    }
  const texture = new THREE.DataTexture(data, size, size);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

type Shape = 'dome' | 'cone' | 'butte' | 'block' | 'puff' | 'keel';
function shapeGeometry(shape: Shape): THREE.BufferGeometry {
  // Every silhouette has its base at y=0 so stamps can share one placement rule.
  switch (shape) {
    case 'dome':
      return new THREE.SphereGeometry(1, 9, 5, 0, Math.PI * 2, 0, Math.PI / 2);
    case 'cone':
      return new THREE.ConeGeometry(1, 1, 6).translate(0, 0.5, 0);
    case 'butte':
      return new THREE.CylinderGeometry(0.82, 1, 1, 7).translate(0, 0.5, 0);
    case 'block':
      return new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
    case 'puff':
      return new THREE.IcosahedronGeometry(1, 1);
    case 'keel':
      return new THREE.ConeGeometry(1, 1, 6).rotateX(Math.PI).translate(0, -0.5, 0);
  }
}

export function buildAtmosphere(id: string): Atmosphere {
  const style = ATMOSPHERES[id] ?? ATMOSPHERES.meadow;
  const random = seeded(id);
  const between = ([a, b]: Range) => a + random() * (b - a);
  const group = new THREE.Group();
  group.name = `atmosphere:${id}`;

  // The sky dome travels with the camera and fills only what the region leaves uncovered.
  const sky = new THREE.Group();
  sky.name = 'sky';
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(140, 32, 16),
    new THREE.ShaderMaterial({
      ...skyShader,
      uniforms: {
        zenith: { value: srgb(style.zenith) },
        horizon: { value: srgb(style.horizon) },
        haze: { value: srgb(style.haze) },
      },
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    }),
  );
  dome.name = 'sky-dome';
  dome.renderOrder = 3;
  dome.frustumCulled = false;
  sky.add(dome);
  if (style.stars) {
    const points: number[] = [];
    for (let i = 0; i < 260; i++) {
      const y = random() * 1.3 - 0.45,
        a = random() * Math.PI * 2,
        r = Math.sqrt(1 - Math.min(1, y * y));
      points.push(Math.cos(a) * r * 130, y * 130, Math.sin(a) * r * 130);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    const stars = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: style.stars,
        size: 2.4,
        sizeAttenuation: false,
        map: dotTexture(),
        transparent: true,
        depthWrite: false,
        fog: false,
      }),
    );
    stars.name = 'stars';
    stars.renderOrder = -1;
    stars.frustumCulled = false;
    sky.add(stars);
  }
  group.add(sky);

  if (style.floor) {
    // Uniform vertex colors let the lowland reuse the ground's shader program.
    const ring = new THREE.RingGeometry(42, 165, 72, 1);
    const shade = new THREE.Color(style.floor.color);
    ring.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(
        Array.from({ length: ring.getAttribute('position').count }, () => shade.toArray()).flat(),
        3,
      ),
    );
    const floor = new THREE.Mesh(ring, new THREE.MeshLambertMaterial({ vertexColors: true }));
    floor.name = 'lowland';
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = style.floor.y;
    // Distant layers draw after the region so the depth test skips what the disc hides.
    floor.renderOrder = 1;
    group.add(floor);
  }

  // Distant silhouettes share one batch per shape, colored per instance, with flat facets.
  // Matte Lambert shading looks the same at this distance and costs less per pixel.
  // Glowing accents keep their own batch because emission comes from the material.
  const buckets = new Map<
    string,
    { shape: Shape; glow?: number; items: Array<{ matrix: THREE.Matrix4; color: number }> }
  >();
  const quaternion = new THREE.Quaternion();
  const put = (
    shape: Shape,
    color: number,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    yaw: number,
    glow = false,
  ) => {
    const key = glow ? `${shape}:${color}` : shape;
    if (!buckets.has(key)) buckets.set(key, { shape, glow: glow ? color : undefined, items: [] });
    quaternion.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, yaw);
    buckets.get(key)!.items.push({
      matrix: new THREE.Matrix4().compose(
        new THREE.Vector3(x, y, z),
        quaternion,
        new THREE.Vector3(w, h, d),
      ),
      color,
    });
  };
  for (const layer of style.layers) {
    for (let i = 0; i < layer.count; i++) {
      // Even angular spacing with jitter keeps every viewing direction dressed.
      const angle = ((i + random() * 0.8) / layer.count) * Math.PI * 2;
      const r = between(layer.radius);
      const x = Math.sin(angle) * r,
        z = Math.cos(angle) * r;
      const w = between(layer.width),
        h = between(layer.height),
        yaw = random() * Math.PI;
      const color = layer.colors[i % layer.colors.length];
      const y = (layer.base ?? 0) + (layer.lift ? between(layer.lift) : 0);
      const glow = Boolean(layer.glow);
      switch (layer.kind) {
        case 'hills':
          put('dome', color, x, y, z, w, h, w * (0.6 + random() * 0.3), yaw);
          break;
        case 'peaks':
          put('cone', color, x, y, z, w, h, w * 0.9, yaw);
          if (layer.accent)
            put('cone', layer.accent, x, y + h * 0.62, z, w * 0.4, h * 0.4, w * 0.36, yaw, glow);
          break;
        case 'mesas':
          put('butte', color, x, y, z, w, h, w * 0.75, yaw);
          put('butte', layer.accent ?? color, x, y + h, z, w * 0.84, 0.25, w * 0.63, yaw);
          break;
        case 'towers':
          put('block', color, x, y, z, w, h, w * 0.85, yaw);
          if (layer.accent) put('block', layer.accent, x, y + h, z, w * 1.08, 0.4, w * 0.93, yaw);
          break;
        case 'spires':
          put('cone', color, x, y, z, w, h, w, yaw, glow);
          break;
        case 'trees':
          if (layer.accent) put('block', layer.accent, x, y, z, w * 0.18, h * 0.6, w * 0.18, yaw);
          put('puff', color, x, y + h * 0.7, z, w * 0.55, h * 0.32, w * 0.5, yaw);
          break;
        case 'pines':
          for (let k = 0; k < 3; k++)
            put(
              'cone',
              color,
              x,
              y + h * (0.22 + k * 0.22),
              z,
              w * (0.62 - k * 0.14),
              h * 0.42,
              w * (0.62 - k * 0.14),
              yaw,
            );
          if (layer.accent)
            put('cone', layer.accent, x, y + h * 0.78, z, w * 0.24, h * 0.22, w * 0.24, yaw);
          break;
        case 'isles':
          put('keel', color, x, y, z, w * 0.62, h, w * 0.55, yaw);
          put(
            'dome',
            layer.accent ?? color,
            x,
            y,
            z,
            w * 0.66,
            Math.max(0.5, h * 0.12),
            w * 0.6,
            yaw,
          );
          break;
      }
    }
  }
  const geometries = new Map<Shape, THREE.BufferGeometry>();
  const tint = new THREE.Color();
  for (const bucket of buckets.values()) {
    if (!geometries.has(bucket.shape)) geometries.set(bucket.shape, shapeGeometry(bucket.shape));
    const mesh = new THREE.InstancedMesh(
      geometries.get(bucket.shape)!.clone(),
      new THREE.MeshLambertMaterial({
        flatShading: true,
        emissive: bucket.glow ?? 0,
        emissiveIntensity: bucket.glow === undefined ? 0 : 0.55,
      }),
      bucket.items.length,
    );
    mesh.name = `backdrop:${bucket.shape}`;
    bucket.items.forEach(({ matrix, color }, i) => {
      mesh.setMatrixAt(i, matrix);
      mesh.setColorAt(i, tint.setHex(color));
    });
    mesh.computeBoundingSphere();
    mesh.renderOrder = 1;
    group.add(mesh);
  }
  geometries.forEach((g) => g.dispose());

  // Chunky faceted clouds circle the diorama slowly, low enough to show in the play view.
  // They match the silhouette batches' material setup so both share one shader program.
  let clouds: THREE.InstancedMesh | undefined;
  if (style.clouds !== undefined) {
    const puffs: THREE.Matrix4[] = [];
    const cloudCount = 11;
    for (let i = 0; i < cloudCount; i++) {
      const angle = ((i + random() * 0.6) / cloudCount) * Math.PI * 2;
      const r = between([54, 74]),
        cy = between([7, 13]),
        size = between([2.2, 3.6]);
      const cx = Math.sin(angle) * r,
        cz = Math.cos(angle) * r;
      const along = new THREE.Vector3(Math.cos(angle), 0, -Math.sin(angle));
      for (const [offset, lift, scale] of [
        [0, 0.35, 1],
        [-1.15, 0, 0.72],
        [1.2, 0, 0.78],
        [-0.45, 0.85, 0.66],
        [0.55, 0.7, 0.6],
      ]) {
        const s = size * scale;
        puffs.push(
          new THREE.Matrix4().compose(
            new THREE.Vector3(
              cx + along.x * offset * size,
              cy + lift * size,
              cz + along.z * offset * size,
            ),
            new THREE.Quaternion().setFromAxisAngle(THREE.Object3D.DEFAULT_UP, random() * Math.PI),
            new THREE.Vector3(s, s * 0.72, s),
          ),
        );
      }
    }
    clouds = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(1, 1),
      new THREE.MeshLambertMaterial({
        flatShading: true,
        emissive: style.clouds,
        emissiveIntensity: 0.32,
      }),
      puffs.length,
    );
    clouds.name = 'clouds';
    clouds.renderOrder = 1;
    tint.setHex(style.clouds);
    puffs.forEach((m, i) => {
      clouds!.setMatrixAt(i, m);
      clouds!.setColorAt(i, tint);
    });
    clouds.computeBoundingSphere();
    group.add(clouds);
  }

  // Additive light shafts fall through the water or the open cavern ceiling.
  let shaftMaterial: THREE.ShaderMaterial | undefined;
  let shafts: THREE.InstancedMesh | undefined;
  if (style.shafts !== undefined) {
    const spots = [
      [-14, -12],
      [12, -22],
      [-24, -26],
      [24, -4],
      [-4, -30],
      [-26, 4],
      [8, 4],
    ];
    shaftMaterial = new THREE.ShaderMaterial({
      ...shaftShader,
      uniforms: {
        color: { value: srgb(style.shafts) },
        opacity: { value: id === 'ocean' ? 0.2 : 0.12 },
        time: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      fog: false,
      toneMapped: false,
    });
    // The camera always looks north, so one slanted plane per shaft faces it.
    shafts = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0),
      shaftMaterial,
      spots.length,
    );
    shafts.name = 'light-shafts';
    const tilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0.2);
    spots.forEach(([x, z], i) => {
      const width = 2.4 + random() * 1.8;
      shafts!.setMatrixAt(
        i,
        new THREE.Matrix4().compose(
          new THREE.Vector3(x, 0, z),
          tilt,
          new THREE.Vector3(width, 17, 1),
        ),
      );
    });
    shafts.computeBoundingSphere();
    group.add(shafts);
  }

  // Ambient motes wrap within a box that follows the camera's view of the ground.
  let motes: THREE.Points | undefined;
  const span = { x: 46, z: 42 };
  const seeds: Array<{ x: number; y: number; z: number; phase: number }> = [];
  const focus = new THREE.Vector3(),
    forward = new THREE.Vector3();
  if (style.motes) {
    const m = style.motes;
    const positions = new Float32Array(m.count * 3);
    const colors = new Float32Array(m.count * 3);
    const tint = new THREE.Color();
    for (let i = 0; i < m.count; i++) {
      seeds.push({
        x: random() * span.x,
        y: between(m.height),
        z: random() * span.z,
        phase: random() * Math.PI * 2,
      });
      tint.setHex(m.colors[i % m.colors.length]);
      colors.set([tint.r, tint.g, tint.b], i * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage),
    );
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    motes = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        size: m.size * 2.4,
        map: dotTexture(),
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: m.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      }),
    );
    motes.name = 'ambient-motes';
    motes.frustumCulled = false;
    group.add(motes);
  }
  const wrap = (value: number, size: number) => ((value % size) + size) % size;
  let lite = false;

  return {
    group,
    horizon: style.horizon,
    hemisphere: {
      sky: style.hemisphere[0],
      ground: style.hemisphere[1],
      intensity: style.hemisphere[2],
    },
    sun: { color: style.sun[0], intensity: style.sun[1] },
    setLite(value) {
      lite = value;
      if (clouds) clouds.visible = !lite;
      if (shafts) shafts.visible = !lite;
      if (motes) motes.visible = !lite;
    },
    tick(time, camera, reduced) {
      sky.position.copy(camera.position);
      if (clouds && !reduced) clouds.rotation.y = time * 0.006;
      if (shaftMaterial) shaftMaterial.uniforms.time.value = reduced ? 0 : time;
      if (!motes || !style.motes) return;
      // Reduced motion removes ambient particles rather than freezing them mid-air.
      motes.visible = !reduced && !lite;
      if (!motes.visible) return;
      const m = style.motes;
      camera.getWorldDirection(forward).setY(0);
      if (forward.lengthSq() < 1e-6) forward.set(0, 0, -1);
      focus.copy(camera.position).addScaledVector(forward.normalize(), 18);
      const left = focus.x - span.x / 2,
        back = focus.z - span.z / 2,
        [low, high] = m.height;
      const position = motes.geometry.getAttribute('position') as THREE.BufferAttribute;
      seeds.forEach((s, i) => {
        const x = s.x + m.velocity[0] * time + Math.sin(time * 0.7 + s.phase) * m.sway;
        const y = s.y + m.velocity[1] * time + Math.sin(time * 0.9 + s.phase * 1.3) * m.sway * 0.4;
        const z = s.z + m.velocity[2] * time + Math.cos(time * 0.6 + s.phase) * m.sway;
        position.setXYZ(
          i,
          left + wrap(x - left, span.x),
          low + wrap(y - low, high - low),
          back + wrap(z - back, span.z),
        );
      });
      position.needsUpdate = true;
    },
  };
}
