import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Creature, ObjectArt, ForestBackdrop } from './Art';
import { useGame } from './store';
import { type Challenge } from './model';
import { speak, stopSpeech, playSound, speechAvailable } from './audio';
import { readSetting } from './storage';
import { WordHuntScene } from './WordHuntScene';
import { ConversationSpeakerArt } from './ConversationSpeakerArt';
export function ChallengeView({ challenge: c, onNext, onExit, index, total }: {
    challenge: Challenge;
    onNext: () => void;
    onExit: () => void;
    index: number;
    total: number;
}) {
    const inFlight=useRef(false),assistanceShown=useRef(false);
 const { t, i18n } = useTranslation();
    const lang = i18n.language === 'he' ? 'he' : 'en';
    const game = useGame();
    const [revealed, setRevealed] = useState<number[]>([]), [placed, setPlaced] = useState<number[]>([]), [selected, setSelected] = useState<string[]>([]), [wrong, setWrong] = useState(false), [success, setSuccess] = useState(false), [errors, setErrors] = useState(0), [hint, setHint] = useState(false), [transcript, setTranscript] = useState(false), [rate, setRate] = useState(.85), [busy, setBusy] = useState(false), [decoderContinueReady, setDecoderContinueReady] = useState(false);
    const [saveFailed, setSaveFailed] = useState(false);
    const assisted = hint || errors >= 1 || (c.kind === 'listen' && (transcript || !speechAvailable(c.prompt) || readSetting('audio', 'true') !== 'true'));
    useEffect(() => { if (c.kind === 'listen' && (transcript || !speechAvailable(c.prompt))) assistanceShown.current = true; });
    const [wasNew] = useState(() => !game.player?.completed.includes(c.id));
    const physicalDecoder = c.id === 'woods-06';
    const sceneDialogue = c.kind === 'dialogue';
    const clueParts = c.kind === 'decoder' ? c.prompt.match(/[^.!?]+[.!?]?/g)?.map(s => s.trim()).filter(Boolean) || [c.prompt] : [];
    const build = c.kind === 'forge' || c.kind === 'story';
    const words = c.words || c.options.map(o => o.text);
    const shuffled = words.map((w, i) => ({ w, i })).sort((a, b) => ((a.i * 7 + 3) % 11) - ((b.i * 7 + 3) % 11));
    useEffect(() => () => stopSpeech(), []);
    useEffect(() => {
        if (!physicalDecoder || !success) return;
        const timer = window.setTimeout(() => setDecoderContinueReady(true), 800);
        return () => window.clearTimeout(timer);
    }, [physicalDecoder, success]);
    function placeOnSign(id: string) {
        if (!physicalDecoder || busy || success || revealed.length < clueParts.length) return;
        setSelected([id]);
        setWrong(false);
        void answer([id]);
    }
    async function answer(answer: string[]) { if (inFlight.current || success)
        return; inFlight.current=true; setBusy(true); setSaveFailed(false); const normalize = (s: string) => s.toLowerCase().replace(/[.!?,]/g, '').trim().replace(/\s+/g, ' '); const correct = c.answers.some(valid => valid.length === answer.length && valid.every((v, i) => normalize(v) === normalize(answer[i]))); try {
        await game.recordAttempt(c, correct, assisted||assistanceShown.current);
        if (correct) {
            await game.completeChallenge(c);
            setSuccess(true);
            setWrong(false);
            playSound('success');
        }
        else {
            if (physicalDecoder) setSelected([]);
            setWrong(true);
            assistanceShown.current=true; setHint(true);
            setErrors(n => n + 1);
            playSound('retry');
        }
    }
    catch { setSaveFailed(true); setWrong(false); setSelected([]); }
    finally {
        inFlight.current=false; setBusy(false);
    } }
    const add = (idx: number) => { if (!placed.includes(idx) && !success) {
        setPlaced(p => [...p, idx]);
        setWrong(false);
        playSound('tap');
    } };
    return <main className="quest-screen"><ForestBackdrop className="quest-backdrop"/><header className="quest-top"><button className="round-button" onClick={onExit} aria-label={t('back')}><IconArrow /></button><div><span className="eyebrow">{t(c.kind === 'listen' ? 'listening' : c.kind)}</span><p>{t('challenge', { n: index + 1, total })}</p></div><div className="quest-progress" aria-hidden="true"><span style={{ width: `${index / total * 100}%` }}/></div></header><section className={`challenge-panel ${c.kind} ${physicalDecoder ? 'physical-decoder' : ''} ${sceneDialogue ? 'scene-dialogue' : ''} ${success ? 'completed' : ''}`}>
 {!sceneDialogue && <><div className="quest-guide"><ConversationSpeakerArt speaker={c.speaker} size={95} happy={success}/><div><span className="eyebrow">{t(`npc${c.speaker}`, { defaultValue: c.speaker || 'Nim' })}</span><p>{c.help[lang]}</p></div></div>
 <div className="clue"><div className="clue-controls"><button className="round-button" onClick={() => speak(c.prompt, rate, () => { assistanceShown.current=true; setTranscript(true) })} aria-label={t('listen')} title={t('listen')}><SoundIcon /></button>{c.kind === 'listen' && <button className="small-button" onClick={() => { const nextRate = rate === .85 ? .6 : .85; setRate(nextRate); speak(c.prompt, nextRate, () => { assistanceShown.current=true; setTranscript(true) }); }}>{t(rate === .85 ? 'slower' : 'normal')}</button>}</div>{c.kind === 'decoder' ? <h2>{t('openClues')}</h2> : c.kind !== 'listen' || transcript || !speechAvailable(c.prompt) ? <h2 dir="ltr" lang="en">{c.prompt}</h2> : <><h2>{t('listenPrompt')}</h2><button className="text-button" onClick={() => {assistanceShown.current=true;setTranscript(true)}}>{t('transcript')}</button></>}{!speechAvailable(c.prompt) && c.kind === 'listen' && <small>{t('noSpeech')}</small>}</div></>}
 {c.kind === 'decoder' && <div className="decoder-clues" dir="ltr">{clueParts.map((part, i) => <button key={i} className={revealed.includes(i) ? 'revealed' : ''} onClick={() => setRevealed(r => r.includes(i) ? r : [...r, i])}>{revealed.includes(i) ? part : `✧ ${t('clue')} ${i + 1}`}</button>)}</div>}
 {build ? <><p className="build-help">{t('selectWord')}</p><div className={`sentence-slot ${wrong ? 'wrong' : ''}`} dir="ltr" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const n = Number(e.dataTransfer.getData('text/plain')); if (Number.isInteger(n) && n >= 0 && n < words.length)
        add(n); }} aria-label={t('forge')}>{placed.map(idx => <button key={idx} className="word-tile placed" onClick={() => { setPlaced(p => p.filter(n => n !== idx)); setWrong(false); }} disabled={success}>{words[idx]}</button>)}{!placed.length && <span className="slot-spark" aria-hidden="true">✧ — ✧</span>}</div><div className="word-bank" dir="ltr">{shuffled.map(({ w, i }) => <button key={i} className="word-tile" draggable={!placed.includes(i) && !success} onDragStart={e => e.dataTransfer.setData('text/plain', String(i))} disabled={placed.includes(i) || success} onClick={() => add(i)}>{w}</button>)}</div><div className="forge-actions"><button className="text-button" onClick={() => setPlaced([])} disabled={success}>{t('clear')}</button><button className="gold-button" onClick={() => answer(placed.map(i => words[i]))} disabled={!placed.length || busy || success}>{t('check')}<span>✧</span></button></div></> : c.kind === 'hunt' ? <WordHuntScene chapter={c.chapter} companion={game.player?.companion} options={c.options} selected={selected[0]} disabled={busy||success} scaffoldIds={errors >= 2 ? c.answers.flat() : []} success={success} restoredWord={c.answers[0][0]} onChoose={id=>{setSelected([id]);void answer([id])}}/> : physicalDecoder ? <MysteryDecoder options={c.options} selected={selected[0]} revealed={revealed.length === clueParts.length} success={success} busy={busy} scaffold={errors >= 2} lang={lang} onSelect={id => { setSelected([id]); setWrong(false); playSound('tap'); }} onPlace={placeOnSign}/> : sceneDialogue ? <ConversationScene challenge={c} companion={game.player?.companion} lang={lang} selected={selected[0]} success={success} busy={busy} scaffold={errors >= 2} onChoose={id => { setSelected([id]); void answer([id]); }}/> : <div className={`answer-scene ${c.kind === 'hunt' ? 'object-hunt' : ''} ${c.kind === 'decoder' ? 'decoder-room' : ''}`} dir="ltr">{c.options.map((o, i) => <button key={o.id} className={`answer-object ${selected.includes(o.id) ? 'chosen' : ''} ${errors >= 2 && c.answers.some(a => a.includes(o.id)) ? 'scaffold' : ''}`} disabled={busy || success || (c.kind === 'decoder' && revealed.length < clueParts.length)} aria-label={o.text} onClick={() => { setSelected([o.id]); void answer([o.id]); }}><span className="object-illustration">{o.art ? <ObjectArt kind={o.art} size={c.kind === 'hunt' ? 116 : 84}/> : c.kind === 'dialogue' ? <span className="speech-mark">“</span> : <span className="answer-number">{i + 1}</span>}</span>{c.kind !== 'hunt' && <span lang="en">{o.text}</span>}{success && selected.includes(o.id) && <b className="answer-tick">✓</b>}</button>)}</div>}
 {!success && <div className="help-row"><button className="text-button" onClick={() => {assistanceShown.current=true;setHint(true)}}>{t('hint')} <span>✧</span></button>{hint && <p className="hint-message">{c.hint[lang]}</p>}</div>}
 {wrong && !success && <div className="feedback retry" role="status"><strong>{t('incorrect')}</strong><p>{errors >= 2 ? t('supportExplain') : c.hint[lang]}</p>{errors >= 2 && build && <button className="small-button" onClick={() => { const used: number[] = []; c.answers[0].forEach(word => { const idx = words.findIndex((w, i) => w === word && !used.includes(i)); if (idx >= 0)
        used.push(idx); }); setPlaced(used); assistanceShown.current=true;setHint(true); setWrong(false); }}>{t('support')}</button>}</div>}
 {saveFailed && !success && <div className="feedback retry" role="alert"><strong>{t('saveError')}</strong></div>}
 {success && (!physicalDecoder || decoderContinueReady) && <div className="feedback success" role="status"><div><strong>✓ {t('correct')}</strong>{!sceneDialogue && <p>{c.reactions?.[selected[0]]?.[lang]||c.explanation[lang]}</p>}{wasNew && <small>+20 {t('xp')} · +8 {t('coins')}</small>}</div><button className="gold-button" onClick={onNext}>{t('next')} <IconArrow /></button></div>}
 </section></main>;
}
function ConversationScene({ challenge, companion, lang, selected, success, busy, scaffold, onChoose }: {
    challenge: Challenge;
    companion?: string;
    lang: 'he' | 'en';
    selected?: string;
    success: boolean;
    busy: boolean;
    scaffold: boolean;
    onChoose: (id: string) => void;
}) {
    const { t } = useTranslation();
    const reply = challenge.reactions?.[selected || '']?.[lang] || challenge.explanation[lang];
    const speakerName = t(`npc${challenge.speaker}`, { defaultValue: challenge.speaker || 'Friend' });
    return <div className={'conversation-stage' + (success ? ' answered' : '')} dir="ltr">
        <ForestBackdrop className="conversation-forest"/>
        <div className="conversation-clearing" aria-hidden="true"/>
        <div className="conversation-guide" aria-hidden="true"><ConversationSpeakerArt speaker={challenge.speaker} happy={success}/></div>
        {companion && <div className="conversation-companion" aria-hidden="true"><Creature kind={companion as 'pip' | 'moss' | 'luma' | 'dragon'} size={92} happy={success}/></div>}
        <div className="conversation-line" dir={lang === 'he' ? 'rtl' : 'ltr'}>
            <span className="eyebrow">{speakerName}</span>
            {success ? <p className="conversation-reply" role="status" lang={lang} dir={lang === 'he' ? 'rtl' : 'ltr'}>{reply}</p> : <p lang="en" dir="ltr">{challenge.prompt}</p>}
            {!success && <button className="round-button" onClick={() => speak(challenge.prompt, .85)} aria-label={t('listen')} title={t('listen')}><SoundIcon/></button>}
        </div>
        {!success && <>
            <p className="conversation-instruction" dir={lang === 'he' ? 'rtl' : 'ltr'}>{t('dialogueChooseReply', { name: speakerName })}</p>
            <div className="conversation-choices" role="group" aria-label={t('dialogueChooseReply', { name: speakerName })}>
                {challenge.options.map((option, index) => <button key={option.id} type="button"
                    className={'conversation-choice choice-' + index + (selected === option.id ? ' chosen' : '') + (scaffold && challenge.answers.some(a => a.includes(option.id)) ? ' scaffold' : '')}
                    lang="en" dir="ltr" disabled={busy} onClick={() => onChoose(option.id)}>{option.text}</button>)}
            </div>
        </>}
        {success && challenge.sceneBeat && <div className={'conversation-event conversation-' + challenge.sceneBeat.art} aria-label={challenge.sceneBeat.followUp}>
            {challenge.sceneBeat.art === 'map' ? <svg viewBox="0 0 150 112" width="150" height="112" aria-hidden="true"><path d="M8 12Q43 1 76 14Q111 1 142 12V100Q108 88 76 102Q42 87 8 100Z" fill="#f9e7ae" stroke="#9e773f" strokeWidth="5"/><path d="M76 14V101" stroke="#d8bd79" strokeWidth="3"/><path d="M33 73Q45 52 62 68Q79 84 89 60Q101 40 121 38" fill="none" stroke="#a77b43" strokeWidth="4" strokeDasharray="5 7" strokeLinecap="round"/><circle cx="30" cy="76" r="8" fill="#7aab70"/><path d="M119 27Q133 25 128 39Q121 48 113 39Q108 32 119 27Z" fill="#76c9d3" stroke="#377c8b" strokeWidth="2"/></svg> : <svg viewBox="0 0 150 112" width="150" height="112" aria-hidden="true"><path d="M24 85Q50 13 130 14Q109 46 59 82Q38 94 24 85Z" fill="#78c7d2" stroke="#f0eac6" strokeWidth="5"/><path d="M29 84Q76 53 129 15" fill="none" stroke="#f7f6df" strokeWidth="3"/><path d="M45 73L41 49M60 61L63 37M78 47L88 27M91 37L111 22" stroke="#d6edf0" strokeWidth="3" strokeLinecap="round"/><circle cx="113" cy="73" r="5" fill="#f9db87"/><circle cx="93" cy="91" r="3" fill="#f9db87"/></svg>}
            <p lang="en" dir="ltr" role="status">{challenge.sceneBeat.followUp}</p><button className="round-button" onClick={() => speak(challenge.sceneBeat!.followUp, .85)} aria-label={t('listen')} title={t('listen')}><SoundIcon/></button>
        </div>}
        {success && selected && <p className="conversation-child-reply" lang="en" dir="ltr">{selected}</p>}
        {success && <div className="conversation-sparkles" aria-hidden="true">✦ ✧ ✦</div>}
    </div>;
}

