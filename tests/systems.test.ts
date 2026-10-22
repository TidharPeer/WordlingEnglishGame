import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Dexie from 'dexie';
import { backupSchema, newProfile, progressMatchesContent, rewardCompletion, reviewDue, updateAttempt, type Challenge } from '../src/model';
import { database, storage } from '../src/storage';
const challenge: Challenge = {
  id: 'test-1', chapter: 0, kind: 'hunt', skill: 'vocabulary', difficulty: 1,
  prompt: 'Find the fox.', help: { en: 'Find it', he: 'מצאו' }, hint: { en: 'A fox', he: 'שועל' },
  explanation: { en: 'Fox', he: 'שועל' }, options: [{ id: 'fox', text: 'fox' }], answers: [['fox']], objective: 'Recognize fox',
};
describe('mastery and rewards', () => {
  it('raises each skill only after independent success and scaffolds repeated errors', () => {
    let p = newProfile('Ari', 'leaf', 'pip');
    p = updateAttempt(p, challenge, true, true);
    expect(p.skills.vocabulary.level).toBe(1);
    for (let i = 0; i < 3; i++) p = updateAttempt(p, challenge, true, false);
    expect(p.skills.vocabulary.level).toBe(2);
    expect(p.skills.grammar.level).toBe(1);
    p = updateAttempt(p, challenge, false, false);
    p = updateAttempt(p, challenge, false, false);
    expect(p.skills.vocabulary.level).toBe(1);
    expect(p.skills.vocabulary.attempts).toBe(6);
  });
  it('rewards once and waits for the whole chapter before unlocking', () => {
    const second = { ...challenge, id: 'test-2' };
    let p = newProfile('Ari', 'leaf', 'moss');
    p = rewardCompletion(p, challenge, [challenge, second]);
    expect(p.chapter).toBe(0);
    const duplicate = rewardCompletion(p, challenge, [challenge, second]);
    expect(duplicate).toBe(p);
    p = rewardCompletion(p, second, [challenge, second]);
    expect(p.chapter).toBe(1); expect(p.xp).toBe(40); expect(p.coins).toBe(16);
    expect(p.inventory).toContain('glow-lantern'); expect(p.achievements).toContain('forest-guardian');
  });
  it('schedules failed and assisted material sooner than independent success', () => {
    const p = updateAttempt(newProfile('Ari', 'leaf', 'luma'), challenge, true, false);
    const at = p.history[0].at;
    expect(reviewDue(p, challenge.id, at + 1000)).toBe(false);
    expect(reviewDue(p, challenge.id, at + 86400000)).toBe(true);
    const retry = updateAttempt(p, challenge, false, false);
    expect(reviewDue(retry, challenge.id, retry.history.at(-1)!.at)).toBe(true);
  });
});
describe('local storage and validated backups', () => {
  beforeEach(async () => { await database.profiles.clear(); });
  it('round-trips independent siblings and removes only the selected profile', async () => {
    const a = newProfile('Ari', 'leaf', 'pip'), b = newProfile('Noa', 'star', 'moss');
    a.xp = 80;
    await storage.save(a); await storage.save(b);
    expect((await storage.list()).find(p => p.id === a.id)?.xp).toBe(80);
    expect((await storage.list()).find(p => p.id === b.id)?.xp).toBe(0);
    await storage.remove(a.id);
    expect((await storage.list()).map(p => p.id)).toEqual([b.id]);
  });
  it('rejects unsupported versions, invalid mastery, duplicate IDs, and malformed decoration coordinates', () => {
    const p = newProfile('Ari', 'leaf', 'pip');
    expect(backupSchema.safeParse({ format: 'wordlings', version: 99, profiles: [p] }).success).toBe(false);
    expect(backupSchema.safeParse({ format: 'wordlings', version: 1, profiles: [p, p] }).success).toBe(false);
    p.skills.grammar.correct = 10;
    expect(backupSchema.safeParse({ format: 'wordlings', version: 1, profiles: [p] }).success).toBe(false);
    p.skills.grammar.correct = 0;
    p.decorations.push({ id: 'x', item: 'fern-pot', x: 101, y: 20 });
    expect(backupSchema.safeParse({ format: 'wordlings', version: 1, profiles: [p] }).success).toBe(false);
  });
  it('validates all imported profiles before any write', async () => {
    const a = newProfile('Ari', 'leaf', 'pip');
    const b = newProfile('Noa', 'star', 'moss');
    b.xp = -5;
    await expect(storage.import([a, b])).rejects.toThrow();
    expect(await storage.list()).toEqual([]);
  });
});

