const fs=require('node:fs'),vm=require('node:vm');
const ts=require('C:/Users/Tidha/AppData/Local/Programs/Microsoft VS Code/6d62b1d5da/resources/app/extensions/node_modules/typescript/lib/typescript.js');
const jsx=(type,props)=>({type,props:props||{}}),Fragment=Symbol('Fragment');
const esc=x=>String(x).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
function render(node){if(node==null||typeof node==='boolean')return '';if(Array.isArray(node))return node.map(render).join('');if(typeof node!=='object')return esc(node);let {type,props}=node;if(type===Fragment)return render(props.children);if(typeof type==='function')return render(type(props));const attr=Object.entries(props).map(([k,v])=>{if(['children','key','ref'].includes(k)||k.startsWith('on')||v==null)return '';if(k==='className')k='class';else if(k==='viewBox'||k==='preserveAspectRatio'||k.startsWith('aria-')){}else k=k.replace(/[A-Z]/g,x=>'-'+x.toLowerCase());if(k==='style'&&typeof v==='object')v=Object.entries(v).map(([a,b])=>a.replace(/[A-Z]/g,x=>'-'+x.toLowerCase())+':'+b).join(';');if(typeof v==='boolean')return v&&['hidden','disabled','checked','required','multiple'].includes(k)?' '+k:'';return ' '+k+'="'+esc(v)+'"'}).join('');return '<'+type+(type==='svg'?' xmlns="http://www.w3.org/2000/svg"':'')+attr+'>'+render(props.children)+'</'+type+'>'}
function load(file,mocks,globals={}){const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;const out={};vm.runInNewContext(code,{exports:out,require(name){if(name==='react/jsx-runtime')return {jsx,jsxs:jsx,Fragment};if(name in mocks)return mocks[name];throw Error(name)},...globals},{filename:file});return out}
const art=load('src/Art.tsx',{'react':{useId:()=> 'titlepreview'},'./art.css':{}});
let resources;const i18n={use(){return this},init(options){resources=options.resources;return this},on(){},language:'en'};
load('src/i18n.ts',{'i18next':i18n,'react-i18next':{initReactI18next:{}}},{document:{documentElement:{}},localStorage:{getItem:()=>null,setItem:()=>{}}});
const lang=process.argv[2]==='he'?'he':'en';
const t=(key,options={})=>{let value=resources[lang].translation[key]??options.defaultValue??key;return value.replace(/{{(\w+)}}/g,(_,name)=>options[name]??'')};
const react={useEffect:()=>{},useRef:x=>({current:x}),useState:x=>[typeof x==='function'?x():x,()=>{}]};
const app=load('src/App.tsx',{'react':react,'react-i18next':{useTranslation:()=>({t,i18n:{language:lang,changeLanguage:()=>{}}})},'./Art':art,'./ForestScene':{ForestScene:()=>null},'./ChallengeView':{ChallengeView:()=>null,IconArrow:()=>jsx('span',{children:'→'}),SoundIcon:()=>null},'./content':{chapters:[],challenges:[]},'./store':{useGame:()=>({ready:true,player:null,profiles:[],init:async()=>{}})},'./model':{SKILLS:[]},'./audio':{playSound:()=>{},setAudioEnabled:()=>{},setMusicEnabled:()=>{}},'./storage':{readSetting:(_,v)=>v,writeSetting:()=>{}}},{window:{matchMedia:()=>({matches:false})},document:{body:{classList:{toggle:()=>{}}}}});
const html=render(jsx(app.default,{}));
const css=fs.readFileSync('src/styles.css','utf8')+'\n'+fs.readFileSync('src/art.css','utf8').replace(String.fromCharCode(65279),'');
fs.writeFileSync('docs/title-preview-'+lang+'.html','<!doctype html><html lang="'+lang+'" dir="'+(lang==='he'?'rtl':'ltr')+'"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style>'+html+'</html>');
console.log('Rendered source App title to docs/title-preview-'+lang+'.html with mocked hooks and local translations');




