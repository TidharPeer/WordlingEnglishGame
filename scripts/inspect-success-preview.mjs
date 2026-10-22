import puppeteer from 'file:///C:/dev/Golden%20Axe%20Astra/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-features=Vulkan','--use-gl=angle','--use-angle=swiftshader'],userDataDir:'C:/dev/Wordlings/.puppeteer-preview'});
const page=await browser.newPage();
await page.goto('file:///C:/dev/Wordlings/docs/'+(process.argv[2]||'challenge-preview-he-success')+'.html');
for(const width of [320,375,600,768,1280]){
 await page.setViewport({width,height:812});await new Promise(resolve=>setTimeout(resolve,450));
 const result=await page.evaluate(()=>{const r=e=>{if(!e)return null;const b=e.getBoundingClientRect();return{x:b.x,y:b.y,w:b.width,h:b.height}};const next=document.querySelector('.feedback.success .gold-button');return{viewport:{w:innerWidth,h:innerHeight},scroll:{w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight},next:r(next),nextVisible:r(next).y+r(next).h<=innerHeight,feedback:r(document.querySelector('.feedback.success')),stage:r(document.querySelector('.hunt-stage,.decoder-stage'))}});
 console.log(width,JSON.stringify(result));
}
await browser.close();