// Queue behaviour is tested against the actual content contract and IndexedDB adapter.
describe('serialized game mutations', () => {
  it('does not award twice when completion is requested concurrently', async () => {
    const { useGame } = await import('../src/store');
    const { challenges } = await import('../src/content');
    await database.profiles.clear();
    useGame.setState({ profiles: [], player: null, ready: true, error: null });
    await useGame.getState().createPlayer('Ari', 'leaf', 'pip');
    const first = challenges[0];
    await useGame.getState().recordAttempt(first, true, false);
    await Promise.all([useGame.getState().completeChallenge(first), useGame.getState().completeChallenge(first)]);
    expect(useGame.getState().player?.xp).toBe(20);
    expect(useGame.getState().player?.completed).toEqual([first.id]);
    const saved = await storage.list();
    expect(saved[0].xp).toBe(20);
  });
  it('requires a successful attempt and preserves state on invalid backup', async () => {
    const { useGame } = await import('../src/store');
    const { challenges } = await import('../src/content');
    await database.profiles.clear();
    useGame.setState({ profiles: [], player: null, ready: true, error: null });
    await useGame.getState().createPlayer('Noa', 'star', 'luma');
    await useGame.getState().completeChallenge(challenges[0]);
    expect(useGame.getState().player?.xp).toBe(0);
    const original = useGame.getState().player;
    await expect(useGame.getState().importBackup('{"format":"wordlings","version":9,"profiles":[]}')).rejects.toThrow();
    expect(useGame.getState().player).toEqual(original);
    expect(useGame.getState().error).toBeTruthy();
  });
});


describe('recovery and multi-connection safety', () => {
  beforeEach(async () => { await database.profiles.clear(); });
  it('reads current disk progress inside the same transaction that writes it', async () => {
    const player = newProfile('Ari', 'leaf', 'pip');
    await storage.save(player);
    const peer = new Dexie('wordlings-local');
    peer.version(2).stores({ profiles: '&id,createdAt' });
    try {
      await Promise.all(Array.from({ length: 20 }, (_, index) => index % 2
        ? storage.update(player.id, latest => ({ ...latest, xp: latest.xp + 1 }))
        : peer.transaction('rw', peer.table('profiles'), async () => {
          const latest = await peer.table('profiles').get(player.id);
          await peer.table('profiles').put({ ...latest, xp: latest.xp + 1 });
        })));
      expect((await storage.list())[0].xp).toBe(20);
    } finally { peer.close(); }
  });
  it('does not resurrect a profile deleted by another tab', async () => {
    const player = newProfile('Ari', 'leaf', 'pip');
    await storage.save(player); await storage.remove(player.id);
    expect(await storage.update(player.id, p => ({ ...p, xp: p.xp + 20 }))).toBeNull();
    expect(await storage.list()).toEqual([]);
  });
  it('imports an older colliding backup as a separate explorer', async () => {
    const older = newProfile('Ari', 'leaf', 'pip');
    await storage.save({ ...older, xp: 200 });
    await storage.import([older]);
    const profiles = await storage.list();
    expect(profiles).toHaveLength(2);
    expect(profiles.find(p => p.id === older.id)?.xp).toBe(200);
    expect(profiles.find(p => p.id !== older.id)?.xp).toBe(0);
    expect(profiles.find(p => p.id !== older.id)?.name).toBe('Ari (copy)');
  });
  it('keeps healthy siblings available and preserves corrupt records for recovery', async () => {
    const healthy = newProfile('Ari', 'leaf', 'pip');
    const corrupt = { ...newProfile('Noa', 'star', 'luma'), xp: -5 };
    await storage.save(healthy); await database.profiles.put(corrupt);
    expect((await storage.list()).map(p => p.id)).toEqual([healthy.id]);
    expect(storage.diagnostics()).toHaveLength(1);
    expect(await database.profiles.get(corrupt.id)).toEqual(corrupt);
    await storage.remove(corrupt.id); await storage.list();
    expect(storage.diagnostics()).toEqual([]);
  });
  it('rejects duplicate completed challenges and decorations not owned', () => {
    const p = newProfile('Ari', 'leaf', 'pip');
    p.completed = ['test-1', 'test-1'];
    expect(backupSchema.safeParse({ format: 'wordlings', version: 1, profiles: [p] }).success).toBe(false);
    p.completed = []; p.decorations = [{ id: 'x', item: 'unowned', x: 20, y: 20 }];
    expect(backupSchema.safeParse({ format: 'wordlings', version: 1, profiles: [p] }).success).toBe(false);
  });
});
describe('local pronunciation privacy', () => {
  it('reveals missing speech without invoking browser voices or a cloud API', async () => {
    const { RecordedPronunciation } = await import('../src/audio');
    const browserSpeak = vi.fn(), fetch = vi.fn(), unavailable = vi.fn();
    vi.stubGlobal('window', { speechSynthesis: { getVoices: () => [{ lang: 'en-US', localService: true }], speak: browserSpeak } });
    vi.stubGlobal('fetch', fetch);
    try {
      const provider = new RecordedPronunciation({});
      expect(provider.available('fox')).toBe(false);
      expect(provider.speak('fox', .85, unavailable)).toBe(false);
      expect(unavailable).toHaveBeenCalledOnce();
      expect(browserSpeak).not.toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
    } finally { vi.unstubAllGlobals(); }
  });
});

