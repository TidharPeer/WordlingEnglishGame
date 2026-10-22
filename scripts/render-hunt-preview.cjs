const fs=require('node:fs'),vm=require('node:vm');
const ts=require('C:/Users/Tidha/AppData/Local/Programs/Microsoft VS Code/6d62b1d5da/resources/app/extensions/node_modules/typescript/lib/typescript.js');
const jsx=(type,props)=>({type,props:props||{}}),Fragment=Symbol('Fragment');
const esc=x=>String(x).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
function render(node){if(node==null||typeof node==='boolean')return '';if(Array.isArray(node))return node.map(render).join('');if(typeof node!=='object')return esc(node);let {type,props}=node;if(type===Fragment)return render(props.children);if(typeof type==='function')return render(type(props));const attr=Object.entries(props).map(([k,v])=>{if(['children','key','ref'].includes(k)||k.startsWith('on')||v==null)return '';if(k==='className')k='class';else if(k==='viewBox'||k==='preserveAspectRatio'||k.startsWith('aria-')){}else k=k.replace(/[A-Z]/g,x=>'-'+x.toLowerCase());if(typeof v==='boolean')return v&&['hidden','disabled','checked','required','multiple'].includes(k)?' '+k:'';if(k==='style'&&typeof v==='object')v=Object.entries(v).map(([a,b])=>a.replace(/[A-Z]/g,x=>'-'+x.toLowerCase())+':'+b).join(';');return ' '+k+'="'+esc(v)+'"'}).join('');return '<'+type+(type==='svg'?' xmlns="http://www.w3.org/2000/svg"':'')+attr+'>'+render(props.children)+'</'+type+'>'}
function load(file,mocks){const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;const out={};vm.runInNewContext(code,{exports:out,require(name){if(name==='react/jsx-runtime')return {jsx,jsxs:jsx,Fragment};if(name in mocks)return mocks[name];throw Error(name)}},{filename:file});return out}
const art=load('src/Art.tsx',{'react':{useId:()=> 'huntpreview'},'./art.css':{}});
const hunt=load('src/WordHuntScene.tsx',{'react':{useEffect:()=>{},useRef:x=>({current:x}),useState:x=>[x,()=>{}]},'phaser':{},'./Art':art});
const options=[{id:'apple',text:'apple',art:'apple'},{id:'key',text:'key',art:'key'},{id:'leaf',text:'leaf',art:'leaf'}];
const css=fs.readFileSync('src/styles.css','utf8')+'\n'+fs.readFileSync('src/art.css','utf8').replace(String.fromCharCode(65279),'');
const rendered=render(jsx(hunt.WordHuntScene,{options,onChoose:()=>{},disabled:false,selected:process.argv[2]==='success'?'apple':undefined,chapter:0,companion:'pip',success:process.argv[2]==='success',restoredWord:'apple'}));
fs.writeFileSync(process.argv[2]==='success'?'docs/hunt-preview-success.html':'docs/hunt-preview.html','<!doctype html><html><meta charset="utf-8"><style>'+css+'\nbody{background:#173b36;display:grid;place-items:center;min-height:100vh}.preview{width:min(950px,96vw);border:9px solid #123d37;border-radius:27px;overflow:hidden}.hunt-stage{height:520px;margin:0}@media(max-width:600px){.hunt-stage{height:270px}}</style><div class="preview">'+rendered+'</div></html>');
console.log('Rendered source WordHuntScene to docs/hunt-preview.html without React effects or Phaser runtime');







