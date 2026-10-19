import { describe, expect, it } from 'vitest';
import { BOSSES, CREATURES } from './data';
import { freshSave, SAVE_VERSION } from './progression';
import { migrateSave, SaveManager, SAVE_KEY, type StorageLike } from './save';

class MemoryStorage implements StorageLike {
  values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

describe('save migration and recovery', () => {
  it('migrates the legacy unlocked field and fills safe defaults', () => {
    const migrated = migrateSave({ version: 1, unlocked: ['fox', 'fox', 'not-a-creature'] });

    expect(migrated.version).toBe(SAVE_VERSION);
    expect(migrated.rescued).toEqual(['fox']);
    expect(migrated.discovered).toContain('meadow');
    expect(migrated.portals).toContain('meadow');
    expect(migrated.settings).toEqual({ muted: false, volume: 0.35, reducedMotion: false });
  });

  it('migrates an earlier save while filtering invalid IDs and clamping values', () => {
    const migrated = migrateSave({
      version: 1,
      rescued: ['arctic-fox', 12, 'unknown', 'arctic-fox'],
      defeated: ['flushington', 'not-a-boss'],
      discovered: ['city', 'unknown'],
      portals: ['city', 'city'],
      location: { biome: 'city', x: 120, z: -80 },
      settings: { muted: true, volume: 5, reducedMotion: true },
    });

    expect(migrated.rescued).toEqual(['arctic-fox']);
    expect(migrated.defeated).toEqual(['flushington']);
    expect(migrated.discovered).toEqual(['meadow', 'city']);
    expect(migrated.portals).toEqual(['meadow', 'city']);
    expect(migrated.location).toEqual({ biome: 'city', x: 38, z: -38 });
    expect(migrated.settings).toEqual({ muted: true, volume: 1, reducedMotion: true });
  });

  it('upgrades v0.2 progress to schema 3 and retains optional discoveries separately', () => {
    const old = {
      version: 2,
      form: 'fox',
      rescued: ['fox'],
      defeated: ['flushington'],
      discovered: ['meadow', 'underground'],
      portals: ['meadow', 'underground'],
      location: { biome: 'underground', x: 17, z: -5 },
      settings: { muted: true, volume: 0.2, reducedMotion: true },
    };
    const migrated = migrateSave(old);
    expect(migrated).toEqual({ ...old, version: SAVE_VERSION, secrets: [] });
    expect(
      migrateSave({ ...migrated, secrets: ['crystal-nook', 'crystal-nook', 'unknown'] }).secrets,
    ).toEqual(['crystal-nook']);
    expect(migrated.rescued).toEqual(['fox']);
  });

  it('clamps settings and uses safe defaults for invalid location and setting values', () => {
    const migrated = migrateSave({
      version: SAVE_VERSION,
      location: { biome: 'not-a-biome', x: Infinity, z: 2 },
      settings: { muted: 'yes', volume: -2, reducedMotion: 1 },
    });

    expect(migrated.location).toEqual(freshSave().location);
    expect(migrated.settings).toEqual({ muted: false, volume: 0, reducedMotion: false });
  });

  it('preserves full completion when migrating a save with final boss victory', () => {
    const migrated = migrateSave({ version: 1, defeated: ['demon-lizard'] });

    expect(migrated.defeated).toEqual(['demon-lizard']);
    expect(migrated.rescued).toEqual(CREATURES.map(({ id }) => id));
    expect(BOSSES.some(({ id }) => id === 'demon-lizard')).toBe(true);
  });

  it('rejects a future schema version without overwriting the existing save', () => {
    const storage = new MemoryStorage();
    const future = JSON.stringify({ version: SAVE_VERSION + 1, rescued: ['fox'] });
    storage.setItem(SAVE_KEY, future);
    const manager = new SaveManager(storage);

    expect(manager.readOnly).toBe(true);
    expect(manager.warning).toContain('newer');
    expect(manager.save()).toBe(false);
    expect(storage.getItem(SAVE_KEY)).toBe(future);
  });

  it('keeps a backup and starts safely when stored JSON is corrupted', () => {
    const storage = new MemoryStorage();
    storage.setItem(SAVE_KEY, '{broken json');
    const manager = new SaveManager(storage);

    expect(manager.data).toEqual(freshSave());
    expect(manager.warning).toContain('could not be opened');
    expect(storage.getItem(`${SAVE_KEY}-backup`)).toBe('{broken json');
    expect(manager.save()).toBe(true);
    expect(JSON.parse(storage.getItem(SAVE_KEY) ?? 'null')).toEqual(freshSave());
  });
});
