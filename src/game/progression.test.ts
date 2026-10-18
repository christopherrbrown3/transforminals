import { describe, expect, it } from 'vitest';
import { CREATURES } from './data';
import {
  bossHearts,
  canEnterFinal,
  canTransform,
  cageLanding,
  freshSave,
  headStompEligible,
  rescue,
} from './progression';

describe('rescue progression', () => {
  it('keeps the required rescue registry to the 22 named creatures', () => {
    expect(CREATURES).toHaveLength(22);
    expect(new Set(CREATURES.map(({ id }) => id)).size).toBe(22);
    expect(CREATURES.some(({ id }) => id === 'human')).toBe(false);
  });

  it('rescues a known creature once and rejects unknown or duplicate IDs', () => {
    const save = freshSave();

    expect(rescue(save, 'fox')).toBe(true);
    expect(rescue(save, 'fox')).toBe(false);
    expect(rescue(save, 'passing-wildlife')).toBe(false);
    expect(save.rescued).toEqual(['fox']);
  });

  it('allows human form and only rescued animal forms', () => {
    const save = freshSave();

    expect(canTransform(save, 'human')).toBe(true);
    expect(canTransform(save, 'fox')).toBe(false);
    rescue(save, 'fox');
    expect(canTransform(save, 'fox')).toBe(true);
  });

  it('opens the final gate only when every required creature is rescued', () => {
    const ids = CREATURES.map(({ id }) => id);

    expect(canEnterFinal([])).toBe(false);
    expect(canEnterFinal(ids.slice(1))).toBe(false);
    expect(canEnterFinal(ids)).toBe(true);
    expect(canEnterFinal([...ids, 'optional-wildlife'])).toBe(true);
  });

  it('shows the three boss hearts changing across five stomps', () => {
    expect([0, 1, 2, 3, 4, 5].map((hits) => bossHearts(hits))).toEqual([
      3, 3, 2, 2, 1, 0,
    ]);
    expect(bossHearts(-4)).toBe(3);
    expect(bossHearts(99)).toBe(0);
  });

  it('accepts a forgiving cage landing only while descending through its top', () => {
    const cage = { x: 0, z: 0 };

    expect(cageLanding({ x: 2.6, z: -2.6, y: 1, vy: -0.2 }, cage, 1.1)).toBe(true);
    expect(cageLanding({ x: 2.7, z: 0, y: 1, vy: -0.2 }, cage, 1.1)).toBe(false);
    expect(cageLanding({ x: 0, z: 0, y: 1, vy: 0.2 }, cage, 1.1)).toBe(false);
    expect(cageLanding({ x: 0, z: 0, y: 1, vy: -0.2 }, cage, 0.7)).toBe(false);
  });

  it('accepts a descending head stomp inside the generous target', () => {
    const player = { x: 3.1, y: 2.5, z: 0, vy: -0.1 };
    const target = { x: 0, z: 0, height: 2 };

    expect(headStompEligible(player, target, 3.5)).toBe(true);
    expect(headStompEligible({ ...player, vy: 0.1 }, target, 3.5)).toBe(false);
    expect(headStompEligible({ ...player, x: 3.3 }, target, 3.5)).toBe(false);
    expect(headStompEligible(player, target, 1)).toBe(false);
  });
});
