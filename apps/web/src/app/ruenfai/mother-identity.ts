"use client";
import {createDemoStore} from '@/design/demo-store';
// User-selected portrait sheet: 01–12, ordered left to right, top to bottom.
export const motherAvatars = Array.from({length:12},(_,index)=>{
 const number=String(index+1).padStart(2,'0');
 return {id:`mother-${number}`,src:`/images/ruenfai/avatars/mother-${number}.png`,label:`รูปโปรไฟล์ ${number}`};
});
const initial={nickname:'',avatarId:''};
export const motherIdentity=createDemoStore('ruenfai-mother-identity-v1',initial,(value):value is typeof initial=>{
 if(typeof value!=='object'||value===null)return false;
 const v=value as Record<string,unknown>;
 return typeof v.nickname==='string'&&v.nickname.length<=40&&typeof v.avatarId==='string'&&(v.avatarId===''||['ruenfai','smile','happy'].includes(v.avatarId)||motherAvatars.some(a=>a.id===v.avatarId));
});
export const avatarSource=(id:string)=> (motherAvatars.find(a=>a.id===id)||motherAvatars[0]).src;
export function ensureMotherAvatar(){
 const saved=motherIdentity.snapshot();
 if(!motherAvatars.some(avatar=>avatar.id===saved.avatarId))motherIdentity.set({...saved,avatarId:motherAvatars[Math.floor(Math.random()*motherAvatars.length)].id});
}
