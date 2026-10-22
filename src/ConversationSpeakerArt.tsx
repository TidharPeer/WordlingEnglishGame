import { PaintedArt } from './Art';
const portraits: Record<string,string> = { Nettle:'nettle', Hush:'owl', Bramble:'dragon', Tock:'tock', Lyra:'lyra', Puck:'moth' };
export function ConversationSpeakerArt({speaker,happy,size=130}:{speaker?:string;happy:boolean;size?:number}) {
 return <PaintedArt name={portraits[speaker || ''] || 'moth'} size={size} happy={happy}/>;
}
