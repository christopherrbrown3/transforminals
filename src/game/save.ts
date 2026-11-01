import { BIOMES, BOSSES, CREATURES } from './data';
import { canTransform, freshSave, SAVE_VERSION, type SaveData } from './progression';
export const SAVE_KEY = 'transforminals-save';
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export function migrateSave(input: unknown): SaveData {
  const base = freshSave();
  if (!input || typeof input !== 'object') return base;
  const raw = input as Record<string, unknown>;
  if (typeof raw.version === 'number' && raw.version > SAVE_VERSION)
    throw new Error('A newer Transforminals save needs a newer game version.');
  const strings = (value: unknown, valid: string[]) =>
    Array.isArray(value)
      ? [...new Set(value.filter((v): v is string => typeof v === 'string' && valid.includes(v)))]
      : [];
  base.rescued = strings(
    raw.rescued ?? raw.unlocked,
    CREATURES.map((c) => c.id),
  );
  base.secrets = strings(raw.secrets, ['crystal-nook']);
  base.defeated = strings(
    raw.defeated,
    BOSSES.map((b) => b.id),
  );
  if (base.defeated.includes('demon-lizard')) base.rescued = CREATURES.map((c) => c.id);
  base.form = typeof raw.form === 'string' && canTransform(base, raw.form) ? raw.form : 'human';
  base.discovered = [
    ...new Set([
      'meadow',
      ...strings(
        raw.discovered,
        BIOMES.map((b) => b.id),
      ),
    ]),
  ];
  base.portals = [
    ...new Set([
      'meadow',
      ...strings(
        raw.portals,
        BIOMES.map((b) => b.id),
      ),
    ]),
  ];
  if (raw.location && typeof raw.location === 'object') {
    const loc = raw.location as Record<string, unknown>;
    if (
      BIOMES.some((b) => b.id === loc.biome) &&
      typeof loc.x === 'number' &&
      Number.isFinite(loc.x) &&
      typeof loc.z === 'number' &&
      Number.isFinite(loc.z)
    )
      base.location = {
        biome: String(loc.biome),
        x: Math.max(-38, Math.min(38, loc.x)),
        z: Math.max(-38, Math.min(38, loc.z)),
      };
  }
  if (raw.settings && typeof raw.settings === 'object') {
    const s = raw.settings as Record<string, unknown>;
    base.settings = {
      muted: typeof s.muted === 'boolean' ? s.muted : false,
      volume:
        typeof s.volume === 'number' && Number.isFinite(s.volume)
          ? Math.min(1, Math.max(0, s.volume))
          : 0.35,
      reducedMotion: s.reducedMotion === true,
    };
  }
  return base;
}
export class SaveManager {
  data: SaveData;
  warning = '';
  readOnly = false;
  constructor(private storage: StorageLike) {
    try {
      const raw = storage.getItem(SAVE_KEY);
      this.data = raw ? migrateSave(JSON.parse(raw)) : freshSave();
    } catch (error) {
      this.data = freshSave();
      this.warning =
        error instanceof Error && error.message.includes('newer')
          ? error.message
          : 'Your save could not be opened. A fresh adventure is ready; the old save was kept as a backup.';
      try {
        const raw = storage.getItem(SAVE_KEY);
        if (raw) storage.setItem(`${SAVE_KEY}-backup`, raw);
      } catch {
        /* Keep the game playable if storage is unavailable. */
      }
      this.readOnly = this.warning.includes('newer');
    }
  }
  save() {
    if (this.readOnly) return false;
    try {
      this.storage.setItem(SAVE_KEY, JSON.stringify(this.data));
      return true;
    } catch {
      this.warning = 'Your browser cannot save right now. Keep this tab open to keep playing.';
      return false;
    }
  }
  reset() {
    this.readOnly = false;
    this.data = freshSave();
    this.save();
  }
}
