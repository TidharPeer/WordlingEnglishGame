# Systems critique

> Round 2 update: the code has since addressed the cited hint attribution, audio privacy, stale writes, backup collisions, reward messaging, cast overlap, chapter reward names, and basic Word Hunt/Decoder interaction gaps. The findings below preserve the critic's original inspection and still require a running browser recheck.


Independent source review of `src/model.ts`, `src/storage.ts`, `src/store.ts`, `src/audio.ts`, `tests/systems.test.ts`, and related challenge UI. No browser playthrough was performed by this critic.

## Prioritized findings

1. **High: multi-tab writes can silently lose progress.** `store.ts` serializes operations within one module instance, but transforms its in-memory player; `storage.save` overwrites the complete IndexedDB row. Two tabs loading the same profile can each save stale copies, erasing the other's completion, mastery, decorations, or play time. There is no transaction covering read/transform/write, revision check, or synchronization between tabs. Existing concurrent-completion test exercises a single store only.
2. **High: pronunciation does not enforce local-only processing.** `BrowserPronunciation.speak` selects an `en-US` local voice when available, but calls speech synthesis even if none exists. The browser may then use a remote default voice. `available()` only checks API presence, not an available local voice or actual speech success. Require a local voice and expose a transcript fallback if unavailable; account for asynchronously loaded voices.
3. **High: restoring an older backup silently replaces newer progress.** `storage.import` uses `bulkPut` for matching profile IDs. Schema validation prevents malformed structure but does not prevent a valid old backup from rolling back XP, completions, mastery, or sibling profiles included in that backup. The import interaction needs an explicit conflict/replace policy and recoverable pre-import state. Full import atomicity is otherwise a positive.
4. **Medium: one corrupt saved profile blocks every sibling.** `storage.list` maps all records through throwing validation. One invalid row rejects the complete list, and `init` marks the application ready without loading healthy profiles. Keep invalid records recoverable and surface per-profile errors while loading healthy siblings.
5. **Medium: assistance classification overstates independent mastery.** Challenge UI displays the hint after the first wrong answer, but `assisted` remains false until two errors or manual hint. Automatic transcript fallback when speech is unavailable also leaves `assisted` false. Both paths can record prompted success as independent listening/other mastery.
6. **Medium: replay feedback promises rewards not granted.** Successful challenges always display `+20 XP · +8 coins`, including completed reviews where `rewardCompletion` correctly makes no payment. Render the actual reward delta.
7. **Medium: backup validation is structural rather than consistent.** Duplicate completion/inventory/decoration IDs, unknown item/challenge IDs, decorations for unowned items, and inconsistent chapter/completion state are accepted. That can alter progression/achievements after restore. Decide which invariants must hold, including compatibility with future content, then validate those explicitly.

## Positive evidence from source

- Per-profile skills are six separate records; updateAttempt changes only the targeted skill.
- A single store's mutation queue serializes duplicate completions and saves before publishing state.
- Completion checks successful attempt history and avoids repeated XP/coin payment.
- Backup parsing enforces format/version, unique profile IDs, bounded arrays, valid coordinate range, and correct-count bounds.
- Import validates all supplied profiles before starting its transaction.
- Settings use localStorage defensively; IndexedDB stores progress.

## Verification status

Test execution is blocked: Vitest is not installed, and the npm installation log reports repeated registry fetch failures with `EACCES`. No passing test run is claimed. Existing test source covers basic adaptive mastery, reward idempotency, review timing, sibling persistence/removal, invalid backup rejection, all-before-write validation, and single-store concurrency. Missing checks include failed storage writes and recovery, schema migration, two-tab conflicts, import conflicts, corrupt-profile isolation, pronunciation availability/local voice requirements, and restored UI progress.

This review does not establish real-browser offline support, save persistence after reload, audio playback, or a complete child playthrough.
