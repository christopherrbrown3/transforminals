/** Authored open-top cave network. Geometry, discovery zones, and traversal tests share this map. */
export interface CaveRoom {
  id: string;
  name: string;
  x: number;
  z: number;
  radius: number;
  kind: 'entry' | 'rescue' | 'chamber' | 'exit' | 'secret';
  color: number;
}
export interface CaveTunnel {
  id: string;
  from: string;
  to: string;
  width: number;
  points: Array<[number, number]>;
  secret?: boolean;
}
const rooms: CaveRoom[] = [
  {
    id: 'entry',
    name: 'The Lantern Foyer',
    x: 2,
    z: 5,
    radius: 8.5,
    kind: 'entry',
    color: 0xb3b5c6,
  },
  {
    id: 'bat',
    name: 'Bat Bedtime Chamber',
    x: -7,
    z: -9,
    radius: 6.5,
    kind: 'rescue',
    color: 0xb8afc7,
  },
  {
    id: 'mushroom',
    name: 'Mushroom Parlour',
    x: -20,
    z: -2,
    radius: 7.5,
    kind: 'chamber',
    color: 0xa5bfb9,
  },
  {
    id: 'echo',
    name: 'Echo Crossing',
    x: 0,
    z: -22,
    radius: 6.5,
    kind: 'chamber',
    color: 0xb8b5cd,
  },
  {
    id: 'crystal',
    name: 'Crystal Conservatory',
    x: 19,
    z: -6,
    radius: 7.3,
    kind: 'chamber',
    color: 0xa7c0cf,
  },
  {
    id: 'crystal-nook',
    name: 'The Humming Crystal Nook',
    x: -25,
    z: 17,
    radius: 5.5,
    kind: 'secret',
    color: 0xcbb8d9,
  },
  {
    id: 'west-exit',
    name: 'West Surface Passage',
    x: -28,
    z: -30,
    radius: 4.8,
    kind: 'exit',
    color: 0xc2cbbf,
  },
  {
    id: 'north-exit',
    name: 'North Surface Passage',
    x: 0,
    z: -38,
    radius: 4.8,
    kind: 'exit',
    color: 0xc2cbbf,
  },
  {
    id: 'east-exit',
    name: 'East Surface Passage',
    x: 28,
    z: -30,
    radius: 4.8,
    kind: 'exit',
    color: 0xc2cbbf,
  },
];
const tunnels: CaveTunnel[] = [
  {
    id: 'first-rescue',
    from: 'entry',
    to: 'bat',
    width: 6.5,
    points: [
      [2, 5],
      [-7, -9],
    ],
  },
  {
    id: 'lantern-walk',
    from: 'entry',
    to: 'crystal',
    width: 6.5,
    points: [
      [2, 5],
      [10, 5],
      [19, -6],
    ],
  },
  {
    id: 'mushroom-walk',
    from: 'bat',
    to: 'mushroom',
    width: 6,
    points: [
      [-7, -9],
      [-20, -2],
    ],
  },
  {
    id: 'echo-walk',
    from: 'bat',
    to: 'echo',
    width: 6,
    points: [
      [-7, -9],
      [-5, -16],
      [0, -22],
    ],
  },
  {
    id: 'western-passage',
    from: 'echo',
    to: 'west-exit',
    width: 6.5,
    points: [
      [0, -22],
      [-14, -25],
      [-22, -30],
      [-28, -30],
    ],
  },
  {
    id: 'northern-passage',
    from: 'echo',
    to: 'north-exit',
    width: 6.5,
    points: [
      [0, -22],
      [0, -38],
    ],
  },
  {
    id: 'crystal-walk',
    from: 'echo',
    to: 'crystal',
    width: 6.5,
    points: [
      [0, -22],
      [12, -20],
      [19, -13],
      [19, -6],
    ],
  },
  {
    id: 'eastern-passage',
    from: 'crystal',
    to: 'east-exit',
    width: 6.5,
    points: [
      [19, -6],
      [28, -14],
      [28, -30],
    ],
  },
  {
    id: 'secret-passage',
    from: 'mushroom',
    to: 'crystal-nook',
    width: 5.4,
    points: [
      [-20, -2],
      [-28, 6],
      [-28, 13],
      [-25, 17],
    ],
    secret: true,
  },
];
export const CAVE_LAYOUT = {
  tileSize: 2,
  rooms,
  tunnels,
  secret: { id: 'crystal-nook', name: 'The Humming Crystal Nook', x: -25, z: 17, radius: 3.5 },
  exits: rooms.filter((room) => room.kind === 'exit').map(({ id, x, z }) => ({ id, x, z })),
  /** Narrow decorative arch frames, never ceilings over an entire chamber. */
  arches: [
    { x: -2.5, z: -2, width: 6.5, yaw: Math.atan2(-9, -14) },
    { x: 10, z: 5, width: 6.5, yaw: Math.atan2(9, -11) },
    { x: -13.5, z: -5.5, width: 6, yaw: Math.atan2(-13, 7) },
    { x: -4.2, z: -17, width: 6, yaw: Math.atan2(5, -6) },
    { x: -15, z: -25.6, width: 6.5, yaw: Math.atan2(-8, -5) },
    { x: 0, z: -30, width: 6.5, yaw: 0 },
    { x: 28, z: -22, width: 6.5, yaw: 0 },
    { x: -28, z: 9, width: 5.4, yaw: 0, secret: true },
  ],
};