describe('earned coin keepsakes', () => {
  it('spends coins once, enforces price, and persists the decoration', async () => {
    const { useGame } = await import('../src/store');
    await database.profiles.clear();
    useGame.setState({ profiles: [], player: null, ready: true, error: null });
    await useGame.getState().createPlayer('Ari', 'leaf', 'pip');
    await useGame.getState().buyDecoration('amber-lantern');
    expect(useGame.getState().player?.inventory).not.toContain('amber-lantern');
    const player = useGame.getState().player!;
    await storage.save({ ...player, coins: 40 });
    await useGame.getState().buyDecoration('amber-lantern');
    await useGame.getState().buyDecoration('amber-lantern');
    expect(useGame.getState().player?.coins).toBe(0);
    expect(useGame.getState().player?.inventory.filter(i => i === 'amber-lantern')).toHaveLength(1);
    expect((await storage.list())[0].coins).toBe(0);
  });
});

describe('earned companion', () => {
  it('unlocks Bramble at the bridge chapter without randomness', () => {
    const all = Array.from({ length: 5 }, (_, chapter) => ({ ...challenge, id: `chapter-${chapter}`, chapter }));
    let p = newProfile('Ari', 'leaf', 'moss');
    for (const c of all) p = rewardCompletion(p, c, all);
    expect(p.chapter).toBe(5);
    expect(p.inventory).toContain('bramble-friend');
  });
});

describe('backup recovery and collection boundaries', () => {
  it('opens the imported copy when its ID already exists locally', async () => {
    const { useGame } = await import('../src/store');
    const original = newProfile('Ari', 'leaf', 'pip');
    await storage.save({ ...original, xp: 200 });
    useGame.setState({ profiles: [{ ...original, xp: 200 }], player: null, ready: true, error: null });
    await useGame.getState().importBackup(JSON.stringify({ format: 'wordlings', version: 1, profiles: [original] }));
    expect(useGame.getState().player?.id).not.toBe(original.id);
    expect(useGame.getState().player?.xp).toBe(0);
    expect(useGame.getState().profiles).toHaveLength(2);
  });

  beforeEach(async () => { await database.profiles.clear(); });
  it('restores a clean device and selects the restored explorer', async () => {
    const { useGame } = await import('../src/store');
    const explorer = { ...newProfile('Ari', 'leaf', 'pip'), xp: 120 };
    useGame.setState({ profiles: [], player: null, ready: true, error: null });
    await useGame.getState().importBackup(JSON.stringify({ format: 'wordlings', version: 1, profiles: [explorer] }));
    expect(useGame.getState().player?.id).toBe(explorer.id);
    expect(useGame.getState().player?.xp).toBe(120);
    expect((await storage.list())[0].xp).toBe(120);
  });
  it('does not place a companion token as furniture and resets an unlocked companion', async () => {
    const { useGame } = await import('../src/store');
    const explorer = { ...newProfile('Ari', 'leaf', 'pip'), companion: 'dragon' as const, inventory: ['leaf-cushion', 'fern-pot', 'bramble-friend'] };
    await storage.save(explorer);
    useGame.setState({ profiles: [explorer], player: explorer, ready: true, error: null });
    await useGame.getState().placeDecoration('bramble-friend', 50, 50);
    expect(useGame.getState().player?.decorations).toEqual([]);
    await useGame.getState().resetPlayer(explorer.id);
    expect(useGame.getState().player?.companion).toBe('pip');
    expect(useGame.getState().player?.inventory).not.toContain('bramble-friend');
  });
});


describe('backup world consistency', () => {
  it('rejects a forged chapter unlock without its discoveries', async () => {
    const { challenges } = await import('../src/content');
    const { useGame } = await import('../src/store');
    const player = { ...newProfile('Ari', 'leaf', 'pip'), chapter: 6 };
    expect(progressMatchesContent(player, challenges)).toBe(false);
    await expect(useGame.getState().importBackup(JSON.stringify({ format: 'wordlings', version: 1, profiles: [player] }))).rejects.toThrow();
  });
});
