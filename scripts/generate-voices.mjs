import { selectEnglishVoice, providerError, safeFailure } from './voice-provider.mjs';
import { loadEnvFile } from 'node:process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { voiceCatalog, slowVoiceCatalog } from '../src/voice-catalog.ts';

// Run with: node scripts/generate-voices.mjs [--generate] [--limit=1]
// No cloud requests are made by default, even when credentials are present.
const root = fileURLToPath(new URL('../', import.meta.url));
try { loadEnvFile(resolve(root, '.env')); } catch (error) { if (error.code !== 'ENOENT') throw new Error('Could not load local .env file.'); }
const args = process.argv.slice(2);
if (args.some(arg => arg !== '--generate' && arg !== '--dry-run' && arg !== '--slow' && !/^--limit=\d+$/.test(arg))) {
  throw new Error('Usage: node scripts/generate-voices.mjs [--dry-run | --generate] [--slow] [--limit=N]');
}
const slow = args.includes('--slow');
const generate = args.includes('--generate') && !args.includes('--dry-run');
const limit = Number(args.find(arg => arg.startsWith('--limit='))?.split('=')[1] ?? Infinity);
const apiKey = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_LABS_API_KEY;
let voice = process.env.ELEVENLABS_VOICE_ID;
if (!voice) { try { voice = JSON.parse(await readFile(resolve(root, 'docs/voice-selection.json'), 'utf8')).voiceId; } catch { /* select on first generation */ } }
if (generate && apiKey && !voice) {
  try {
    const response = await fetch('https://api.elevenlabs.io/v2/voices?page_size=100', {
      headers: { 'xi-api-key': apiKey }, signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error(await providerError(response));
    const data = await response.json();
    const selected = selectEnglishVoice(data.voices || []);
    if (!selected) throw new Error('No English voice found among the returned account voices. Add an English voice to My Voices and set ELEVENLABS_VOICE_ID in .env.');
    voice = selected.voice_id;
    console.log('Selected English voice: ' + selected.name);
    // Persist only the non-secret voice choice so future runs use the same cache.
    await writeFile(resolve(root, 'docs/voice-selection.json'), JSON.stringify({voiceId:voice, name:selected.name}, null, 2) + '\n');
  } catch (error) {
    console.error(safeFailure(error));
    console.error('Could not select an English voice. Check network access and the key\'s Voices read permission, or set ELEVENLABS_VOICE_ID in .env. No recordings generated.');
    process.exit(1);
  }
}
const model = slow ? 'eleven_multilingual_v2' : process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';
const settings = { stability: 0.5, similarity_boost: 0.75, style: 0, use_speaker_boost: true };
const dir = resolve(root, 'public/audio/voices');
const manifestPath = resolve(root, slow ? 'src/slow-voice-manifest.json' : 'src/voice-manifest.json');
const catalog = slow ? slowVoiceCatalog() : voiceCatalog().map(e => ({...e, spokenText:e.text}));
const entries = catalog.map(entry => ({ ...entry, id: createHash('sha256').update(JSON.stringify({ text: entry.spokenText, voice: voice || 'UNCONFIGURED', model, settings })).digest('hex').slice(0, 24) }));
if (entries.length < (slow ? 1 : 36) || entries.some(entry => !entry.text.trim())) throw new Error('Voice catalog failed validation.');
await mkdir(dir, { recursive: true });
await writeFile(resolve(root, slow ? 'docs/slow-voice-plan.json' : 'docs/voice-plan.json'), JSON.stringify({ provider: 'ElevenLabs', model, configured: Boolean(apiKey && voice), clipCount: entries.length, characters: entries.reduce((n, e) => n + e.text.length, 0), entries }, null, 2) + '\n');
console.log(`${entries.length} clips, ${entries.reduce((n, e) => n + e.text.length, 0)} characters. Plan: docs/${slow ? 'slow-voice-plan' : 'voice-plan'}.json`);
if (!generate) {
  console.log('Dry run: no API calls or audio changes. Use --generate with local credentials to record.');
} else if (!apiKey || !voice) {
  console.error('Generation needs ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in .env or the local shell. No API calls made.');
  process.exitCode = 1;
} else {
  let manifest = {};
  try { manifest = JSON.parse((await readFile(manifestPath, 'utf8')).replace(/^\uFEFF/, '')); } catch { /* first run */ }
  const save = async () => {
    await writeFile(`${manifestPath}.tmp`, JSON.stringify(manifest, null, 2) + '\n');
    await rename(`${manifestPath}.tmp`, manifestPath);
  };
  let generated = 0;
  const validMp3 = bytes => bytes.length > 100 && (bytes.subarray(0, 3).toString() === 'ID3' || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0));
  for (const entry of entries) {
    const file = resolve(dir, `${slow ? 'slow-' : ''}${entry.id}.mp3`);
    const url = `/audio/voices/${slow ? 'slow-' : ''}${entry.id}.mp3`;
    try {
      const cached = await readFile(file).catch(() => null);
      if (cached && validMp3(cached)) { manifest[entry.text] = url; await save(); continue; }
      if (generated >= limit) continue;
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`, {
        method: 'POST', headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: entry.spokenText, model_id: model, voice_settings: settings }),
        signal: AbortSignal.timeout(60000),
      });
      // Do not log provider response bodies, request headers, or credentials.
      if (!response.ok) throw new Error(await providerError(response));
      const bytes = Buffer.from(await response.arrayBuffer());
      if (!validMp3(bytes)) throw new Error('Provider response was not a valid MP3 recording.');
      await writeFile(`${file}.tmp`, bytes);
      await rename(`${file}.tmp`, file);
      manifest[entry.text] = url;
      await save();
      generated++;
      console.log(`Saved ${entry.challenges.join(', ')} (${generated} new clips).`);
    } catch (error) {
      console.error(`Stopped at ${entry.challenges.join(', ')}. ${safeFailure(error)} Completed clips are retained; rerun to resume.`);
      process.exitCode = 1;
      break;
    }
  }
  console.log(`${generated} new recordings saved. Rebuild the game to bundle and precache them.`);
}
