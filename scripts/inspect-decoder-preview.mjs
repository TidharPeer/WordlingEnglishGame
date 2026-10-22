import puppeteer from 'file:///C:/dev/Golden%20Axe%20Astra/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-features=Vulkan','--use-gl=angle','--use-angle=swiftshader'],userDataDir:'C:/dev/Wordlings/.puppeteer-preview'});
const page=await browser.newPage();
for(const name of ['challenge-preview-he-i5','challenge-preview-he-i5-unlocked','challenge-preview-he-success-i5']){
 await page.goto('file:///C:/dev/Wordlings/docs/'+name+'.html');await page.setViewport({width:320,height:812});
 const data=await page.evaluate(()=>{const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}};return{clues:document.querySelectorAll('.decoder-clues button').length,propButtons:[...document.querySelectorAll('.decoder-prop')].map(e=>({disabled:e.disabled,rect:rect(e)})),sign:{ariaDisabled:document.querySelector('.decoder-sign')?.getAttribute('aria-disabled'),rect:rect(document.querySelector('.decoder-sign'))},rewardButton:document.querySelector('.feedback.success .gold-button')?rect(document.querySelector('.feedback.success .gold-button')):null,scrollWidth:document.documentElement.scrollWidth,word:document.querySelector('.decoder-sign-word')?.textContent}});
 console.log(name,JSON.stringify(data));
}
await browser.close();