function MysteryDecoder({ options, selected, revealed, success, busy, scaffold, lang, onSelect, onPlace }: {
    options: Challenge['options'];
    selected?: string;
    revealed: boolean;
    success: boolean;
    busy: boolean;
    scaffold: boolean;
    lang: 'he' | 'en';
    onSelect: (id: string) => void;
    onPlace: (id: string) => void;
}) {
    const { t } = useTranslation();
    const instruction = t(revealed ? 'decoderPlace' : 'decoderOpen');
    const signLabel = t('decoderSign');
    return <div className={'decoder-stage' + (success ? ' restored' : '')} dir="ltr">
        <ForestBackdrop className="decoder-forest"/>
        <div className="decoder-glade" aria-hidden="true"/>
        <p className="decoder-instruction" dir={lang === 'he' ? 'rtl' : 'ltr'}>{instruction}</p>
        <button className={'decoder-sign' + (selected && !success ? ' ready' : '') + (success ? ' restored' : '')}
            type="button" tabIndex={revealed && selected && !success ? 0 : -1} aria-label={success ? t('decoderRestored') : selected ? signLabel : t('decoderSelectFirst')}
            aria-disabled={!revealed || !selected || busy || success}
            onClick={() => { if (selected) onPlace(selected); }}
            onDragOver={e => { if (revealed && !busy && !success) e.preventDefault(); }}
            onDrop={e => {
                e.preventDefault();
                const id = e.dataTransfer.getData('text/plain');
                if (options.some(o => o.id === id)) onPlace(id);
            }}>
            <span className="decoder-sign-board">
                {success ? <><span className="decoder-sign-book" aria-hidden="true"><ObjectArt kind="book" size={44}/></span><span className="decoder-sign-word" lang="en" aria-live="polite">{['FOLLOW THE', 'BLUE FEATHERS'].map((line, row) => <span className="decoder-sign-line" key={line}>{line.split('').map((letter, i) => <span key={i} style={{ animationDelay: ((row ? 10 : 0) + i) * 20 + 'ms' }}>{letter === ' ' ? '\u00a0' : letter}</span>)}</span>)}</span></> : <span className="decoder-sign-blanks" aria-hidden="true">_ _ _ _ _</span>}
            </span>
            <span className="decoder-sign-post" aria-hidden="true"/>
        </button>
        <div className="decoder-props">
            {options.map(o => <button key={o.id} type="button"
                className={'decoder-prop decoder-prop-' + o.id + (selected === o.id ? ' picked' : '') + (scaffold && o.id === 'book' ? ' scaffold' : '')}
                disabled={!revealed || busy || success}
                draggable={revealed && !busy && !success}
                onDragStart={e => e.dataTransfer.setData('text/plain', o.id)}
                onClick={() => onSelect(o.id)}
                aria-label={o.text} aria-pressed={selected === o.id && !success}>
                <ObjectArt kind={o.art || o.id} size={74}/><span lang="en">{o.text}</span>
            </button>)}
        </div>
    </div>;
}
export function IconArrow() { return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>; }
export function SoundIcon() { return <svg className="sound-icon" aria-hidden="true" viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m11 5-5 4H3v6h3l5 4V5Zm4 3c3 2 3 6 0 8m3-11c5 4 5 10 0 14"/></svg>; }







