import { describe, expect, it } from 'vitest';
import { BOSSES, CREATURES } from './data';
import {
  bossHearts,
  canEnterFinal,
  canTransform,
  cageLanding,
  freshSave,
  headStompEligible,
  rescue,
  unlockedForms,
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

  it('unlocks each boss as a form once it is beaten, without counting it as a rescue', () => {
    const save = freshSave();
    rescue(save, 'fox');
    for (const boss of BOSSES) expect(canTransform(save, boss.id), boss.id).toBe(false);
    save.defeated.push('frosty', 'demon-lizard');
    expect(canTransform(save, 'frosty')).toBe(true);
    expect(canTransform(save, 'demon-lizard')).toBe(true);
    expect(canTransform(save, 'sproutzilla')).toBe(false);
    expect(unlockedForms(save).map((c) => c.id)).toEqual([
      'human',
      'fox',
      'frosty',
      'demon-lizard',
    ]);
    // Beaten bosses never stand in for the required rescues.
    expect(canEnterFinal(save.rescued)).toBe(false);
    expect(rescue(save, 'frosty')).toBe(false);
    expect(save.rescued).toEqual(['fox']);
  });

  it('opens the final gate only when every required creature is rescued', () => {
    const ids = CREATURES.map(({ id }) => id);

    expect(canEnterFinal([])).toBe(false);
    expect(canEnterFinal(ids.slice(1))).toBe(false);
    expect(canEnterFinal(ids)).toBe(true);
    expect(canEnterFinal([...ids, 'optional-wildlife'])).toBe(true);
  });

  it('shows five final-boss hearts, losing one per head stomp', () => {
    expect([0, 1, 2, 3, 4, 5].map((hits) => bossHearts(hits))).toEqual([5, 4, 3, 2, 1, 0]);
    expect(bossHearts(-4)).toBe(5);
    expect(bossHearts(99)).toBe(0);
  });

  it('keeps three-hit mini-bosses at three hearts', () => {
    expect([0, 1, 2, 3].map((hits) => bossHearts(hits, 3))).toEqual([3, 2, 1, 0]);
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
