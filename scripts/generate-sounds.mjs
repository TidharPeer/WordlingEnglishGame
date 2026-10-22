import { loadEnvFile } from 'node:process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
try { loadEnvFile(resolve(root, '.env')); } catch (error) { if (error.code !== 'ENOENT') throw new Error('Could not load .env.'); }
const args = process.argv.slice(2);
if (args.some(arg => !['--generate', '--dry-run'].includes(arg) && !/^--limit=\d+$/.test(arg))) throw new Error('Usage: node scripts/generate-sounds.mjs [--generate | --dry-run] [--limit=N]');
const generate = args.includes('--generate') && !args.includes('--dry-run');
const limit = Number(args.find(arg => arg.startsWith('--limit='))?.split('=')[1] ?? Infinity);
const apiKey = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_LABS_API_KEY;
const catalog = JSON.parse(await readFile(resolve(root, 'src/sound-catalog.json'), 'utf8'));
const manifestPath = resolve(root, 'src/sound-manifest.json');
const model = 'eleven_text_to_sound_v2';
const validMp3 = bytes => bytes.length > 100 && (bytes.subarray(0, 3).toString() === 'ID3' || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0));
const dir = resolve(root, 'public/audio/sounds');
let manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
let generated = 0;
for (const { id, ...prompt } of catalog) {
  const body = { ...prompt, model_id: model, prompt_influence: .3 };
  const hash = createHash('sha256').update(JSON.stringify(body)).digest('hex').slice(0, 24);
  const filename = `${id}-${hash}.mp3`;
  const file = resolve(dir, filename);
  const cached = await readFile(file).catch(() => null);
  if (cached && validMp3(cached)) {
    if (generate) { manifest[id] = `/audio/sounds/${filename}`; await save(); }
    console.log(`${id}: cached`); continue;
  }
  console.log(`${id}: missing (${prompt.duration_seconds}s${prompt.loop ? ', loop' : ''})`);
  if (!generate || generated >= limit) continue;
  if (!apiKey) { console.error('Set ELEVENLABS_API_KEY or ELEVEN_LABS_API_KEY in .env.'); process.exitCode = 1; break; }
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128', {
      method: 'POST', headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(120000),
    });
    if (!response.ok) throw Object.assign(new Error(), { status: response.status });
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!validMp3(bytes)) throw new Error();
    await mkdir(dir, { recursive: true });
    await writeFile(`${file}.tmp`, bytes); await rename(`${file}.tmp`, file);
    manifest[id] = `/audio/sounds/${filename}`; await save(); generated++;
    console.log(`${id}: saved`);
  } catch (error) {
    // Never echo request headers, provider response bodies, or arbitrary exception messages.
    const code = error?.cause?.code || error?.code;
    const diagnostic = ['EACCES', 'ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT'].includes(code) ? ` (${code})` : error.status ? ` (HTTP ${Number(error.status)})` : '';
    console.error(`Sound generation stopped${diagnostic}. Check network, Sound Effects key permission and quota. Completed files retained; rerun to resume.`);
    process.exitCode = 1; break;
  }
}
async function save() {
  await writeFile(`${manifestPath}.tmp`, JSON.stringify(manifest, null, 2) + '\n');
  await rename(`${manifestPath}.tmp`, manifestPath);
}
console.log(generate ? `${generated} new sound files. Rebuild to precache recordings.` : 'Dry run: no requests or audio changes.');
