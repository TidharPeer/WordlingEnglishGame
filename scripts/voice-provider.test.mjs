import {test} from 'vitest';
import assert from 'node:assert/strict';
import {selectEnglishVoice,providerError,safeFailure} from './voice-provider.mjs';
test('accepts English library voices without legacy premade category',()=>{const voice={voice_id:'test',category:'professional',labels:{language:'en',description:'warm'}};assert.equal(selectEnglishVoice([voice]),voice)});
test('uses verified languages and excludes unrelated languages',()=>{const voice={voice_id:'test',verified_languages:[{language:'en'}]};assert.equal(selectEnglishVoice([{voice_id:'other',labels:{language:'es'}},voice]),voice);assert.equal(selectEnglishVoice([]),undefined)});
test('reports permissions without leaking provider text',async()=>{const result=await providerError({status:401,json:async()=>({detail:{status:'missing_permissions',message:'SECRET'}})});assert.match(result,/permission/);assert.ok(!result.includes('SECRET'))});
test('does not expose arbitrary errors',()=>{assert.ok(!safeFailure(new Error('SECRET')).includes('SECRET'));assert.match(safeFailure({cause:{code:'EACCES'}}),/EACCES/)});

test('prefers specific billing code over generic status',async()=>{const result=await providerError({status:402,json:async()=>({detail:{code:'paid_plan_required',status:'payment_required',message:'SECRET'}})});assert.match(result,/requires a paid plan/);assert.ok(!result.includes('SECRET'))});
test('unknown 402 still reports billing',async()=>{assert.match(await providerError({status:402,json:async()=>({})}),/Payment or additional credits/)});
