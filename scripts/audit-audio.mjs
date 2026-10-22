import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { voiceCatalog, slowVoiceCatalog } from '../src/voice-catalog.ts';
const root = fileURLToPath(new URL('../', import.meta.url));
const readJson = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const voices = await readJson('src/voice-manifest.json');
const slowVoices = await readJson('src/slow-voice-manifest.json');
const sounds = await readJson('src/sound-manifest.json');
const soundCatalog = await readJson('src/sound-catalog.json');
const entries = [...voiceCatalog().map(e => ({ type: 'voice', name: e.text, url: voices[e.text] })), ...slowVoiceCatalog().map(e => ({type:'slow voice', name:e.text,url:slowVoices[e.text]})), ...soundCatalog.map(e => ({ type: 'sound', name: e.id, url: sounds[e.id] }))];
for (const entry of entries) {
  const safePath = entry.url && /^\/audio\/(voices|sounds)\/[a-zA-Z0-9-]+\.mp3$/.test(entry.url);
  const bytes = safePath ? await readFile(resolve(root, 'public' + entry.url)).catch(() => null) : null;
  entry.status = bytes && bytes.length > 100 && (bytes.subarray(0, 3).toString() === 'ID3' || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)) ? 'present' : 'missing';
}
const report = { present: entries.filter(e => e.status === 'present').length, missing: entries.filter(e => e.status === 'missing').length, entries };
await writeFile(resolve(root, 'docs/audio-audit.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`${report.present} valid MP3 assets; ${report.missing} missing. See docs/audio-audit.json.`);
for (const entry of entries.filter(e => e.status === 'missing')) console.log(`Missing ${entry.type}: ${entry.name}`);
if (process.argv.includes('--strict') && report.missing) process.exitCode = 1;
