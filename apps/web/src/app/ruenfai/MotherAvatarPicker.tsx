"use client";
import Image from 'next/image';
import {useEffect} from 'react';
import {Check,Pencil,Shuffle} from 'lucide-react';
import {PickerSheet} from './PickerSheet';
import {motherIdentity,motherAvatars,avatarSource,ensureMotherAvatar} from './mother-identity';
import s from './mother-avatar.module.css';
export default function MotherAvatarPicker(){
 const identity=motherIdentity.use();
 useEffect(()=>{ensureMotherAvatar()},[]);
 return <div className={s.picker}><PickerSheet title="เลือกรูปโปรไฟล์" trigger={<><span className={s.portrait}><Image src={avatarSource(identity.avatarId)} alt="" width={88} height={88} loading="eager"/><span className={s.edit}><Pencil size={14}/></span></span></>}>{close=><div className={s.grid}>{motherAvatars.map(avatar=><button type="button" key={avatar.id} aria-label={avatar.label} aria-pressed={identity.avatarId===avatar.id} onClick={()=>{motherIdentity.set(previous=>({...previous,avatarId:avatar.id}));close()}}><Image src={avatar.src} alt="" width={88} height={88}/>{identity.avatarId===avatar.id&&<span className={s.selected}><Check size={16}/></span>}</button>)}</div>}</PickerSheet><button type="button" className={s.random} onClick={()=>{motherIdentity.set(previous=>{const options=motherAvatars.filter(avatar=>avatar.id!==previous.avatarId);return {...previous,avatarId:options[Math.floor(Math.random()*options.length)].id}})}}><Shuffle size={16}/><span>สุ่มรูป</span></button><span className={s.srOnly} aria-live="polite">{motherAvatars.find(avatar=>avatar.id===identity.avatarId)?.label}</span></div>;
}
