import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { Creature, ForestBackdrop, type CreatureKind } from './Art'
import { useTranslation } from 'react-i18next'
import { chapters } from './content'
const locations=[{x:.23,y:.73},{x:.40,y:.61},{x:.56,y:.70},{x:.68,y:.51},{x:.82,y:.43},{x:.62,y:.29}]
export function ForestScene({chapter,completed,onSelect,reducedMotion=false,companion='pip'}:{chapter:number,completed:number,onSelect:(chapter:number)=>void,reducedMotion?:boolean,companion?:CreatureKind}){
 const host=useRef<HTMLDivElement>(null);const {t,i18n}=useTranslation();const language=i18n.language==='he'?'he':'en'
 useEffect(()=>{
 if(!host.current)return;const mount=host.current
 class Woods extends Phaser.Scene{
 constructor(){super('woods')}
 create(){const draw=()=>{
 this.tweens.killAll();this.children.removeAll(true);const {width:w,height:h}=this.scale;const route=this.add.graphics()
 for(let i=0;i<locations.length-1;i++){const a=locations[i],b=locations[i+1];for(let t=0;t<1;t+=.09){route.fillStyle(0xf7e6b0,.55);route.fillCircle(Phaser.Math.Linear(a.x,b.x,t)*w,Phaser.Math.Linear(a.y,b.y,t)*h,2)}}
 if(!reducedMotion){for(let i=0;i<20;i++){const light=this.add.circle((.1+Math.random()*.8)*w,(.14+Math.random()*.7)*h,1+Math.random()*1.5,0xffe8ac,.5);this.tweens.add({targets:light,y:light.y-25,alpha:.08,duration:2300+Math.random()*2800,yoyo:true,repeat:-1,delay:Math.random()*1800})}}
 };draw();this.scale.on('resize',draw)}
 }
 const game=new Phaser.Game({type:Phaser.AUTO,parent:mount,transparent:true,scale:{mode:Phaser.Scale.RESIZE,width:mount.clientWidth,height:mount.clientHeight},scene:Woods,render:{antialias:true},audio:{noAudio:true},banner:false})
 const observer=new ResizeObserver(()=>{if(mount.clientWidth&&mount.clientHeight)game.scale.resize(mount.clientWidth,mount.clientHeight)});observer.observe(mount);return()=>{observer.disconnect();game.destroy(true)}
 },[reducedMotion])
 return <div className={`forest-scene ${reducedMotion?'reduced-motion':''}`}><ForestBackdrop/><div ref={host} className="forest-canvas" aria-hidden="true"/><div className="forest-nodes">{locations.map((p,index)=><button key={index} className={`forest-node ${index<completed?'is-complete':''} ${index===chapter?'is-selected':''}`} style={{left:`${p.x*100}%`,top:`${p.y*100}%`}} disabled={index>completed} onClick={()=>onSelect(index)} aria-current={index===chapter?'step':undefined} aria-label={`${t('chapter',{n:index+1})}: ${chapters[index].name[language]}`} title={chapters[index].name[language]}><span className={index<completed?'node-check':''}>{index<completed?'✓':index+1}</span></button>)}</div><div className="forest-scene-companion"><Creature kind={companion} size={150}/></div></div>
}

