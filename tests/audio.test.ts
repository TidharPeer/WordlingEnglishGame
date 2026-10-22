import { afterEach, describe, expect, it, vi } from 'vitest';
import { RecordedPronunciation, RecordedSoundscape, setAudioEnabled, setPronunciationProvider, speak } from '../src/audio';
import { voiceCatalog, slowVoiceCatalog, spacedSpeech } from '../src/voice-catalog';
import { challenges } from '../src/content';

function fixture() {
  const clips: ReturnType<typeof makeClip>[] = [];
  function makeClip() {
    let reject!: (reason?: unknown) => void;
    return { playbackRate: 1, preservesPitch: false, loop: false, volume: 1, pause: vi.fn(), onerror: null as null | (() => void), onended: null as null | (() => void), play: vi.fn(() => new Promise<void>((_, rejectPlay) => { reject = rejectPlay; })), reject: () => reject(new Error('blocked')) };
  }
  const Audio = vi.fn(function () { const clip = makeClip(); clips.push(clip); return clip; });
  vi.stubGlobal('Audio', Audio);
  return { provider: new RecordedPronunciation({ 'Hello!': '/audio/voices/hello.mp3' }), clips, Audio };
}
afterEach(() => { setAudioEnabled(true); vi.unstubAllGlobals(); });
describe('bundled pronunciation', () => {
  it('reports availability per text and reveals missing text without browser synthesis', () => {
    const { provider } = fixture();
    const unavailable = vi.fn();
    expect(provider.available('Hello!')).toBe(true);
    expect(provider.available('Missing')).toBe(false);
    expect(provider.speak('Missing', .85, unavailable)).toBe(false);
    expect(unavailable).toHaveBeenCalledOnce();
  });
  it('plays recordings with pitch-preserving slower playback', () => {
    const { provider, clips, Audio } = fixture();
    expect(provider.speak('Hello!', .6)).toBe(true);
    expect(Audio).toHaveBeenCalledWith('/audio/voices/hello.mp3');
    expect(clips[0].playbackRate).toBe(.55);
    expect(clips[0].preservesPitch).toBe(true);
  });
  it('reveals text once when both error event and rejection occur', async () => {
    const { provider, clips } = fixture();
    const unavailable = vi.fn();
    provider.speak('Hello!', .85, unavailable);
    clips[0].onerror?.(); clips[0].reject(); await Promise.resolve();
    expect(unavailable).toHaveBeenCalledOnce();
    expect(provider.available('Hello!')).toBe(false);
  });
  it('ignores late failure after cancellation', async () => {
    const { provider, clips } = fixture();
    const unavailable = vi.fn();
    provider.speak('Hello!', .85, unavailable); provider.stop();
    clips[0].reject(); await Promise.resolve();
    expect(clips[0].pause).toHaveBeenCalled();
    expect(unavailable).not.toHaveBeenCalled();
  });
  it('muting stops speech and subsequent requests reveal text', () => {
    const { provider, clips } = fixture();
    setPronunciationProvider(provider); speak('Hello!'); setAudioEnabled(false);
    expect(clips[0].pause).toHaveBeenCalled();
    const unavailable = vi.fn();
    expect(speak('Hello!', .85, unavailable)).toBe(false);
    expect(unavailable).toHaveBeenCalledOnce();
  });
  it('covers every spoken prompt and follow-up exactly once', () => {
    const catalog = voiceCatalog();
    expect(new Set(catalog.map(entry => entry.text)).size).toBe(catalog.length);
    for (const challenge of challenges) for (const text of [challenge.prompt, challenge.sceneBeat?.followUp].filter(Boolean)) expect(catalog.some(entry => entry.text === text && entry.challenges.includes(challenge.id))).toBe(true);
  });
});
describe('recorded effects and ambience', () => {
  it('does not attempt missing recordings', () => {
    const { Audio } = fixture();
    const player = new RecordedSoundscape({}); player.play('tap'); player.startMusic();
    expect(Audio).not.toHaveBeenCalled();
  });
  it('loops one quiet ambience track and immediately stops music', () => {
    const { clips } = fixture(); const player = new RecordedSoundscape({ woodland: '/audio/sounds/woodland.mp3' });
    player.startMusic(); player.startMusic();
    expect(clips).toHaveLength(1); expect(clips[0].loop).toBe(true); expect(clips[0].volume).toBeLessThan(.2);
    player.stopMusic(); expect(clips[0].pause).toHaveBeenCalledOnce();
  });
  it('stops all active effects and ambience on mute', () => {
    const { clips } = fixture(); const player = new RecordedSoundscape({ woodland: '/woodland.mp3', tap: '/tap.mp3' });
    player.startMusic(); player.play('tap'); player.stop();
    for (const clip of clips) expect(clip.pause).toHaveBeenCalled();
  });
  it('handles blocked effects and late music failure without stopping a newer track', async () => {
    const { clips } = fixture(); const player = new RecordedSoundscape({ woodland: '/woodland.mp3', tap: '/tap.mp3' });
    player.play('tap'); clips[0].reject();
    player.startMusic(); player.stopMusic(); player.startMusic(); clips[1].reject();
    await Promise.resolve();
    expect(clips[0].pause).toHaveBeenCalled(); expect(clips[2].pause).not.toHaveBeenCalled();
    player.stop();
  });
});

describe('word-spaced listening', () => {
  it('uses separate spaced recordings and preserves normal speech', () => {
    const {clips, Audio}=fixture(); const provider=new RecordedPronunciation({'Hello!':'/audio/voices/normal.mp3'}, {'Hello!':'/audio/voices/slow-test.mp3'});
    provider.speak('Hello!', .6); expect(Audio).toHaveBeenLastCalledWith('/audio/voices/slow-test.mp3'); expect(clips[0].playbackRate).toBe(.8);
    provider.speak('Hello!', .85); expect(clips[0].pause).toHaveBeenCalled(); expect(Audio).toHaveBeenLastCalledWith('/audio/voices/normal.mp3'); expect(clips[1].playbackRate).toBe(1);
  });
  it('falls back to slower normal recording if the spaced file fails',async()=>{
    const {clips,Audio}=fixture();const provider=new RecordedPronunciation({'Hello!':'/audio/voices/normal.mp3'},{'Hello!':'/audio/voices/slow-test.mp3'});const unavailable=vi.fn();provider.speak('Hello!',.6,unavailable);clips[0].reject();await Promise.resolve();expect(Audio).toHaveBeenLastCalledWith('/audio/voices/normal.mp3');expect(clips[1].playbackRate).toBe(.55);expect(unavailable).not.toHaveBeenCalled();expect(provider.available('Hello!')).toBe(true);
  });
  it('keeps contractions intact and inserts word gaps only',()=>{
    expect(spacedSpeech("Don't stop.")).toBe('Don\'t <break time="0.3s" /> stop.');expect(spacedSpeech('fox')).toBe('fox');expect(spacedSpeech('<fox> & dog')).toContain('&lt;fox&gt;');
  });
  it('covers every listening prompt but does not charge for other challenges',()=>{
    const catalog=slowVoiceCatalog();expect(catalog.length).toBe(new Set(challenges.filter(c=>c.kind==='listen').map(c=>c.prompt)).size);expect(catalog.every(e=>challenges.some(c=>c.kind==='listen'&&c.prompt===e.text))).toBe(true);
  });
});
