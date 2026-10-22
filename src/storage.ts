import Dexie, { type Table } from 'dexie';
import { profileSchema, type Profile } from './model';
export interface StorageService {
  list(): Promise<Profile[]>; save(player: Profile): Promise<void>;
  update(id: string, transform: (latest: Profile) => Profile): Promise<Profile | null>;
  remove(id: string): Promise<void>; import(profiles: Profile[]): Promise<Profile[]>;
  diagnostics(): string[];
}
class WordlingsDatabase extends Dexie {
  profiles!: Table<Profile, string>;
  constructor() {
    super('wordlings-local');
    this.version(1).stores({ profiles: '&id,createdAt' });
    this.version(2).stores({ profiles: '&id,createdAt' }).upgrade(tx =>
      tx.table('profiles').toCollection().modify(p => {
        p.achievements ??= []; p.playSeconds ??= 0; p.decorations ??= [];
      }));
  }
}
export const database = new WordlingsDatabase();
let diagnosticMessages: string[] = [];
export const storage: StorageService = {
  async list() {
    const rows = await database.profiles.toArray();
    const healthy: Profile[] = [];
    let invalid = 0;
    for (const row of rows) {
      const parsed = profileSchema.safeParse(row);
      if (parsed.success) healthy.push(parsed.data); else invalid++;
    }
    // Invalid records remain untouched in IndexedDB for recovery.
    diagnosticMessages = invalid ? [`${invalid} saved explorer profile(s) could not be loaded. Other profiles remain available; the affected data has not been deleted.`] : [];
    return healthy;
  },
  diagnostics() { return [...diagnosticMessages]; },
  async save(player) { await database.profiles.put(profileSchema.parse(player)); },
  async update(id, transform) {
    return database.transaction('rw', database.profiles, async () => {
      const row = await database.profiles.get(id);
      if (!row) return null;
      const latest = profileSchema.parse(row);
      const updated = profileSchema.parse(transform(latest));
      if (updated.id !== id) throw new Error('Profile identity cannot change during an update.');
      await database.profiles.put(updated);
      return updated;
    });
  },
  async remove(id) { await database.profiles.delete(id); },
  async import(profiles) {
    const validated = profiles.map(p => profileSchema.parse(p));
    return database.transaction('rw', database.profiles, async () => {
      const imported: Profile[] = [];
      if (await database.profiles.count() + validated.length > 20) throw new Error('Import would exceed 20 local explorers.');
      for (const player of validated) {
        const collision = await database.profiles.get(player.id);
        // Restoring an older backup must never silently replace newer progress.
        const restored = collision
          ? { ...player, id: crypto.randomUUID(), name: `${player.name.slice(0, 17)} (copy)` }
          : player;
        await database.profiles.add(restored);
        imported.push(restored);
      }
      return imported;
    });
  },
};
export function readSetting(key: string, fallback = ''): string {
  try { return localStorage.getItem(`wordlings:${key}`) ?? fallback; } catch { return fallback; }
}
export function writeSetting(key: string, value: string): void {
  try { localStorage.setItem(`wordlings:${key}`, value); } catch { /* IndexedDB is the progress store. */ }
}
