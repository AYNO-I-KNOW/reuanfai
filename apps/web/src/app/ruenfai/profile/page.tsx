'use client';
import MotherAvatarPicker from '../MotherAvatarPicker';
import {motherIdentity} from '../mother-identity';
import {useRef,useState} from 'react';
import Link from 'next/link';
import {ChevronLeft} from 'lucide-react';
import {motherProfile} from '@/design/care-demo';
import {profileDetails} from './profile-details';
import {useToast} from '../ToastProvider';
import s from './profile.module.css';
import foundation from '../foundation.module.css';
import {SheetDate,SheetSelect} from '../PickerSheet';
export default function ProfilePage(){
 const identity=motherIdentity.use();
 const profile=motherProfile.use(),details=profileDetails.use(),toast=useToast();
 const [avatarDraft,setAvatarDraft]=useState(identity.avatarId);
 const [nicknameDraft,setNicknameDraft]=useState(identity.nickname);
 const [editing,setEditing]=useState(false);
 const [direction,setDirection]=useState(1);
 const [phase,setPhase]=useState<'idle'|'out'|'in'>('idle');
 const page=useRef<HTMLElement>(null),busy=useRef(false);
 function changeView(next:boolean,save=false){if(busy.current)return;busy.current=true;setDirection(next?1:-1);setPhase('out');const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;window.setTimeout(()=>{if(save){motherProfile.set(draft);profileDetails.set(extra);motherIdentity.set(previous=>({...previous,nickname:nicknameDraft.trim(),avatarId:avatarDraft}));}setEditing(next);page.current?.scrollTo({top:0,behavior:'instant'});setPhase('in');if(save)toast('บันทึกข้อมูลคุณแม่แล้ว');window.setTimeout(()=>{setPhase('idle');busy.current=false;},reduced?0:260);},reduced?0:160);}
 const [draft,setDraft]=useState(profile),[extra,setExtra]=useState(details);
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const row=(label:string,value:string)=><div><dt>{label}</dt><dd>{value||'ยังไม่ได้ระบุ'}</dd></div>;
 function edit(){setAvatarDraft(identity.avatarId);setNicknameDraft(identity.nickname);setDraft(profile);setExtra(details);changeView(true);}
 return <main ref={page} data-profile-phase={phase} data-profile-direction={direction} className={`${s.page} ${editing?s.editPage:''} ${phase==='out'?s.viewOut:phase==='in'?s.viewIn:''}`}><header className={s.header}>{editing?<button type="button" onClick={()=>changeView(false)} aria-label="ยกเลิกการแก้ไข"><ChevronLeft size={22}/></button>:<Link href="/ruenfai" aria-label="กลับหน้าแรก"><ChevronLeft size={22}/></Link>}<h1 className={editing?s.srOnly:undefined}>{editing?'แก้ไขข้อมูลคุณแม่':'ข้อมูลคุณแม่'}</h1></header>
 {editing?<form className={s.form} onSubmit={event=>{event.preventDefault();if(!nicknameDraft.trim())return;changeView(false,true);}}>
 <MotherAvatarPicker value={avatarDraft} onChange={setAvatarDraft}/>
 <section><h2>ข้อมูลส่วนตัว</h2><label>ชื่อเล่นคุณแม่<input required autoComplete="nickname" maxLength={40} value={nicknameDraft} onChange={e=>setNicknameDraft(e.target.value)} placeholder="ระบุชื่อเล่นคุณแม่"/></label><label>ชื่อคุณแม่<input autoComplete="name" value={extra.name} onChange={e=>setExtra({...extra,name:e.target.value})}/></label><label>เบอร์ติดต่อ<input type="tel" inputMode="tel" autoComplete="tel" pattern="[0-9+() −-]{8,20}" value={draft.phone} onChange={e=>setDraft({...draft,phone:e.target.value})}/></label></section>
 <section><h2>ข้อมูลหลังคลอด</h2><div className={s.pickerField}><span>วันคลอด</span><SheetDate label="วันคลอด" max={today} value={draft.deliveryDate} onChange={value=>setDraft({...draft,deliveryDate:value})}/></div><div className={s.pickerField}><span>วิธีคลอด</span><SheetSelect ariaLabel="วิธีคลอด" value={draft.birth} onChange={e=>setDraft({...draft,birth:e.target.value})} options={[...new Set([draft.birth,'คลอดทางช่องคลอด','ผ่าคลอด'])].filter(Boolean).map(value=>({value,label:value}))}/></div></section>
 <section><h2>ข้อมูลสุขภาพ</h2><label>โรคประจำตัว<textarea rows={2} placeholder="ระบุโรคประจำตัว หรือ ไม่มี" value={extra.conditions} onChange={e=>setExtra({...extra,conditions:e.target.value})}/></label><label>ประวัติแพ้ยา<textarea rows={2} placeholder="ระบุชื่อยาและอาการ หรือ ไม่ทราบ" value={extra.allergies} onChange={e=>setExtra({...extra,allergies:e.target.value})}/></label></section>
 <section><h2>ผู้ติดต่อฉุกเฉิน</h2><label>ชื่อผู้ติดต่อ<input value={extra.contactName} onChange={e=>setExtra({...extra,contactName:e.target.value})}/></label><label>ความสัมพันธ์<input value={extra.relationship} onChange={e=>setExtra({...extra,relationship:e.target.value})}/></label><label>เบอร์โทร<input type="tel" inputMode="tel" pattern="[0-9+() −-]{8,20}" value={draft.emergencyPhone} onChange={e=>setDraft({...draft,emergencyPhone:e.target.value})}/></label></section>
 <footer className={s.footer}><button type="submit" className={foundation.primary}>บันทึกข้อมูล</button></footer></form>:<><div className={s.identity}><MotherAvatarPicker/></div><section><h2>ข้อมูลส่วนตัว</h2><dl>{row('ชื่อเล่น',identity.nickname.trim())}{row('ชื่อ',details.name)}{row('เบอร์ติดต่อ',profile.phone)}</dl></section><section><h2>ข้อมูลหลังคลอด</h2><dl>{row('วันคลอด',profile.deliveryDate?new Date(profile.deliveryDate+'T12:00:00').toLocaleDateString('th-TH',{day:'numeric',month:'long',year:'numeric'}):'')}{row('วิธีคลอด',profile.birth)}</dl></section><section><h2>ข้อมูลสุขภาพ</h2><dl>{row('โรคประจำตัว',details.conditions)}{row('ประวัติแพ้ยา',details.allergies)}</dl></section><section><h2>ผู้ติดต่อฉุกเฉิน</h2><dl>{row('ชื่อ',details.contactName)}{row('ความสัมพันธ์',details.relationship)}{row('เบอร์โทร',profile.emergencyPhone)}</dl></section><footer className={s.footer}><button type="button" className={foundation.primary} onClick={edit}>แก้ไขข้อมูล</button></footer></>}
 </main>;
}
