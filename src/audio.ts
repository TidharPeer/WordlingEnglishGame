import { readSetting, writeSetting } from './storage';
import voiceManifest from './voice-manifest.json';
import slowVoiceManifest from './slow-voice-manifest.json';
import soundManifest from './sound-manifest.json';
export interface PronunciationProvider { available(text?: string): boolean; speak(text: string, rate: number, onUnavailable?: () => void): boolean; stop(): void }
/** Bundled ElevenLabs recordings only. Missing or blocked audio reveals the transcript. */
export class RecordedPronunciation implements PronunciationProvider {
  private active: HTMLAudioElement | null = null;
  private generation = 0;
  private failed = new Set<string>();
  constructor(private clips: Record<string, string> = voiceManifest, private slowClips: Record<string, string> = slowVoiceManifest) {}
  available(text?: string) {
    return typeof Audio !== 'undefined' && (text === undefined
      ? Object.keys(this.clips).some(key => !this.failed.has(this.clips[key]))
      : Boolean(this.clips[text] && !this.failed.has(this.clips[text])));
  }
  speak(text: string, rate: number, onUnavailable?: () => void): boolean {
    this.stop();
    const generation = this.generation;
    if (!this.available(text)) { onUnavailable?.(); return false; }
    const slow = rate < .85 && this.slowClips[text] && !this.failed.has(this.slowClips[text]);
    const url = slow ? this.slowClips[text] : this.clips[text];
    try {
      const clip = new Audio(url);
      this.active = clip;
      // Slow recordings contain explicit word gaps; normal recordings are never rewritten.
      clip.playbackRate = slow ? .8 : rate < .85 ? .55 : Math.min(1.2, rate / .85);
      clip.preservesPitch = true;
      const failed = () => {
        if (generation !== this.generation || this.active !== clip) return;
        this.failed.add(url);
        this.active = null;
        clip.onerror = null; clip.onended = null; clip.pause();
        if (slow) this.speak(text, rate, onUnavailable); else onUnavailable?.();
      };
      clip.onerror = failed;
      clip.onended = () => { if (this.active === clip) this.active = null; };
      void clip.play().catch(failed);
      return true;
    } catch {
      this.failed.add(url); if (slow) return this.speak(text, rate, onUnavailable); onUnavailable?.(); return false;
    }
  }
  stop() {
    this.generation++;
    if (this.active) {
      this.active.onerror = null; this.active.onended = null;
      this.active.pause(); this.active = null;
    }
  }
}
/** No synthetic fallback: ungenerated effects remain silent. */
export class RecordedSoundscape {
  private effects = new Set<HTMLAudioElement>();
  private music: HTMLAudioElement | null = null;
  constructor(private clips: Record<string, string> = soundManifest) {}
  play(kind: string) {
    const key = kind === 'wrong' ? 'retry' : kind === 'complete' ? 'reward' : kind;
    if (!this.clips[key] || typeof Audio === 'undefined') return;
    try {
      const clip = new Audio(this.clips[key]);
      clip.volume = .35;
      this.effects.add(clip);
      const release = () => { clip.onerror = null; clip.onended = null; clip.pause(); this.effects.delete(clip); };
      clip.onerror = release; clip.onended = release;
      void clip.play().catch(release);
    } catch { /* Optional sound does not block gameplay. */ }
  }
  startMusic() {
    if (this.music || !this.clips.woodland || typeof Audio === 'undefined') return;
    try {
      const clip = new Audio(this.clips.woodland);
      this.music = clip; clip.loop = true; clip.volume = .12;
      const failed = () => { if (this.music === clip) this.stopMusic(); };
      clip.onerror = failed;
      void clip.play().catch(failed);
    } catch { this.stopMusic(); }
  }
  stopMusic() {
    if (this.music) { this.music.onerror = null; this.music.pause(); this.music = null; }
  }
  stop() {
    this.stopMusic();
    for (const clip of this.effects) { clip.onerror = null; clip.onended = null; clip.pause(); }
    this.effects.clear();
  }
}
let pronunciation: PronunciationProvider = new RecordedPronunciation();
const soundscape = new RecordedSoundscape();
let enabled = readSetting('audio', 'true') === 'true';
let musicEnabled = readSetting('music', 'false') === 'true';
export function setPronunciationProvider(provider: PronunciationProvider) { pronunciation.stop(); pronunciation = provider; }
export function speechAvailable(text?: string) { return enabled && pronunciation.available(text); }
export function speak(text: string, rate = 0.85, onUnavailable?: () => void): boolean { if (!enabled) { onUnavailable?.(); return false; } return pronunciation.speak(text, rate, onUnavailable); }
export function stopSpeech() { pronunciation.stop(); }
function startMusic() { if (enabled && musicEnabled && !(typeof document !== 'undefined' && document.hidden)) soundscape.startMusic(); }
export function playSound(kind: string) { if (!enabled) return; soundscape.play(kind); startMusic(); }
export function setAudioEnabled(value: boolean) {
  enabled = value; writeSetting('audio', String(value));
  if (!value) { stopSpeech(); soundscape.stop(); } else startMusic();
}
export function setMusicEnabled(value: boolean) {
  musicEnabled = value; writeSetting('music', String(value));
  if (!value) soundscape.stopMusic(); else startMusic();
}
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => {
  if (document.hidden) { stopSpeech(); soundscape.stop(); } else startMusic();
});
