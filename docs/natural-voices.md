# Bundled ElevenLabs audio

All game sound playback uses local MP3 files: speech, interface effects, rewards and the optional woodland ambience. There is no browser speech synthesis or oscillator fallback, and the client never calls ElevenLabs. Missing or failed speech reveals the transcript; missing effects stay silent. Muting stops active speech, effects and ambience immediately. The ambience toggle stops its loop immediately, and hiding the page stops audio.

Current asset audit: **38 normal speech recordings and five sound recordings present; seven word-spaced slow recordings pending**. Run `node scripts/audit-audio.mjs` for the current report in `docs/audio-audit.json`; add `--strict` to fail when anything is missing. Header checks verify that files resemble MP3s, not their listening quality.

## Generate all missing audio

Use Node.js 22.18 or newer from the project directory:

```sh
node scripts/generate-audio.mjs --dry-run
node scripts/generate-audio.mjs --generate
node scripts/audit-audio.mjs --strict
npm run build
```

The generator reads the existing local `.env`. Both `ELEVENLABS_API_KEY` and `ELEVEN_LABS_API_KEY` work. Keep credentials out of `VITE_` variables and source control. A configured `ELEVENLABS_VOICE_ID` is reused. If none is set, the generator reuses `docs/voice-selection.json` when present or selects an English voice and saves that choice. Voice generation requires Text to Speech permission; automatic voice selection requires Voices read; effect generation requires Sound Effects permission. Only authored game prompts from the catalogs are sent, never player names or answers.

The wrapper runs the voice and sound generators independently, retaining completed files on failure. Rerunning reuses valid cached files. `--limit=1` generates at most one new normal voice, one new slow voice and one new sound, useful for reviewing samples. The default command is a dry run with no API requests. Generation uses account quota. A network failure leaves files pending; rerun from a shell with access to the ElevenLabs API.

`src/voice-catalog.ts` covers every spoken challenge prompt and scene follow-up, deduplicated by exact text. `src/sound-catalog.json` defines four effects and one 30-second seamless woodland ambience loop. The runtime manifests only contain successfully saved recordings. Content and generation settings determine cache filenames, so changed prompts generate new files. Effects can be generated separately with `node scripts/generate-sounds.mjs --generate`.

Listen to the resulting files before shipping, then commit MP3s and both manifests together. Build again and reload the installed app to update its offline cache. PWA precaching includes MP3 files. Slower pronunciation preserves pitch; normal playback uses the recording's original speed.

Generation follows the official ElevenLabs [speech API](https://elevenlabs.io/docs/api-reference/text-to-speech/convert) and [sound effects API](https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert). Speech uses `eleven_multilingual_v2`; effects and ambience use `eleven_text_to_sound_v2` with loop generation enabled for ambience.


## Word-spaced slow listening
Listening challenges now have a separate slow recording manifest. Generate seven clips with `node scripts/generate-voices.mjs --slow --generate`, or use the all-audio wrapper. Each clip requests300ms SSML pauses between words using Multilingual v2, then plays at80% speed with pitch preserved. Normal recordings remain unchanged. Before generation, the player falls back to55% speed; that fallback does not insert word gaps. Selecting slower/normal immediately replays the prompt. Listen to generated clips to confirm pronunciation and pauses before publication.