function segmentDistance(x: number, z: number, a: [number, number], b: [number, number]) {
  const dx = b[0] - a[0],
    dz = b[1] - a[1];
  const t = Math.max(
    0,
    Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1)),
  );
  return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t);
}

/** Geometric walkable envelope; positive padding leaves room for a body or a prop. */
export function isCaveWalkable(x: number, z: number, padding = 0): boolean {
  if (Math.hypot(x, z) > 42.2 - padding) return false;
  return (
    rooms.some((room) => Math.hypot(x - room.x, z - room.z) <= room.radius - padding) ||
    tunnels.some((tunnel) =>
      tunnel.points
        .slice(1)
        .some(
          (point, i) =>
            segmentDistance(x, z, tunnel.points[i], point) <= tunnel.width / 2 - padding,
        ),
    )
  );
}

export interface CaveFloorTile {
  x: number;
  z: number;
  color: number;
}
export interface CaveWallTile {
  x: number;
  z: number;
  radius: number;
  height: number;
}
export function buildCaveFloorplan(): { floorTiles: CaveFloorTile[]; wallTiles: CaveWallTile[] } {
  const floorTiles: CaveFloorTile[] = [];
  const floor = new Set<string>();
  for (let x = -42; x <= 42; x += CAVE_LAYOUT.tileSize) {
    for (let z = -42; z <= 42; z += CAVE_LAYOUT.tileSize) {
      if (!isCaveWalkable(x, z)) continue;
      floor.add(`${x},${z}`);
      const room = rooms.find((room) => Math.hypot(x - room.x, z - room.z) <= room.radius);
      floorTiles.push({ x, z, color: room?.color ?? 0xa5a6bd });
    }
  }
  const walls = new Map<string, CaveWallTile>();
  for (const tile of floorTiles) {
    for (const [dx, dz] of [
      [2, 0],
      [-2, 0],
      [0, 2],
      [0, -2],
    ]) {
      const x = tile.x + dx,
        z = tile.z + dz,
        key = `${x},${z}`;
      if (floor.has(key) || walls.has(key)) continue;
      const variation = Math.abs(x * 17 + z * 31) % 4;
      walls.set(key, { x, z, radius: 1.45, height: 2.8 + variation * 0.18 });
    }
  }
  return { floorTiles, wallTiles: [...walls.values()] };
}

/** Preserve valid positions; rescue legacy saves from the new walls or closed rock areas. */
export function nearestCaveWalkable(x: number, z: number, padding = 0.4): { x: number; z: number } {
  const { floorTiles, wallTiles } = buildCaveFloorplan();
  const clear = (px: number, pz: number) =>
    isCaveWalkable(px, pz, padding) &&
    wallTiles.every((wall) => Math.hypot(px - wall.x, pz - wall.z) >= wall.radius + padding);
  if (Number.isFinite(x) && Number.isFinite(z) && clear(x, z)) return { x, z };
  const originX = Number.isFinite(x) ? x : 0,
    originZ = Number.isFinite(z) ? z : 7;
  let nearest = { x: 0, z: 6 },
    distance = Infinity;
  for (const tile of floorTiles) {
    const candidateDistance = Math.hypot(tile.x - originX, tile.z - originZ);
    if (candidateDistance < distance && clear(tile.x, tile.z)) {
      nearest = { x: tile.x, z: tile.z };
      distance = candidateDistance;
    }
  }
  return nearest;
}
