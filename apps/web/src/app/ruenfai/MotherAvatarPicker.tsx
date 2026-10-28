"use client";
import Image from 'next/image';
import {useEffect} from 'react';
import {Check,Pencil,Shuffle} from 'lucide-react';
import {PickerSheet} from './PickerSheet';
import {motherIdentity,motherAvatars,avatarSource,ensureMotherAvatar} from './mother-identity';
import s from './mother-avatar.module.css';
export default function MotherAvatarPicker({value,onChange}:{value?:string;onChange?:(id:string)=>void}={}){
 const identity=motherIdentity.use();
 const selected=value??identity.avatarId;
 useEffect(()=>{if(value===undefined)ensureMotherAvatar()},[value]);
 function choose(id:string){if(onChange)onChange(id);else motherIdentity.set(previous=>({...previous,avatarId:id}));}
 return <div className={s.picker}><PickerSheet title="เลือกรูปโปรไฟล์" trigger={<><span className={s.portrait}><Image src={avatarSource(selected)} alt="" width={88} height={88} loading="eager"/><span className={s.edit}><Pencil size={14}/></span></span></>}>{close=><div className={s.grid}>{motherAvatars.map(avatar=><button type="button" key={avatar.id} aria-label={avatar.label} aria-pressed={selected===avatar.id} onClick={()=>{choose(avatar.id);close()}}><Image src={avatar.src} alt="" width={88} height={88}/>{selected===avatar.id&&<span className={s.selected}><Check size={16}/></span>}</button>)}</div>}</PickerSheet><button type="button" className={s.random} onClick={()=>{const options=motherAvatars.filter(avatar=>avatar.id!==selected);choose(options[Math.floor(Math.random()*options.length)].id)}}><Shuffle size={16}/><span>สุ่มรูป</span></button><span className={s.srOnly} aria-live="polite">{motherAvatars.find(avatar=>avatar.id===selected)?.label}</span></div>;
}
