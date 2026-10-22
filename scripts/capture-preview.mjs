import puppeteer from 'file:///C:/dev/Golden%20Axe%20Astra/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
const name=process.argv[2]||'art-preview', width=Number(process.argv[3]||1280), height=Number(process.argv[4]||800);
const suffix=process.argv[3]?`-${width}x${height}`:'';
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-features=Vulkan','--use-gl=angle','--use-angle=swiftshader'],userDataDir:'C:/dev/Wordlings/.puppeteer-preview',timeout:20000});
const page=await browser.newPage();await page.setViewport({width,height,deviceScaleFactor:1});await page.goto('file:///C:/dev/Wordlings/docs/'+name+'.html');await new Promise(resolve=>setTimeout(resolve,600));await page.screenshot({path:'C:/dev/Wordlings/docs/'+name+suffix+'.png',fullPage:!name.startsWith('challenge')});console.log('saved '+name+suffix+'.png');await browser.close();





