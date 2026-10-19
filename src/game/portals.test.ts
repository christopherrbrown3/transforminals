import { describe, expect, it } from 'vitest';
import { BIOMES, type BiomeId } from './data';
import { portalDestinations } from './portals';

describe('exploration gates', () => {
  it('visits every biome by continuing forward without an immediate return', () => {
    let current: BiomeId = 'meadow';
    let previous: BiomeId | undefined;
    const discovered: BiomeId[] = [current];
    for (let step = 1; step < BIOMES.length; step++) {
      const links = portalDestinations(current, discovered, previous);
      expect(discovered).not.toContain(links.forward);
      expect(links.forward).not.toBe(previous);
      previous = current;
      current = links.forward;
      discovered.push(current);
    }
    expect(new Set(discovered).size).toBe(BIOMES.length);
  });

  it('offers three distinct destinations and a direct return after a shortcut', () => {
    const links = portalDestinations('desert', ['meadow', 'desert'], 'meadow');
    expect(links.back).toBe('meadow');
    expect(links.forward).toBe('beach');
    expect(new Set(Object.values(links)).size).toBe(3);
  });

  it('avoids sending forward straight back even after every region is discovered', () => {
    const all = BIOMES.map((biome) => biome.id);
    const links = portalDestinations('city', all, 'meadow');
    expect(links.back).toBe('meadow');
    expect(links.forward).toBe('winter');
  });

  it('keeps distinct routes when the usual return is the only undiscovered place', () => {
    const discovered = BIOMES.filter((biome) => biome.id !== 'city').map((biome) => biome.id);
    const links = portalDestinations('meadow', discovered);
    expect(links.forward).toBe('city');
    expect(new Set(Object.values(links)).size).toBe(3);
  });
});
