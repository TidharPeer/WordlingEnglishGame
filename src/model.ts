import { z } from 'zod';
export const SKILLS = ['vocabulary', 'reading', 'listening', 'grammar', 'communication', 'writing'] as const;
export type Skill = typeof SKILLS[number];
export type Companion = 'pip' | 'moss' | 'luma' | 'dragon';
export interface Challenge {
  id: string; chapter: number; kind: string; skill: Skill; difficulty: 1 | 2 | 3;
  prompt: string; help: { en: string; he: string }; hint: { en: string; he: string };
  explanation: { en: string; he: string }; options: { id: string; text: string; art?: string }[];
  answers: string[][]; words?: string[]; objective: string; speaker?: string; reactions?: Record<string, { en: string; he: string }>; sceneBeat?: { art: 'map' | 'feather'; followUp: string };
}
const skillSchema = z.object({
  attempts: z.number().int().nonnegative(), correct: z.number().int().nonnegative(),
  level: z.number().int().min(1).max(3), streak: z.number().int(),
}).refine(s => s.correct <= s.attempts, 'Correct answers cannot exceed attempts');
export const profileSchema = z.object({
  id: z.string().min(1).max(100), name: z.string().trim().min(1).max(24),
  avatar: z.string().max(50), companion: z.enum(['pip', 'moss', 'luma', 'dragon']),
  xp: z.number().int().nonnegative(), coins: z.number().int().nonnegative(),
  completed: z.array(z.string().max(100)).max(10000), chapter: z.number().int().min(0).max(100),
  inventory: z.array(z.string().max(100)).max(1000),
  decorations: z.array(z.object({
    id: z.string().max(100), item: z.string().max(100),
    x: z.number().min(0).max(100), y: z.number().min(0).max(100),
  })).max(100),
  skills: z.object({ vocabulary: skillSchema, reading: skillSchema, listening: skillSchema,
    grammar: skillSchema, communication: skillSchema, writing: skillSchema }),
  history: z.array(z.object({
    challengeId: z.string().max(100), skill: z.enum(SKILLS), correct: z.boolean(),
    at: z.number().nonnegative(), assisted: z.boolean(),
  })).max(10000),
  createdAt: z.number().nonnegative(), playSeconds: z.number().nonnegative(),
  achievements: z.array(z.string().max(100)).max(1000),
}).superRefine((profile, ctx) => {
  const unique = (values: string[], path: string) => {
    if (new Set(values).size !== values.length) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message: 'Duplicate entries are not allowed.' });
  };
  unique(profile.completed, 'completed'); unique(profile.inventory, 'inventory');
  unique(profile.achievements, 'achievements'); unique(profile.decorations.map(d => d.id), 'decorations');
  unique(profile.decorations.map(d => d.item), 'decorations');
  if (profile.decorations.some(d => !profile.inventory.includes(d.item))) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['decorations'], message: 'Decorations must belong to the explorer.' });
  }
});
export type Profile = z.infer<typeof profileSchema>;
export const backupSchema = z.object({ format: z.literal('wordlings'), version: z.literal(1),
  profiles: z.array(profileSchema).min(1).max(20),
}).refine(b => new Set(b.profiles.map(p => p.id)).size === b.profiles.length, 'Duplicate player IDs');
export function newProfile(name: string, avatar: string, companion: Companion): Profile {
  return profileSchema.parse({
    id: crypto.randomUUID(), name, avatar, companion, xp: 0, coins: 0, completed: [], chapter: 0,
    inventory: ['leaf-cushion', 'fern-pot'], decorations: [],
    skills: Object.fromEntries(SKILLS.map(s => [s, { attempts: 0, correct: 0, level: 1, streak: 0 }])),
    history: [], createdAt: Date.now(), playSeconds: 0, achievements: [],
  });
}
export function updateAttempt(player: Profile, challenge: Challenge, correct: boolean, assisted: boolean): Profile {
  const old = player.skills[challenge.skill];
  const streak = correct && !assisted ? Math.max(0, old.streak) + 1 : correct ? 0 : Math.min(0, old.streak) - 1;
  const level = streak >= 3 ? Math.min(3, old.level + 1) : streak <= -2 ? Math.max(1, old.level - 1) : old.level;
  return { ...player, skills: { ...player.skills, [challenge.skill]: {
      attempts: old.attempts + 1, correct: old.correct + Number(correct), level,
      streak: streak >= 3 || streak <= -2 ? 0 : streak,
    } },
    history: [...player.history, { challengeId: challenge.id, skill: challenge.skill, correct, assisted, at: Date.now() }].slice(-10000),
  };
}
export function reviewDue(player: Profile, challengeId: string, now = Date.now()): boolean {
  const entries = player.history.filter(h => h.challengeId === challengeId);
  const latest = entries.at(-1);
  if (!latest) return false;
  const successes = entries.filter(h => h.correct && !h.assisted).length;
  const days = !latest.correct || latest.assisted ? 0 : [1, 1, 3, 7, 14, 30][Math.min(successes, 5)];
  return now >= latest.at + days * 86400000;
}
export function progressMatchesContent(player: Profile, all: readonly Challenge[]): boolean {
  const byId = new Map(all.map(challenge => [challenge.id, challenge]));
  if (player.completed.some(id => !byId.has(id))) return false;
  let chapter = 0;
  while (all.some(c => c.chapter === chapter) && all.filter(c => c.chapter === chapter).every(c => player.completed.includes(c.id))) chapter++;
  if (player.chapter !== chapter) return false;
  if (player.completed.some(id => (byId.get(id)?.chapter ?? 0) > chapter)) return false;
  if (player.companion === 'dragon' && !player.inventory.includes('bramble-friend')) return false;
  return true;
}
export function rewardCompletion(player: Profile, challenge: Challenge, all: readonly Challenge[]): Profile {
  if (player.completed.includes(challenge.id)) return player;
  const completed = [...player.completed, challenge.id];
  let chapter = player.chapter;
  while (all.some(c => c.chapter === chapter) && all.filter(c => c.chapter === chapter).every(c => completed.includes(c.id))) chapter++;
  const inventory = [...player.inventory];
  const achievements = [...player.achievements];
  if (completed.length === 1) achievements.push('first-word');
  if (completed.length >= 10 && !achievements.includes('word-finder')) achievements.push('word-finder');
  if (chapter > player.chapter) {
    const rewards = ['glow-lantern', 'star-rug', 'crystal-trophy', 'book-stack', 'moss-habitat', 'sky-wallpaper'];
    const item = rewards[Math.min(player.chapter, rewards.length - 1)];
    if (!inventory.includes(item)) inventory.push(item);
    if (chapter >= 5 && !inventory.includes('bramble-friend')) inventory.push('bramble-friend');
  }
  if (all.length && all.every(c => completed.includes(c.id)) && !achievements.includes('forest-guardian')) achievements.push('forest-guardian');
  return { ...player, completed, chapter, inventory, achievements, xp: player.xp + 20, coins: player.coins + 8 };
}


