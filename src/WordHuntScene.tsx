import {useEffect,useRef,useState} from 'react';
import Phaser from 'phaser';
import {Creature,ForestBackdrop,ObjectArt} from './Art';
import {type Companion} from './model';
const positions=[{x:.17,y:.72},{x:.5,y:.71},{x:.83,y:.72}];
type HuntOption={id:string;text:string;art?:string};
function HuntRelic({chapter,success,word}:{chapter:number,success:boolean,word?:string}){
 const glow=success?'#ffe4a0':'#a1845b';
 if(chapter===0)return <div className="hunt-relic signpost" aria-hidden="true"><svg viewBox="0 0 170 175" width="170" height="175"><path d="M75 69h18v106H75z" fill="#533b2d"/><path d="M77 82h7v85h-7z" fill="#a67a4b"/><path d="M20 24Q73 5 145 20l6 68q-58 21-133-1z" fill="#493b2e" stroke="#2d4938" strokeWidth="7"/><path d="M29 30q55-14 109-4l5 51q-57 13-115 0z" fill={glow}/><path d="M31 74q42 11 72 2l-12 8q-31 5-59-1z" fill="#593f2d" opacity=".55"/><path d="M119 27l-10 13 10 8-7 12 13 8" fill="none" stroke={success?'#c99c5a':'#5a4938'} strokeWidth="4" strokeLinecap="round"/><circle cx="32" cy="35" r="4" fill="#f2d38c"/><circle cx="136" cy="34" r="4" fill="#f2d38c"/><path d="M76 108q-20 2-30 14M91 113q18-4 26 7" stroke="#8a6741" strokeWidth="6" fill="none" strokeLinecap="round"/></svg><span className="hunt-sign-word" lang="en">{success?word:'?  ?  ?'}</span></div>;
 if(chapter===1)return <div className="hunt-relic picnic" aria-hidden="true"><svg viewBox="0 0 170 175" width="170" height="175"><path d="M15 76 87 33l70 44-68 51z" fill="#eee2bb" stroke="#6b7457" strokeWidth="7"/><path d="m34 66 72 51m3-71L43 99" stroke="#b77a6d" strokeWidth="13" opacity=".8"/><path d="M40 112v49m99-50v50" stroke="#654c37" strokeWidth="10"/><circle cx="87" cy="75" r="22" fill={glow} opacity=".78"/></svg></div>;
 if(chapter===2)return <div className="hunt-relic echo-tree" aria-hidden="true"><svg viewBox="0 0 170 175" width="170" height="175"><path d="M70 172V72L34 35m44 60 57-68" stroke="#66513f" strokeWidth="23" fill="none" strokeLinecap="round"/><circle cx="78" cy="44" r="56" fill="#3f795c" opacity=".9"/><circle cx="112" cy="63" r="36" fill="#6ba475"/><path d="M74 74q28-16 39 8-12 29-39 10z" fill={glow} stroke="#405a42" strokeWidth="5"/></svg></div>;
 if(chapter===3)return <div className="hunt-relic lantern-post" aria-hidden="true"><svg viewBox="0 0 170 175" width="170" height="175"><path d="M80 165V20h55" stroke="#4c5d51" strokeWidth="11" fill="none"/><path d="M105 50h52l-5 62h-41z" fill={glow} stroke="#435847" strokeWidth="7"/><path d="M115 50 130 29l17 21" fill="#735e43"/><circle cx="130" cy="81" r="13" fill="#fff0b6" opacity={success?1:.35}/></svg></div>;
 if(chapter===4)return <div className="hunt-relic word-gate" aria-hidden="true"><svg viewBox="0 0 170 175" width="170" height="175"><path d="M18 175V68Q85-13 152 68v107" fill="none" stroke="#5e6f66" strokeWidth="21"/><path d="M39 175V77Q85 21 131 77v98" fill={success?'#d8c786':'#334f49'} stroke="#ddcf9d" strokeWidth="6"/><path d="M85 58v117" stroke="#8d7c62" strokeWidth="7"/><circle cx="107" cy="117" r="8" fill={glow}/></svg></div>;
 return <div className="hunt-relic crystal" aria-hidden="true"><svg viewBox="0 0 170 175" width="170" height="175"><path d="M30 166h110l-15-34H45z" fill="#736b5c"/><path d="M85 12 133 57l-22 64H59L36 57z" fill={success?'#bfe8e8':'#6b9b9b'} stroke="#e6f2d5" strokeWidth="6"/><path d="M85 12v109M36 57h97" stroke="#e0f4e7" strokeWidth="4" opacity=".7"/></svg></div>;
}

