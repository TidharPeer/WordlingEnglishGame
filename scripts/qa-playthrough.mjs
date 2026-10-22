import puppeteer from 'file:///C:/dev/Golden%20Axe%20Astra/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { challenges } from '../src/content.ts';

const url='http://127.0.0.1:4173/';
const userDataDir=mkdtempSync(path.join(tmpdir(),'wordlings-playthrough-'));
const launch=()=>puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,userDataDir,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'],timeout:30000});
let browser=await launch(), page=await browser.newPage();
const errors=[]; const log=[];
function watch(p){p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});p.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});p.on('requestfailed',r=>errors.push('Request failed '+r.url()+' '+(r.failure()?.errorText||'')));}
watch(page);
await page.setViewport({width:375,height:812,deviceScaleFactor:1});
const wait=async sel=>page.waitForSelector(sel,{visible:true,timeout:15000});
const clickText=async(selector,value,attr)=>{
 const handle=await page.evaluateHandle(({selector,value,attr})=>Array.from(document.querySelectorAll(selector)).find(el=>attr?el.getAttribute(attr)===value:el.textContent.trim()===value),{selector,value,attr});
 const el=handle.asElement();if(!el)throw Error('Missing '+selector+' '+value);await el.click();await handle.dispose();
};
const profile=async()=>page.evaluate(()=>new Promise((resolve,reject)=>{const req=indexedDB.open('wordlings-local');req.onerror=()=>reject(req.error);req.onsuccess=()=>{const tx=req.result.transaction('profiles','readonly');const r=tx.objectStore('profiles').getAll();r.onerror=()=>reject(r.error);r.onsuccess=()=>resolve(r.result.find(p=>p.name==='QA Explorer')||null)}}));
const challengeFromView=async chapter=>{
 const kind=await page.$eval('.challenge-panel',el=>['hunt','forge','dialogue','listen','decoder','story'].find(k=>el.classList.contains(k)));
 let values;
 if(kind==='forge'||kind==='story')values=await page.$$eval('.word-bank .word-tile',els=>els.map(e=>e.textContent.trim()));
 else if(kind==='hunt')values=await page.$$eval('.hunt-objects button',els=>els.map(e=>e.getAttribute('aria-label')));
 else if(kind==='dialogue')values=await page.$$eval('.conversation-choice',els=>els.map(e=>e.textContent.trim()));
 else if(kind==='decoder'&&await page.$('.physical-decoder'))values=await page.$$eval('.decoder-prop',els=>els.map(e=>e.getAttribute('aria-label')));
 else values=await page.$$eval('.answer-scene .answer-object',els=>els.map(e=>e.querySelector('[lang=en]')?.textContent.trim()||e.getAttribute('aria-label')));
 const sorted=xs=>JSON.stringify([...xs].sort());
 const matches=challenges.filter(c=>c.chapter===chapter&&c.kind===kind&&sorted(kind==='forge'||kind==='story'?c.words:c.options.map(o=>o.text))===sorted(values));
 if(matches.length!==1)throw Error('Cannot identify challenge chapter='+chapter+' kind='+kind+' values='+JSON.stringify(values)+' matches='+matches.map(c=>c.id));
 return matches[0];
};
async function solve(c){
 const answer=c.answers[0];
 if(c.kind==='forge'||c.kind==='story'){
  for(const token of answer){const handle=await page.evaluateHandle(token=>Array.from(document.querySelectorAll('.word-bank .word-tile')).find(e=>e.textContent.trim()===token&&!e.disabled),token);const el=handle.asElement();if(!el)throw Error('Missing word '+token+' '+c.id);await el.click();await handle.dispose()}
  await page.click('.forge-actions .gold-button');
 }else if(c.kind==='hunt')await clickText('.hunt-objects button',answer[0],'aria-label');
 else if(c.kind==='dialogue')await clickText('.conversation-choice',answer[0]);
 else if(c.kind==='decoder'&&c.id==='woods-06'){
  const clues=await page.$$('.decoder-clues button');for(const clue of clues)await clue.click();
  await clickText('.decoder-prop',answer[0],'aria-label');await page.click('.decoder-sign');
 }else if(c.kind==='decoder'){const clues=await page.$$('.decoder-clues button');for(const clue of clues)await clue.click();await clickText('.answer-scene .answer-object [lang=en]',answer[0]);}
 else await clickText('.answer-scene .answer-object [lang=en]',answer[0]);
 await wait('.feedback.success .gold-button');
}
try{
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:20000});await wait('.title-cta');
 if(await page.$eval('html',e=>e.dir)!=='rtl')throw Error('Default Hebrew RTL missing');
 await page.click('.language-button');await page.waitForFunction(()=>document.documentElement.dir==='ltr');
 await page.click('.title-cta');await wait('.onboarding-panel form, form.onboarding-panel');
 await page.type('input[placeholder="Your nickname"]','QA Explorer');await page.click('.identity-row .gold-button');
 await wait('.story-card');log.push('Created local profile and entered story');
 for(let chapter=0;chapter<6;chapter++){
  if(chapter>0){await wait('.adventure-page');await page.click('.next-quest .gold-button');await wait('.story-card')}
  if(chapter===2){await page.click('.language-button');await page.waitForFunction(()=>document.documentElement.dir==='rtl');log.push('Switched to Hebrew RTL in chapter 3');await page.click('.language-button');await page.waitForFunction(()=>document.documentElement.dir==='ltr')}
  await page.click('.story-card .gold-button');await wait('.challenge-panel');
  for(let step=0;step<6;step++){
   const c=await challengeFromView(chapter);
   if(chapter===0&&step===0){const wrong=c.options.find(o=>!c.answers.some(a=>a.includes(o.id)));await clickText('.hunt-objects button',wrong.id,'aria-label');await wait('.feedback.retry');log.push('Wrong-answer hint appeared and challenge stayed playable')}
   log.push('Trying '+c.id+' '+c.kind);await solve(c);log.push('Solved '+c.id+' '+c.kind);
   const p=await profile();if(!p?.completed.includes(c.id))throw Error('Not saved: '+c.id);
   await page.click('.feedback.success .gold-button');
   await page.waitForFunction(()=>document.querySelector('.story-card')||document.querySelector('.challenge-panel:not(.completed)'),{timeout:15000});
  }
  await wait('.story-card');const p=await profile();if(p.chapter!==chapter+1)throw Error('Chapter '+chapter+' did not unlock: '+p.chapter);log.push('Chapter '+(chapter+1)+' complete, XP '+p.xp+', coins '+p.coins);
  await page.click('.story-card .gold-button');
 }
 let p=await profile();if(p.completed.length!==36||p.chapter!==6)throw Error('End-state incorrect '+p.completed.length+'/'+p.chapter);
 log.push('All 36 challenges and six chapters saved: XP '+p.xp+', coins '+p.coins);
 await page.click('.main-nav button:nth-child(5)');await wait('.journal-page');
 const chapterEntries=await page.$$eval('.journal-chapters article',els=>els.length);if(chapterEntries!==6)throw Error('Journal missing completed chapters: '+chapterEntries);
 await page.click('.main-nav button:nth-child(4)');await wait('.home-layout');
 const keepsakes=await page.$$eval('.inventory-items button',els=>els.length);if(keepsakes<6)throw Error('Home missing earned keepsakes: '+keepsakes);
 await page.click('.inventory-items button:first-child');await page.click('.treehouse');
 let afterHome=await profile();if(afterHome.decorations.length!==1)throw Error('Decoration did not save');
 const coinsBefore=afterHome.coins;await page.click('.home-shop button');afterHome=await profile();if(afterHome.coins>=coinsBefore||!afterHome.inventory.includes('amber-lantern'))throw Error('Coin shop did not grant item');
 log.push('Journal six chapters; home decoration and earned-coin purchase saved');
 await page.click('.main-nav button:nth-child(6)');await wait('.settings-page');await page.click('.settings-grid .small-button');await wait('.journal-page');
 if(!await page.$('.parent-insight'))throw Error('Parent view missing');log.push('Parent progress view opened');
 await page.click('.game-footer button:last-child');await wait('.profiles-panel');await page.click('.new-profile');await wait('form.onboarding-panel');
 if(await page.$eval('input[placeholder="Your nickname"]',el=>el.value)!=='')throw Error('New explorer name was prefilled');await page.type('input[placeholder="Your nickname"]','QA Sibling');await page.click('.identity-row .gold-button');await wait('.story-card');
 const sibling=await page.evaluate(()=>new Promise((resolve,reject)=>{const req=indexedDB.open('wordlings-local');req.onsuccess=()=>{const tx=req.result.transaction('profiles','readonly');const r=tx.objectStore('profiles').getAll();r.onsuccess=()=>resolve(r.result.find(p=>p.name==='QA Sibling'))}}));
 if(!sibling||sibling.completed.length!==0)throw Error('Sibling did not start independently');
 await page.click('.game-footer button:last-child');await wait('.profiles-panel');await clickText('.profile-card strong','QA Explorer');await wait('.adventure-page');
 log.push('Second local profile stayed independent; original explorer restored');
 await page.close();await browser.close();browser=await launch();page=await browser.newPage();watch(page);await page.setViewport({width:375,height:812});
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:20000});await wait('.title-cta');await page.click('.title-cta');await wait('.adventure-page');p=await profile();if(p.completed.length!==36||p.chapter!==6)throw Error('Browser restart lost progress');log.push('Browser restart restored 36 challenges and selected profile');
 const sw=await page.evaluate(async()=>{await navigator.serviceWorker.ready;return Boolean(navigator.serviceWorker.controller)});if(!sw){await page.reload({waitUntil:'domcontentloaded'});await wait('.title-cta')}
 const controlled=await page.evaluate(()=>Boolean(navigator.serviceWorker.controller));if(!controlled)throw Error('Service worker did not control page');
 await page.setOfflineMode(true);await page.reload({waitUntil:'domcontentloaded',timeout:20000});await wait('.title-cta');await page.click('.title-cta');await wait('.adventure-page');
 const online=await page.evaluate(()=>navigator.onLine);if(online)throw Error('Browser still online');
 await page.click('.next-quest .gold-button');await wait('.story-card');await page.click('.story-card .gold-button');await wait('.challenge-panel');const replay=await challengeFromView(5);await solve(replay);log.push('Offline reload and offline replay succeeded: '+replay.id);
 const offlineProfile=await profile();if(offlineProfile.history.length<=p.history.length)throw Error('Offline attempt not persisted');
 log.push('Offline attempt saved to IndexedDB');
 if(errors.length)throw Error('Browser errors: '+errors.join('; '));
 writeFileSync('docs/live-playthrough-report.json',JSON.stringify({passed:true,log,errors,profile:{completed:offlineProfile.completed.length,chapter:offlineProfile.chapter,xp:offlineProfile.xp,coins:offlineProfile.coins,history:offlineProfile.history.length},serviceWorkerControlled:controlled},null,2));
 console.log(JSON.stringify({passed:true,log,errors},null,2));
}catch(error){
 console.error('PLAYTHROUGH FAILED:',error.stack||error);
 try{await page.screenshot({path:'docs/live-playthrough-failure.png',fullPage:true})}catch{}
 writeFileSync('docs/live-playthrough-report.json',JSON.stringify({passed:false,log,errors,error:String(error.stack||error)},null,2));
 process.exitCode=1;
}finally{await browser.close().catch(()=>{})}