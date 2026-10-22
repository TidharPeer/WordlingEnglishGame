import assert from 'node:assert/strict';
import {chapters,challenges} from '../src/content.ts';
assert.equal(chapters.length,6);
assert.equal(challenges.length,36);
assert.equal(new Set(challenges.map(c=>c.id)).size,challenges.length);
for(const chapter of chapters) assert.equal(challenges.filter(c=>c.chapter===chapter.id).length,6);
for(const c of challenges){
 assert.ok(c.prompt&&c.objective&&c.help.en&&c.help.he&&c.hint.en&&c.hint.he&&c.explanation.en&&c.explanation.he,c.id);
 assert.ok(/\p{Script=Hebrew}/u.test(c.help.he+c.hint.he+c.explanation.he),c.id);
 assert.ok(c.answers.length>0,c.id);
 if(c.reactions)for(const [key,reply] of Object.entries(c.reactions)){assert.ok(c.answers.some(a=>a.includes(key)),c.id);assert.ok(reply.en&&reply.he,c.id);}
 if(c.sceneBeat){assert.equal(c.kind,'dialogue',c.id);assert.ok(c.sceneBeat.followUp.trim().length>0,c.id);}
 if(c.kind==='forge'||c.kind==='story'){
  assert.ok(c.words?.length,c.id);
  const tokens=xs=>JSON.stringify([...xs].sort());
  for(const a of c.answers)assert.equal(tokens(a),tokens(c.words),c.id);
 }else{
  assert.ok(c.options.length>=2,c.id);
  for(const a of c.answers)assert.ok(a.length===1&&c.options.some(o=>o.id===a[0]),c.id);
 }
}
assert.equal(new Set(challenges.map(c=>c.kind)).size,6);
assert.equal(new Set(challenges.map(c=>c.skill)).size,6);
console.log(`Content checks passed: ${challenges.length} challenges, ${chapters.length} chapters, six mechanics, six skills.`);