function HuntSetting({success}:{success:boolean}){
 return <svg className="hunt-setting" viewBox="0 0 900 330" preserveAspectRatio="none" aria-hidden="true">
  <path d="M0 0h900v330H0z" fill="#173f35" opacity=".18"/>
  <path d="M0 237Q130 171 264 203q93-54 212-25 145-46 258 10 98-6 166 36v106H0z" fill="#426f4d"/>
  <path d="M462-24q-34 63-3 115-35 80-30 145 53-5 97-26 31-63 88-74 70 19 107 85l52 15q-3-90-43-156 28-54-8-104z" fill="#38563e" stroke="#264838" strokeWidth="11"/>
  <path d="M517-12q-9 58 9 99-29 50-26 113 49-22 104-28 60 0 96 35-9-79-36-115 20-49 6-104z" fill="#24473a"/>
  <path d="M540 183q-4-48 14-74 16-31 52-35 45 4 61 39 14 33 11 73-33-20-71-22-36 0-67 19z" fill="#153b34" stroke="#6a7850" strokeWidth="6"/>
  <path d="M560 170q10-53 48-58 40 3 51 58" fill="none" stroke="#395f42" strokeWidth="4" opacity=".65"/>
  <path d="M466 10q-65 4-124 55l-82 13m440-64q62 13 107 53l93 7" fill="none" stroke="#38563e" strokeWidth="24" strokeLinecap="round"/>
  <path d="M464 39q-33 49-68 56m323-43q34 41 61 48" fill="none" stroke="#779052" strokeWidth="5" opacity=".5" strokeLinecap="round"/>
  <path d="M0 229q119-49 261-35 98-34 182-26 133-24 230 16 140-8 227 38v108H0z" fill="#678e54"/>
  <path d="M0 244q107-38 214-29 77-29 182-18 116-30 210-5 170-14 294 44v94H0z" fill="#9fbd69"/>
  <path d="M0 266q126-43 243-24 114-22 192-14 103-28 207-8 138-4 258 37" fill="none" stroke="#c0d77b" strokeWidth="14" opacity=".8"/>
  <path d="M0 302q122-41 217-23 93-38 211-28 118-32 214-17 159-16 258 44v52H0z" fill="#729555"/>
  <path d="M0 328q99-25 195-13 117-32 238-17 151-27 254-12 116-14 213 17v27H0z" fill="#3d714c"/>
  <path d="M28 258q35-44 89-32 17 23 5 36m629-18q34-34 99-12 25 15 19 34" fill="#50774b" stroke="#385e43" strokeWidth="5"/>
  <path d="M81 258q27 8 44 28m113-51q-22 22-22 39m450-30q30 13 44 42m100-27q-25 11-36 29" fill="none" stroke="#365c40" strokeWidth="12" strokeLinecap="round"/>
  <path d="M555 226q30 11 56 37m-35-37q-21 21-41 24" fill="none" stroke="#527844" strokeWidth="13" strokeLinecap="round"/>
  <path d="M588 213l34 7-22 14-29-5z" fill="#ba8750" stroke="#5b5938" strokeWidth="4"/>
  <path d="M593 218l21 4m-15 5 9 1" stroke="#e7c987" strokeWidth="2"/>
  <path d="M44 284q13-22 30 0m-17-12 1-20m16 25 15-13M843 291q7-27 25-13m-11 5 11-28" stroke="#30674c" strokeWidth="5" fill="none" strokeLinecap="round"/>
  <g fill="#e9cd83"><circle cx="108" cy="282" r="3"/><circle cx="121" cy="287" r="2"/><circle cx="331" cy="265" r="3"/><circle cx="731" cy="271" r="3"/><circle cx="812" cy="297" r="2"/></g>
  <g fill="#d98d78"><circle cx="98" cy="280" r="2"/><circle cx="324" cy="261" r="2"/><circle cx="724" cy="268" r="2"/></g>
  <path d="M330 0q20 35 12 65m416-65q-19 42-5 70" fill="none" stroke="#315b41" strokeWidth="7"/>
  <g fill="#5d9259"><ellipse cx="346" cy="70" rx="21" ry="12" transform="rotate(25 346 70)"/><ellipse cx="324" cy="59" rx="17" ry="11" transform="rotate(-32 324 59)"/><ellipse cx="751" cy="66" rx="23" ry="12" transform="rotate(-25 751 66)"/><ellipse cx="774" cy="53" rx="17" ry="10" transform="rotate(30 774 53)"/></g>
  <path d="M238 241q12-15 30-12m165-22q22-17 40-10m270 35q18-12 34-7" fill="none" stroke="#d4e18a" strokeWidth="4" strokeLinecap="round"/>
  {success&&<g className="hunt-world-awake">
   <path d="M210 0Q324 102 354 197M811 0Q727 94 676 189" fill="none" stroke="#f4e4a0" strokeWidth="38" opacity=".13"/>
   <path d="M0 264q125-42 243-24 114-24 192-13 105-29 207-8 145-2 258 36" fill="none" stroke="#e5db88" strokeWidth="19" opacity=".42"/>
   <path d="M0 303q119-36 217-22 98-35 211-27 118-33 214-17 149-16 258 39" fill="none" stroke="#c8d97b" strokeWidth="14" opacity=".5"/>
   <g fill="#fff1ac"><circle cx="126" cy="161" r="4"/><circle cx="257" cy="207" r="3"/><circle cx="383" cy="140" r="4"/><circle cx="708" cy="173" r="4"/><circle cx="817" cy="203" r="3"/><circle cx="167" cy="267" r="3"/><circle cx="766" cy="270" r="4"/></g>
   <g fill="#f5b696"><circle cx="216" cy="257" r="4"/><circle cx="449" cy="281" r="3"/><circle cx="714" cy="247" r="4"/></g>
  </g>}  <circle cx="609" cy="117" r={success?45:25} fill="#ffe8a0" opacity={success?.2:.06}/>
 </svg>;
}
export function WordHuntScene({options,onChoose,disabled,selected,scaffoldIds=[],success=false,restoredWord,chapter=0,companion}:{options:HuntOption[],onChoose:(id:string)=>void,disabled:boolean,selected?:string,scaffoldIds?:string[],success?:boolean,restoredWord?:string,chapter?:number,companion?:Companion}){
 const host=useRef<HTMLDivElement>(null), lit=useRef(success);
 const [active,setActive]=useState(false);
 const chosenIndex=success?options.findIndex(option=>option.id===selected):-1;
 const chosenPosition=chosenIndex>=0?positions[chosenIndex]:undefined;
 lit.current=success;
 useEffect(()=>{
  const mount=host.current;if(!mount)return;
  let game:Phaser.Game;
  try{
   class Hunt extends Phaser.Scene{
    private sparks:Phaser.GameObjects.Arc[]=[];
    private wasLit=false;
    constructor(){super('word-hunt')}
    create(){
     const {width,height}=this.scale;
     for(let i=0;i<12;i++){
      const spark=this.add.circle(width*(.08+(i*37%83)/100),height*(.13+(i*29%61)/100),2+(i%3),0xffe4a0,.42);
      this.sparks.push(spark);
      this.tweens.add({targets:spark,y:spark.y-18-(i%4)*7,alpha:{from:.2,to:.75},scale:{from:.65,to:1.3},duration:1300+i*83,yoyo:true,repeat:-1,delay:i*127});
     }
     this.scale.on('resize',(size:Phaser.Structs.Size)=>this.sparks.forEach((spark,i)=>spark.setPosition(size.width*(.08+(i*37%83)/100),size.height*(.13+(i*29%61)/100))));
    }
    update(){
     if(lit.current&&!this.wasLit){
      this.wasLit=true;
      this.cameras.main.flash(360,255,226,155,false);
      this.sparks.forEach(s=>s.setFillStyle(0xfff0ae,1));
     }
    }
   }
   game=new Phaser.Game({type:Phaser.AUTO,parent:mount,transparent:true,scale:{mode:Phaser.Scale.RESIZE,width:mount.clientWidth,height:mount.clientHeight},scene:Hunt,audio:{noAudio:true},banner:false});
   setActive(true);
  }catch{setActive(false);return}
  const observer=new ResizeObserver(()=>{if(mount.clientWidth&&mount.clientHeight)game.scale.resize(mount.clientWidth,mount.clientHeight)});observer.observe(mount);
  return()=>{observer.disconnect();game.destroy(true)};
 },[]);
 return <div className={`hunt-stage hunt-chapter-${chapter} ${active?'phaser-active':''} ${success?'restored':''}`} dir="ltr">
  <ForestBackdrop/><HuntSetting success={success}/>{companion&&<div className="hunt-companion" aria-hidden="true"><span className="hunt-companion-perch"/><Creature kind={companion} size={128} happy={success}/>{success&&<span className="hunt-companion-spark">✦</span>}</div>}<div className="hunt-npc" aria-hidden="true"><Creature kind="moth" size={96}/><span className="hunt-gesture">✦</span></div>
  <HuntRelic chapter={chapter} success={success} word={restoredWord}/>
  {chosenPosition&&<svg className="hunt-restoration-trail" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true"><path d={`M ${chosenPosition.x*1000} ${chosenPosition.y*1000} Q 530 590 610 450`}/><circle cx="610" cy="450" r="12"/></svg>}
  <div className="hunt-objects">{options.map((option,index)=><button key={option.id} className={`${selected===option.id?'chosen':''} ${success&&selected===option.id?'restoring':''} ${scaffoldIds.includes(option.id)?'scaffold':''}`} aria-label={option.text} disabled={disabled} style={{left:`${positions[index].x*100}%`,top:`${positions[index].y*100}%`}} onClick={()=>onChoose(option.id)}><ObjectArt kind={option.art||option.id} size={114}/>{success&&selected===option.id&&<span className="hunt-restored-mark" aria-hidden="true">✦</span>}{scaffoldIds.includes(option.id)&&<span className="hunt-help-mark" aria-hidden="true">✦</span>}</button>)}</div>
  <div ref={host} className="hunt-phaser" aria-hidden="true"/>
 </div>;
}


