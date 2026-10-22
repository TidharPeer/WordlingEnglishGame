# Independent content critique

> Round 2 update: the code has since addressed the cited hint attribution, audio privacy, stale writes, backup collisions, reward messaging, cast overlap, chapter reward names, and basic Word Hunt/Decoder interaction gaps. The findings below preserve the critic's original inspection and still require a running browser recheck.


Static review of src/content.ts, src/ChallengeView.tsx, src/App.tsx, src/model.ts, src/i18n.ts, and docs/design.md. Findings describe the inspected implementation before concurrent fixes, not a rendered or child-tested result.

## Highest priority

1. **Hinted retries can count as independent.** ChallengeView shows c.hint after the first wrong answer, but computes assistance using errors >= 2. A correct second attempt after reading that hint is recorded as unassisted. Assistance should latch as soon as any hint or answer support is shown.
2. **Silent devices can receive listening mastery for reading.** !speechAvailable() exposes the prompt, but is absent from assisted. Speech failures and mute also need a written fallback and supported evidence. Showing the transcript must never count as independent listening.
3. **The parent mastery visualization rewards supported answers.** updateAttempt increments skills.correct for every correct answer. App uses s.level * 25 + s.correct * 2 for progress width. Repeated supported answers fill the bar without level increases. Use independent evidence separately and label supported practice distinctly.
4. **Six advertised kinds collapse to two interaction structures.** ChallengeView uses one ordered-token branch for forge/story and one immediate multiple-choice branch for hunt/dialogue/listen/decoder. Listening adds audio, but hunt is labeled answer cards rather than finding objects in a scene; decoder is another card selection. Add scene/location interaction or clue combination before claiming six different gameplay mechanics.

## Content and narrative

- There are **36 distinct authored challenges**, six chapters, all six skills, bilingual help/hints/explanations, and valid-looking answer sets. Most English is natural for beginner supported practice. Two dialogues correctly accept multiple natural answers.
- The guardian rescue has an ending and next-world hook. The larger mystery deliberately remains unresolved; docs identify later worlds as expansions. Do not claim a complete five-world playable story.
- Companion identities conflict: design says Moss/Ember/Ripple, App offers Pip/Moss/Luma. Pip and Luma also serve as NPCs: choosing Luma while searching for missing Luma confuses the mystery. Reconcile cast and starters.
- Chapter content rewards (leaf-lamp, picnic-rug, etc.) differ from rewardCompletion inventory rewards (glow-lantern, star-rug, etc.). The outro names one item and illustrates the last inventory item, potentially a different item on replay.
- “Open the lantern, please” is grammatical but unnatural for illuminating a bridge. Prefer “Light the lantern, please” with matching tiles, hint, and explanation.
- Constructed sentences omit terminal punctuation, and the polite instruction omits its comma. Add display punctuation or make the supported-syntax limitation clear.
- Story Builder measures sequencing, not independent writing. Design acknowledges this; parent-facing “Writing” should also identify supported construction.
- The difficulty-3 book question is easier than some medium questions: pages with key/leaf/book alternatives is trivial. Difficulty tags need review and do not establish adaptive content selection.

## Hebrew completeness

- Bilingual curriculum support and interface key parity exist. English target prompts/options should remain English.
- The chapter outro displays untranslated raw currentChapter.reward such as leaf-lamp.
- Hebrew ending says השומר בטוח (male guardian), but the story describes Luma as female. Use השומרת בטוחה.
- Challenge speaker labels retain English NPC names; localize display names with stable internal IDs.
- The spoken-number hint uses אחת, שתיים, שלוש whereas apples are masculine. Use אחד, שניים, שלושה or retain the English sequence because this is English listening practice.

## Validation delivered

scripts/validate-content.ts adds Zod checks for quantity, skill/kind coverage, Hebrew support, chapter references, unique IDs, reachable option answers, and exact construction-token multisets. tests/content.test.ts covers malformed-content rejection and intentional alternate-answer cases.

These checks cannot establish pedagogical quality, mechanic diversity, complete UI translation, rendered RTL behavior, or assistance attribution. Runtime validation was not executed here because dependencies were not installed during review.
