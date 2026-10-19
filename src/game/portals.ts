import { BIOMES, type BiomeId } from './data';

/** The forward gate opens new ground; side gates retain a return route and a shortcut. */
export function portalDestinations(
  current: BiomeId,
  discovered: readonly string[],
  arrivedFrom?: BiomeId,
): { back: BiomeId; forward: BiomeId; shortcut: BiomeId } {
  const index = BIOMES.findIndex((biome) => biome.id === current);
  const onward = Array.from(
    { length: BIOMES.length - 1 },
    (_, step) => BIOMES[(index + step + 1) % BIOMES.length].id,
  );
  const forward =
    onward.find((id) => !discovered.includes(id) && id !== arrivedFrom) ??
    onward.find((id) => id !== arrivedFrom)!;
  let back = arrivedFrom && arrivedFrom !== current ? arrivedFrom : onward.at(-1)!;
  if (back === forward) back = onward.find((id) => id !== forward)!;
  const shortcut = [...onward.slice(2), ...onward.slice(0, 2)].find(
    (id) => id !== forward && id !== back,
  )!;
  return { back, forward, shortcut };
}
