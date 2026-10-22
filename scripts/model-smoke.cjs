const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const ts=require('C:/Users/Tidha/AppData/Local/Programs/Microsoft VS Code/6d62b1d5da/resources/app/extensions/node_modules/typescript/lib/typescript.js');
function load(file,mocks){const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const out={};vm.runInNewContext(code,{exports:out,require(name){if(name in mocks)return mocks[name];throw Error(name)},crypto:globalThis.crypto,Date,console},{filename:file});return out}
const zod=require('C:/dev/Golden Axe Astra/node_modules/zod');
const model=load('src/model.ts',{zod});const content=load('src/content.ts',{});
let p=model.newProfile('Ari','leaf','pip');
assert.equal(p.chapter,0);
for(const c of content.challenges){p=model.updateAttempt(p,c,true,false);p=model.rewardCompletion(p,c,content.challenges)}
assert.equal(model.progressMatchesContent(p,content.challenges),true);assert.equal(model.progressMatchesContent({...p,chapter:0},content.challenges),false);assert.equal(p.completed.length,36);assert.equal(p.chapter,6);assert.equal(p.xp,720);assert.equal(p.coins,288);
assert.ok(p.inventory.includes('bramble-friend'));assert.ok(p.inventory.includes('sky-wallpaper'));
assert.equal(model.backupSchema.safeParse({format:'wordlings',version:1,profiles:[p]}).success,true);
const xp=p.xp;p=model.rewardCompletion(p,content.challenges[0],content.challenges);assert.equal(p.xp,xp);
let q=model.newProfile('Noa','star','moss');const c=content.challenges[0];q=model.updateAttempt(q,c,true,true);assert.equal(q.skills.vocabulary.level,1);
for(let i=0;i<3;i++)q=model.updateAttempt(q,c,true,false);assert.equal(q.skills.vocabulary.level,2);
console.log('Model smoke passed: 36 completions unlock six chapters once, rewards persist, assisted attempt does not advance mastery.');


