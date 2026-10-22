# WORDLINGS — The Lost Worlds

A local-first browser adventure about restoring language to Whispering Woods. This source contains World 1, 36 authored English challenges, six short story chapters, original painted character sprites and layered SVG environments, a Phaser map, and an illustrated Word Hunt scene with Phaser animation and accessible DOM targets, a physical Mystery Decoder encounter, and six character-led Dialogue Quests. The picnic-map request unfolds a map in the scene. Later worlds are designed in [docs/design.md](docs/design.md) and are not playable.

## Run

Use Node 20.19+ (Node 24 recommended). In a network-enabled environment:

```sh
npm install
npm run validate
npm test
npm run dev
npm run build
```

Open the local URL printed by Vite. The live development journal is at `/progress.html`. The short Gauntlet prompt is in [GAUNTLET.md](GAUNTLET.md).

No login, API key, backend, or cloud setup is required. Progress is stored in this browser's IndexedDB; settings use localStorage. Export a backup from Settings; restore it from the title screen or Settings. The PWA caches assets after a production visit. Browser storage is not a permanent backup.

All speech uses bundled ElevenLabs recordings: 38 clips are present and verified for offline playback. There is no browser-voice or synthetic-tone fallback. Four sound effects and a woodland ambience loop are bundled. Seven dedicated word-spaced listening clips await generation; until then slow mode uses the original recording at55% speed. Run `node scripts/generate-audio.mjs --generate` with your local ElevenLabs credentials to generate missing assets, then `npm run build`. See [audio setup](docs/natural-voices.md). No credentials or cloud requests are used at runtime.

## Verification status

The dependency-free curriculum check passed (`node --experimental-strip-types scripts/check-content.mjs`), as did the bilingual UI-key check (`node scripts/check-i18n.cjs`). A local Zod-backed progression smoke check completed all 36 challenges and six chapters, and source-rendered Chrome captures were inspected at desktop and mobile widths. The first challenge has separate touch targets from 320 to 1280 px and an on-screen Continue button in the 320/375 px success state. Dialogue scenes and the map reveal were inspected at mobile widths; two valid answers in the Tock encounter show different reactions. These previews mock hooks and do not prove gameplay. Dependencies are now installed. `npm run validate`, `npm test` (45 tests), and `npm run build` pass in this workspace. An isolated Chrome run of the production preview completed all 36 challenges and six chapters, verified the journal, parent view, home decoration, earned-coin purchase, independent sibling profile, and progress restoration after a browser restart. With network emulation set offline and the service worker controlling the page, the app reloaded, replayed a challenge, and saved that attempt to IndexedDB. The run had no browser errors; details are in [docs/live-playthrough-report.json](docs/live-playthrough-report.json). Real child playtesting, device audio and touch checks, and a fresh full-game visual A/B comparison remain pending. Source-rendered art was compared against the supplied reference. See `/progress.html` for the current critique and revision record.






Latest review: six painted NPCs now appear consistently in story, quest and dialogue views. Speaker icons are23px with44px targets; dialogue hints have their own row. Actual Chrome review covered all36 challenges, Hebrew/English mobile and desktop screens, rewards, home, siblings, restart and offline play. All38 voice files decoded and played offline (technical playback check; human listening and real device touch/playtesting remain pending). Evidence: [audio report](docs/audio-browser-report.json), [playthrough report](docs/live-playthrough-report.json).

Publishing instructions and the guarded init/commit/push helper are in [docs/publish.md](docs/publish.md). No push has been made from this environment.
