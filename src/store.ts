import { create } from 'zustand';
import { challenges } from './content';
import { backupSchema, newProfile, progressMatchesContent, rewardCompletion, updateAttempt, type Challenge, type Companion, type Profile } from './model';
import { readSetting, storage, writeSetting } from './storage';
interface GameState {
  profiles: Profile[]; player: Profile | null; ready: boolean; error: string | null;
  init(): Promise<void>;
  createPlayer(name: string, avatar: string, companion: Companion): Promise<void>;
  selectPlayer(id: string): Promise<void>;
  recordAttempt(challenge: Challenge, correct: boolean, assisted?: boolean): Promise<void>;
  completeChallenge(challenge: Challenge): Promise<void>;
  placeDecoration(item: string, x: number, y: number): Promise<void>;
  buyDecoration(item: string): Promise<void>;
  chooseCompanion(kind: Companion): Promise<void>;
  removeDecoration(id: string): Promise<void>;
  deletePlayer(id: string): Promise<void>;
  resetPlayer(id: string): Promise<void>;
  importBackup(text: string): Promise<void>;
  exportBackup(): Promise<string>;
  addPlayTime(seconds: number): Promise<void>;
  clearError(): void;
}
let queue: Promise<void> = Promise.resolve();
export const useGame = create<GameState>((set, get) => {
  const run = (operation: () => Promise<void>) => {
    const pending = queue.then(async () => {
      try { await operation(); set({ error: storage.diagnostics().join(' ') || null }); }
      catch (error) {
        set({ error: error instanceof Error ? error.message : String(error) });
        throw error;
      }
    });
    queue = pending.catch(() => undefined);
    return pending;
  };
  const publish = (player: Profile) => set(state => ({
    player, profiles: state.profiles.some(p => p.id === player.id)
      ? state.profiles.map(p => p.id === player.id ? player : p) : [...state.profiles, player],
  }));
  const change = (transform: (player: Profile) => Profile) => {
    const id = get().player?.id;
    return run(async () => {
      const player = get().player;
      if (!player || player.id !== id) return;
      const updated = await storage.update(player.id, transform);
      if (updated) publish(updated);
      else {
        set(s => ({ player: null, profiles: s.profiles.filter(p => p.id !== player.id) }));
        writeSetting('selected', '');
      }
    });
  };
  return {
    profiles: [], player: null, ready: false, error: null,
    async init() {
      await run(async () => {
        const profiles = await storage.list();
        const player = profiles.find(p => p.id === readSetting('selected')) ?? null;
        set({ profiles, player, ready: true });
      }).catch(() => set({ ready: true }));
    },
    createPlayer: (name, avatar, companion) => run(async () => {
      if (get().profiles.length >= 20) throw new Error('This device already has 20 explorers.');
      const player = newProfile(name, avatar, companion);
      await storage.save(player); publish(player); writeSetting('selected', player.id);
    }),
    selectPlayer: id => run(async () => {
      const player = get().profiles.find(p => p.id === id);
      if (!player) throw new Error('Explorer not found.');
      set({ player }); writeSetting('selected', id);
    }),
    recordAttempt: (challenge, correct, assisted = false) => change(p => updateAttempt(p, challenge, correct, assisted)),
    completeChallenge: challenge => change(p => {
      const latest = p.history.filter(h => h.challengeId === challenge.id).at(-1);
      if (!latest?.correct) return p;
      return rewardCompletion(p, challenge, challenges);
    }),
    chooseCompanion: kind => change(p => {
      if (kind === 'dragon' && !p.inventory.includes('bramble-friend')) return p;
      return { ...p, companion: kind };
    }),
    buyDecoration: item => change(p => {
      const prices: Record<string, number> = {'amber-lantern': 40, 'star-cushion': 64 };
      const price = prices[item];
      if (!price || p.inventory.includes(item) || p.coins < price) return p;
      return { ...p, coins: p.coins - price, inventory: [...p.inventory, item] };
    }),
    placeDecoration: (item, x, y) => change(p => {
      if (item === 'bramble-friend' || !p.inventory.includes(item) || !Number.isFinite(x) || !Number.isFinite(y)) return p;
      const previous = p.decorations.find(d => d.item === item);
      const decoration = { id: previous?.id ?? crypto.randomUUID(), item, x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) };
      return { ...p, decorations: [...p.decorations.filter(d => d.item !== item), decoration] };
    }),
    removeDecoration: id => change(p => ({ ...p, decorations: p.decorations.filter(d => d.id !== id) })),
    deletePlayer: id => run(async () => {
      await storage.remove(id);
      const isSelected = get().player?.id === id;
      set(s => ({ profiles: s.profiles.filter(p => p.id !== id), ...(isSelected ? { player: null } : {}) }));
      if (isSelected) writeSetting('selected', '');
    }),
    resetPlayer: id => run(async () => {
      const old = get().profiles.find(p => p.id === id);
      if (!old) return;
      const player = { ...newProfile(old.name, old.avatar, old.companion === 'dragon' ? 'pip' : old.companion), id: old.id, createdAt: old.createdAt };
      await storage.save(player);
      set(s => ({ profiles: s.profiles.map(p => p.id === id ? player : p), player: s.player?.id === id ? player : s.player }));
    }),
    importBackup: text => run(async () => {
      if (text.length > 10_000_000) throw new Error('Backup is too large.');
      const backup = backupSchema.parse(JSON.parse(text));
      if (backup.profiles.some(player => !progressMatchesContent(player, challenges))) throw new Error('Backup progress does not match this world.');
      const imported = await storage.import(backup.profiles);
      const profiles = await storage.list();
      const player = profiles.find(p => p.id === imported[0]?.id) ?? null;
      set({ profiles, player });
      if (player) writeSetting('selected', player.id);
    }),
    exportBackup: async () => JSON.stringify(backupSchema.parse({ format: 'wordlings', version: 1, profiles: await storage.list() }), null, 2),
    addPlayTime: seconds => change(p => ({ ...p, playSeconds: p.playSeconds + (Number.isFinite(seconds) ? Math.max(0, Math.min(seconds, 60)) : 0) })),
    clearError: () => set({ error: null }),
  };
});


