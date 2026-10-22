import { z } from 'zod';
import { chapters, challenges } from '../src/content';

const text = z.string().trim().min(1);
const localized = z.object({ en: text, he: text.regex(/[\u0590-\u05ff]/, 'Hebrew text required') });
export const challengeSchema = z.object({
  id: text, chapter: z.number().int().nonnegative(),
  kind: z.enum(['hunt', 'forge', 'dialogue', 'listen', 'decoder', 'story']),
  skill: z.enum(['vocabulary', 'reading', 'listening', 'grammar', 'communication', 'writing']),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  objective: text, prompt: text, help: localized, hint: localized, explanation: localized,
  options: z.array(z.object({ id: text, text, art: text.optional() })),
  answers: z.array(z.array(text).min(1)).min(1), words: z.array(text).optional(), speaker: text.optional(), reactions: z.record(localized).optional(), sceneBeat: z.object({ art: z.enum(['map', 'feather']), followUp: text }).optional(),
}).superRefine((c, context) => {
  const issue = (message: string) => context.addIssue({ code: z.ZodIssueCode.custom, message });
  if (new Set(c.options.map(o => o.id)).size !== c.options.length) issue('Duplicate option IDs');
  if (new Set(c.answers.map(a => JSON.stringify(a))).size !== c.answers.length) issue('Duplicate answer alternatives');
  if (c.kind === 'forge' || c.kind === 'story') {
    if (!c.words?.length) issue('Construction challenge requires words');
    const tokens = (words: string[]) => JSON.stringify([...words].sort());
    for (const answer of c.answers)
      if (tokens(answer) !== tokens(c.words || [])) issue('Every construction answer must use exactly the available tokens');
  } else {
    if (c.options.length < 2) issue('Choice challenge requires at least two choices');
    for (const answer of c.answers)
      if (answer.length !== 1 || !c.options.some(o => o.id === answer[0])) issue('Answer must reference an available option ID');
    if (c.answers.length >= c.options.length) issue('Choice challenge needs an incorrect alternative');
  }
  if (c.reactions) for (const key of Object.keys(c.reactions)) if (!c.answers.some(a=>a.includes(key))) issue('Reaction must describe a valid response');
  if (c.kind === 'listen' && c.skill !== 'listening') issue('Listening challenge must track listening');
  if (c.sceneBeat && c.kind !== 'dialogue') issue('Scene beat must belong to dialogue');
});
export const contentSchema = z.object({
  chapters: z.array(z.object({ id: z.number().int().nonnegative(), name: localized, npc: text, intro: localized, outro: localized, reward: text })).min(1),
  challenges: z.array(challengeSchema).min(30),
}).superRefine((data, context) => {
  const issue = (message: string) => context.addIssue({ code: z.ZodIssueCode.custom, message });
  for (const key of ['chapters', 'challenges'] as const)
    if (new Set(data[key].map(row => row.id)).size !== data[key].length) issue(`Duplicate ${key} IDs`);
  for (const c of data.challenges)
    if (!data.chapters.some(chapter => chapter.id === c.chapter)) issue(`${c.id} references an unknown chapter`);
  for (const chapter of data.chapters)
    if (!data.challenges.some(c => c.chapter === chapter.id)) issue(`Chapter ${chapter.id} has no challenges`);
  if (new Set(data.challenges.map(c => c.kind)).size !== 6) issue('All six challenge kinds must be represented');
  if (new Set(data.challenges.map(c => c.skill)).size !== 6) issue('All six skills must be represented');
});

contentSchema.parse({ chapters, challenges });
console.log(`Validated ${challenges.length} challenges across ${chapters.length} chapters.`);

