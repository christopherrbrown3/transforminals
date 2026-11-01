import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { BOSS_FORMS, CREATURES, HUMAN } from './data';
import {
  aimTarget,
  facingVector,
  inReach,
  POWERS,
  powerFor,
  spaceTrip,
  tripPoint,
  yawToward,
} from './powers';

const forms = [HUMAN, ...CREATURES, ...BOSS_FORMS];

describe('powers', () => {
  it('gives every form its own power and button label', () => {
    expect(Object.keys(POWERS).sort()).toEqual(forms.map((c) => c.id).sort());
    const labels = forms.map((c) => powerFor(c.id).label);
    expect(new Set(labels).size).toBe(forms.length);
    expect(new Set(forms.map((c) => c.power)).size).toBe(forms.length);
    for (const label of labels) expect(label).toMatch(/^[A-Z]{3,7}$/);
    // Each power differs from every other in at least one of motion, look, reach or sound.
    const signatures = forms.map((c) => {
      const p = powerFor(c.id);
      return JSON.stringify([p.motion, p.style, p.particle, p.colors[0], p.reach, p.arc, p.notes]);
    });
    expect(new Set(signatures).size).toBe(forms.length);
  });

  it('keeps powers free to use: no resource, short reach limits, sensible motion', () => {
    for (const c of forms) {
      const p = powerFor(c.id);
      expect(p.reach, c.id).toBeGreaterThan(1);
      expect(p.reach, c.id).toBeLessThanOrEqual(14);
      expect(p.arc, c.id).toBeGreaterThan(0);
      expect(p.arc, c.id).toBeLessThanOrEqual(360);
      if (['dash', 'zigzag', 'spin', 'leap', 'dive'].includes(p.motion))
        expect(p.distance, c.id).toBeGreaterThan(0);
    }
  });

  it('reaches animals in front, not behind, unless the power reaches all around', () => {
    const from = { x: 0, z: 0 };
    const facing = facingVector(0);
    expect(facing.z).toBeCloseTo(-1);
    const roar = powerFor('lion');
    expect(inReach(roar, from, facing, { x: 0, z: -6 })).toBe(true);
    expect(inReach(roar, from, facing, { x: 0, z: 6 })).toBe(false);
    expect(inReach(roar, from, facing, { x: 0, z: -9 })).toBe(false);
    expect(inReach(roar, from, facing, { x: 7, z: -1 })).toBe(false);
    const moo = powerFor('giant-cow');
    expect(inReach(moo, from, facing, { x: 0, z: 6 })).toBe(true);
    expect(inReach(moo, from, facing, { x: -5, z: 3 })).toBe(true);
  });

  it('helps aim at the nearest animal roughly in front, and ignores ones behind', () => {
    const from = { x: 0, z: 0 };
    const boop = powerFor('human');
    const targets = [
      { x: 0, z: 3 },
      { x: 1.6, z: -3.3 },
      { x: 0, z: -3.4 },
    ];
    const pick = aimTarget(boop, from, facingVector(0), targets);
    expect(pick).toBe(2);
    expect(yawToward(from, targets[1])).toBeCloseTo(Math.atan2(-1.6, 3.3));
    expect(aimTarget(boop, from, facingVector(0), [{ x: 0, z: 3 }])).toBe(-1);
    // A dash looks along its whole run.
    expect(aimTarget(powerFor('fox'), from, facingVector(0), [{ x: 0.5, z: -8 }])).toBe(0);
  });

  it('flies launched animals up and away while staying inside the play view', () => {
    const camera = new THREE.PerspectiveCamera(48, 1194 / 834, 0.1, 160);
    for (const [px, pz, giant] of [
      [0, 7, false],
      [5, -20, false],
      [-20, 0, true],
    ] as const) {
      camera.position.set(px + 3, giant ? 15 : 12, pz + (giant ? 21 : 17));
      camera.lookAt(px, 1, pz - 3);
      camera.updateMatrixWorld();
      const start = new THREE.Vector3(px + 1, 0, pz - 2.5);
      for (const side of [-1, 1]) {
        const { peak, end } = spaceTrip(
          start,
          {
            position: camera.position,
            direction: camera.getWorldDirection(new THREE.Vector3()),
            fov: camera.fov,
          },
          side,
        );
        expect(end.distanceTo(camera.position)).toBeGreaterThan(50);
        expect(end.y).toBeGreaterThan(start.y);
        for (let t = 0; t <= 1.0001; t += 0.1) {
          const point = tripPoint(start, peak, end, t).project(camera);
          expect(Math.abs(point.x), `x at t=${t.toFixed(1)}`).toBeLessThan(1);
          expect(point.y, `y at t=${t.toFixed(1)}`).toBeLessThan(0.97);
          expect(point.y, `y at t=${t.toFixed(1)}`).toBeGreaterThan(-1);
        }
        // The twinkle sits near the top of the screen, where the sky shows.
        expect(end.clone().project(camera).y).toBeGreaterThan(0.6);
      }
    }
  });
});
