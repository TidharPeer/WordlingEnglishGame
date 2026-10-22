import { challenges } from './content.ts';

/** Every currently spoken challenge prompt plus authored scene follow-ups. */
export function voiceCatalog() {
  const entries = new Map<string, { text: string; challenges: string[] }>();
  for (const challenge of challenges) {
    for (const text of [challenge.prompt, challenge.sceneBeat?.followUp]) {
      if (!text) continue;
      const entry = entries.get(text) ?? { text, challenges: [] };
      if (!entry.challenges.includes(challenge.id)) entry.challenges.push(challenge.id);
      entries.set(text, entry);
    }
  }
  return [...entries.values()];
}

/** Keep contractions intact; explicit SSML pauses separate words, not syllables. */
export function spacedSpeech(text: string) {
  return text.trim().split(/\s+/).map(word => word.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')).join(' <break time="0.3s" /> ');
}
export function slowVoiceCatalog() {
  const texts = new Set(challenges.filter(c => c.kind === 'listen').map(c => c.prompt));
  return voiceCatalog().filter(e => texts.has(e.text)).map(e => ({...e, spokenText: spacedSpeech(e.text)}));
}
