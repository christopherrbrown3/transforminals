import { CREATURES } from './data';
export const SAVE_VERSION=2;
export interface SaveData {version:number;rescued:string[];defeated:string[];discovered:string[];portals:string[];location:{biome:string;x:number;z:number};settings:{muted:boolean;volume:number;reducedMotion:boolean};}
export const freshSave=():SaveData=>({version:SAVE_VERSION,rescued:[],defeated:[],discovered:['meadow'],portals:['meadow'],location:{biome:'meadow',x:0,z:7},settings:{muted:false,volume:0.35,reducedMotion:false}});
export function canEnterFinal(rescued:readonly string[]) {return CREATURES.every(c=>rescued.includes(c.id));}
export function rescue(save:SaveData,id:string) {if(!CREATURES.some(c=>c.id===id)||save.rescued.includes(id))return false; save.rescued.push(id);return true;}
export function canTransform(save:SaveData,id:string){return id==='human'||save.rescued.includes(id);}
export function bossHearts(hits:number,total=5){return Math.max(0,3-Math.floor(Math.max(0,Math.min(hits,total))*3/total));}
export function headStompEligible(player:{x:number;y:number;z:number;vy:number},target:{x:number;z:number;height:number},previousY:number){return player.vy<=0&&Math.hypot(player.x-target.x,player.z-target.z)<3.2&&previousY>=target.height-0.65&&player.y<=target.height+0.65;}
export function cageLanding(player:{x:number;y:number;z:number;vy:number},cage:{x:number;z:number},previousY:number){return player.vy<=0&&Math.abs(player.x-cage.x)<2.65&&Math.abs(player.z-cage.z)<2.65&&previousY>=0.8&&player.y<=1.8;}
