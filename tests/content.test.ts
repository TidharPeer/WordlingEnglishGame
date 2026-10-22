import { describe, expect, it } from 'vitest';
import { chapters, challenges } from '../src/content';
import { challengeSchema, contentSchema } from '../scripts/validate-content';

describe('authored curriculum integrity', () => {
  it('contains thirty or more valid authored challenges and six populated chapters', () => {
    expect(contentSchema.safeParse({ chapters, challenges }).success).toBe(true);
    expect(new Set(challenges.map(c => c.prompt)).size).toBe(challenges.length);
    expect(chapters.map(ch => challenges.filter(c => c.chapter === ch.id).length)).toEqual([6, 6, 6, 6, 6, 6]);
  });
  it('allows both natural responses to thanks and both relevant mystery questions', () => {
    expect(challenges.find(c => c.objective === 'Respond to a thank-you.')!.answers).toHaveLength(2);
    expect(challenges.find(c => c.objective === 'Ask a relevant question.')!.answers).toHaveLength(2);
  });
  it('rejects impossible tile answers and duplicate-token substitutions', () => {
    const build = challenges.find(c => c.kind === 'forge')!;
    expect(challengeSchema.safeParse({ ...build, answers: [['The', 'apple', 'is', 'is']] }).success).toBe(false);
    expect(challengeSchema.safeParse({ ...build, answers: [['The', 'apple', 'is']] }).success).toBe(false);
  });
  it('rejects unreachable answers, blank Hebrew, and duplicate option IDs', () => {
    const choice = challenges[0];
    expect(challengeSchema.safeParse({ ...choice, answers: [['missing']] }).success).toBe(false);
    expect(challengeSchema.safeParse({ ...choice, hint: { en: 'Hint', he: '' } }).success).toBe(false);
    expect(challengeSchema.safeParse({ ...choice, options: [choice.options[0], choice.options[0]] }).success).toBe(false);
  });
  it('rejects unknown chapters and repeated challenge IDs', () => {
    expect(contentSchema.safeParse({ chapters, challenges: challenges.map((c, i) => i ? c : { ...c, chapter: 99 }) }).success).toBe(false);
    expect(contentSchema.safeParse({ chapters, challenges: [...challenges, challenges[0]] }).success).toBe(false);
  });
});
