import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
// One resumable command for all game-authored speech, effects and ambience.
const args = process.argv.slice(2);
let failed = false;
for (const [script, mode] of [['generate-voices.mjs', []], ['generate-voices.mjs', ['--slow']], ['generate-sounds.mjs', []]]) {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL(script, import.meta.url)), ...args, ...mode], { stdio: 'inherit' });
  if (result.status !== 0) failed = true;
}
process.exitCode = failed ? 1 : 0;
