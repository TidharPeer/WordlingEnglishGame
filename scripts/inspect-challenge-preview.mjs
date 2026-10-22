import puppeteer from 'file:///C:/dev/Golden%20Axe%20Astra/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-features=Vulkan','--use-gl=angle','--use-angle=swiftshader'],userDataDir:'C:/dev/Wordlings/.puppeteer-preview'});
const page=await browser.newPage();
await page.goto('file:///C:/dev/Wordlings/docs/challenge-preview-he.html');
for(const width of [320,375,600,768,1280]){
 await page.setViewport({width,height:812});
 const data=await page.evaluate(()=>{
  const rect=e=>{if(!e)return null;const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}};
  const targets=[...document.querySelectorAll('.hunt-objects button')].map(rect);
  const overlaps=targets.flatMap((a,i)=>targets.slice(i+1).map((b,j)=>({pair:[i,i+j+1],x:Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x),y:Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)})).filter(x=>x.x>0&&x.y>0));
  return{stage:rect(document.querySelector('.challenge-panel .hunt-stage')),targets,audio:rect(document.querySelector('.clue-controls .round-button')),overlaps,bodyScrollWidth:document.body.scrollWidth};
 });
 console.log(width,JSON.stringify(data));
}
await browser.close();
