const fs=require('node:fs'),vm=require('node:vm');
const ts=require('C:/Users/Tidha/AppData/Local/Programs/Microsoft VS Code/6d62b1d5da/resources/app/extensions/node_modules/typescript/lib/typescript.js');
const jsx=(type,props)=>({type,props:props||{}}),Fragment=Symbol('Fragment');
const esc=x=>String(x).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
function render(node){if(node==null||typeof node==='boolean')return '';if(Array.isArray(node))return node.map(render).join('');if(typeof node!=='object')return esc(node);let {type,props}=node;if(type===Fragment)return render(props.children);if(typeof type==='function')return render(type(props));const attr=Object.entries(props).map(([k,v])=>{if(['children','key','ref'].includes(k)||k.startsWith('on')||v==null)return '';if(k==='className')k='class';else if(k==='viewBox'||k==='preserveAspectRatio'||k.startsWith('aria-')){}else k=k.replace(/[A-Z]/g,x=>'-'+x.toLowerCase());if(typeof v==='boolean')return v&&['hidden','disabled','checked','required','multiple'].includes(k)?' '+k:'';if(k==='style'&&typeof v==='object')v=Object.entries(v).map(([a,b])=>a.replace(/[A-Z]/g,x=>'-'+x.toLowerCase())+':'+b).join(';');return ' '+k+'="'+esc(v)+'"'}).join('');return '<'+type+(type==='svg'?' xmlns="http://www.w3.org/2000/svg"':'')+attr+'>'+render(props.children)+'</'+type+'>'}
function load(file,mocks,globals={}){const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;const out={};vm.runInNewContext(code,{exports:out,require(name){if(name==='react/jsx-runtime')return {jsx,jsxs:jsx,Fragment};if(name in mocks)return mocks[name];throw Error(name)},...globals},{filename:file});return out}
const art=load('src/Art.tsx',{'react':{useId:()=> 'questpreview'},'./art.css':{}});
const successPreview=process.argv[3]==='success',unlockedPreview=process.argv[6]==='unlocked';let stateIndex=0;const react={useEffect:()=>{},useRef:x=>({current:x}),useState:x=>{const i=stateIndex++;return [(successPreview||unlockedPreview)&&i===0&&challengeIndex===5?[0,1]:successPreview&&i===2?[content.challenges[challengeIndex].answers[process.argv[7]==='alt'?1:0][0]]:successPreview&&(i===4||i===10)?true:typeof x==='function'?x():x,()=>{}]}};
const hunt=load('src/WordHuntScene.tsx',{'react':react,'phaser':{},'./Art':art});
const speakerArt=load('src/ConversationSpeakerArt.tsx',{'./Art':art});
const content=load('src/content.ts',{});
let resources;const i18n={use(){return this},init(options){resources=options.resources;return this},on(){},language:'en'};
load('src/i18n.ts',{'i18next':i18n,'react-i18next':{initReactI18next:{}}},{document:{documentElement:{}},localStorage:{getItem:()=>null,setItem:()=>{}}});
const lang=process.argv[2]==='he'?'he':'en';const challengeIndex=Number(process.argv[5]||0);const companionVariant=['pip','moss','luma'].includes(process.argv[4])?process.argv[4]:'pip';
const t=(key,options={})=>{let value=resources[lang].translation[key]??options.defaultValue??key;return value.replace(/{{(\w+)}}/g,(_,name)=>options[name]??'')};
const challenge=load('src/ChallengeView.tsx',{'react':react,'react-i18next':{useTranslation:()=>({t,i18n:{language:lang}})},'./Art':art,'./store':{useGame:()=>({player:{completed:[],companion:companionVariant}})},'./audio':{speak:()=>{},stopSpeech:()=>{},playSound:()=>{},speechAvailable:()=>false},'./storage':{readSetting:(_,v)=>v},'./WordHuntScene':hunt,'./ConversationSpeakerArt':speakerArt});
const html=render(jsx(challenge.ChallengeView,{challenge:content.challenges[challengeIndex],onNext:()=>{},onExit:()=>{},index:0,total:6}));
const css=fs.readFileSync('src/styles.css','utf8')+'\n'+fs.readFileSync('src/art.css','utf8').replace(String.fromCharCode(65279),'');
fs.writeFileSync('docs/challenge-preview-'+lang+(successPreview?'-success':'')+(companionVariant==='pip'?'':'-'+companionVariant)+(challengeIndex?'-i'+challengeIndex:'')+(unlockedPreview?'-unlocked':'')+(process.argv[7]==='alt'?'-alt':'')+'.html','<!doctype html><html lang="'+lang+'" dir="'+(lang==='he'?'rtl':'ltr')+'"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style>'+html+'</html>');
console.log('Rendered first challenge source view to docs/challenge-preview-'+lang+'.html with mocked hooks');








