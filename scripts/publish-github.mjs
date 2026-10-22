import {execFileSync} from 'node:child_process';
import {existsSync,readFileSync} from 'node:fs';
import {parseEnv} from 'node:util';
import {fileURLToPath} from 'node:url';
process.chdir(fileURLToPath(new URL('../',import.meta.url)));
const repository='https://github.com/TidharPeer/WordlingEnglishGame.git';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',stdio:['inherit','pipe','inherit']}).trim();
const run=(command,args)=>execFileSync(command,args,{stdio:'inherit'});
try {
  try {git('--version')} catch {throw Error('Git is not installed or not on PATH. Install Git for Windows, reopen the terminal, and rerun this script.')}
  run(process.execPath,['scripts/audit-audio.mjs','--strict']);
  run(process.execPath,['node_modules/vitest/vitest.mjs','run']);
  run(process.execPath,['node_modules/typescript/bin/tsc','-b']);
  run(process.execPath,['node_modules/vite/bin/vite.js','build']);
  if(!existsSync('.git'))console.log(git('init','-b','main'));
  if(git('branch','--show-current')!=='main')throw Error('Current branch is not main. Review branch state before publishing.');
  const remotes=git('remote').split(/\s+/);
  if(remotes.includes('origin')){if(git('remote','get-url','origin')!==repository)throw Error('Origin differs from the requested repository; it has not been changed.')}else git('remote','add','origin',repository);
  console.log(git('fetch','origin'));
  if(git('branch','-r','--list','origin/main')){
    // Never overwrite an existing remote history with an unrelated initial commit.
    try{git('merge-base','--is-ancestor','origin/main','HEAD')}catch{throw Error('Remote main has history not included locally. Reconcile it before pushing; no force push was attempted.')}
  }
  git('add','--all');
  const files=git('ls-files','-z').split('\0').filter(Boolean);
  const env=existsSync('.env')?parseEnv(readFileSync('.env','utf8')):{};
  const secrets=Object.entries(env).filter(([k,v])=>/KEY|TOKEN|SECRET|PASSWORD/i.test(k)&&v.length>10).map(([,v])=>v);
  for(const file of files){
    if(/(^|\/)(\.env(?:\..*)?|\.chrome-preview|\.edge-preview|\.puppeteer-preview)(\/|$)/.test(file)&&!file.endsWith('.env.example'))throw Error('Sensitive local file staged: '+file);
    const bytes=readFileSync(file);if(bytes.length>90*1024*1024)throw Error('File too large for normal GitHub upload: '+file);
    if(secrets.some(secret=>bytes.includes(Buffer.from(secret))))throw Error('Local credential found in staged file: '+file);
    if(/(?:sk_[A-Za-z0-9]{24,}|ghp_[A-Za-z0-9]{30,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/.test(bytes.toString('utf8')))throw Error('Possible credential in staged file: '+file);
  }
  if(git('diff','--cached','--name-only'))console.log(git('-c','user.name=TidharPeer','-c','user.email=TidharPeer@users.noreply.github.com','commit','-m','Build Wordlings adventure with recorded audio and word-spaced listening'));
  console.log(git('push','-u','origin','main'));
  console.log('Published '+git('rev-parse','HEAD')+' to '+repository);
}catch(error){console.error(error.message);process.exitCode=1}
