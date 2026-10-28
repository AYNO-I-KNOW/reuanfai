'use client';
import {useEffect,useId,useRef,useState} from 'react';
import SheetResize from './SheetResize';
import {flushSync} from 'react-dom';
import {Copy,MapPin,Share2,X} from 'lucide-react';
import {motherProfile} from '@/design/care-demo';
import {SolidEmergency,SolidPhone} from './SolidIcons';
import s from './page.module.css';
import e from './emergency-action.module.css';
import {phoneDigits,phoneValid} from './phone';
type Position={latitude:number;longitude:number;accuracy:number;time:number};
export default function EmergencyAction({subtle=false}:{subtle?:boolean}){
 const dialog=useRef<HTMLDialogElement>(null),request=useRef(0);const title=useId(),placeId=useId(),symptomId=useId();
 const patientGesture=useRef<{x:number;y:number}|null>(null),patientSwiped=useRef(false);
 const [closing,setClosing]=useState(false),[phone,setPhone]=useState(''),[callback,setCallback]=useState(''),[patient,setPatient]=useState<'mother'|'baby'>('mother'),[context,setContext]=useState('');
 const [place,setPlace]=useState(''),[symptoms,setSymptoms]=useState(''),[position,setPosition]=useState<Position|null>(null),[locating,setLocating]=useState(false),[locationError,setLocationError]=useState(''),[notice,setNotice]=useState('');
 useEffect(()=>()=>{request.current++},[]);
 const open=()=>{
  const profile=motherProfile.snapshot();let saved=profile.emergencyPhone;
  // Legacy key from earlier previews: read only when the profile has no number, then migrate it.
  if(!phoneValid(saved))try{const legacy=localStorage.getItem('ruenfai-emergency-phone')??'';if(phoneValid(legacy)){saved=phoneDigits(legacy);motherProfile.set({...profile,emergencyPhone:saved});localStorage.removeItem('ruenfai-emergency-phone')}}catch{}
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok'}).format(new Date());const elapsed=Math.floor((Date.parse(today+'T00:00:00Z')-Date.parse(profile.deliveryDate+'T00:00:00Z'))/86400000);
  flushSync(()=>{setPhone(phoneValid(saved)?phoneDigits(saved):'');setCallback(phoneValid(profile.phone)?phoneDigits(profile.phone):'');setContext(Number.isFinite(elapsed)&&elapsed>=0?`หลังคลอด ${elapsed} วัน${profile.birth?` (${profile.birth})`:''}`:'หลังคลอด');setClosing(false);setNotice('')});
  dialog.current?.showModal();
  locate();
 };
 const finish=()=>{request.current++;setLocating(false);setPosition(null);dialog.current?.close();setClosing(false)};
 const close=()=>{if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)finish();else setClosing(true)};
 const locate=()=>{
  if(!window.isSecureContext){setLocationError('เปิดผ่าน HTTPS หรือ localhost เพื่อใช้ตำแหน่ง');return}
  if(!navigator.geolocation){setLocationError('เบราว์เซอร์นี้ไม่รองรับตำแหน่ง');return}
  const token=++request.current;setLocating(true);setLocationError('');
  const success=(value:GeolocationPosition)=>{if(request.current!==token)return;setPosition({latitude:value.coords.latitude,longitude:value.coords.longitude,accuracy:value.coords.accuracy,time:value.timestamp});setLocating(false)};
  const failure=(error:GeolocationPositionError)=>{if(request.current!==token)return;if(process.env.NODE_ENV!=='production')console.warn('Emergency geolocation',error.code,error.message);setLocating(false);setLocationError(error.code===1?'อนุญาตตำแหน่งให้เว็บนี้ในเบราว์เซอร์ แล้วกดลองใหม่':error.code===3?'ค้นหาตำแหน่งนานเกินไป ลองอีกครั้งหรือระบุสถานที่เอง':'เครื่องยังหาตำแหน่งไม่ได้ ตรวจว่าเปิด Location Services แล้วกดลองใหม่')};
  navigator.geolocation.getCurrentPosition(success,error=>{if(request.current!==token)return;if(error.code===1){failure(error);return}navigator.geolocation.getCurrentPosition(success,failure,{enableHighAccuracy:true,timeout:20000,maximumAge:60000})},{enableHighAccuracy:false,timeout:12000,maximumAge:60000});
 };
 const patientText=patient==='mother'?`ผู้ป่วยเป็นคุณแม่${context}`:'ผู้ป่วยเป็นเด็ก / ทารก (โปรดบอกอายุให้เจ้าหน้าที่ทราบ)';
 const message=[patientText,symptoms.trim()?`อาการ: ${symptoms.trim()}`:null,place.trim()?`สถานที่: ${place.trim()}`:null,position?`พิกัด: ${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)} (คลาดเคลื่อนประมาณ ${Math.round(position.accuracy)} เมตร)`:null,callback?`เบอร์ติดต่อกลับ: ${callback}`:null].filter(Boolean).join('\n');
 const copy=async()=>{try{await navigator.clipboard.writeText(message);setNotice('คัดลอกข้อมูลแจ้งเหตุแล้ว')}catch{setNotice('คัดลอกไม่ได้ กรุณาอ่านข้อความด้านล่างให้เจ้าหน้าที่ฟัง')}};
 const share=async()=>{if(!navigator.share){await copy();return}try{await navigator.share({title:'ข้อมูลขอความช่วยเหลือ',text:message});setNotice('ดำเนินการในหน้าต่างแชร์แล้ว')}catch(error){if(!(error instanceof DOMException&&error.name==='AbortError'))setNotice('แชร์ไม่ได้ สามารถคัดลอกข้อความแทนได้')}};
 return <>
  <button type="button" className={`${e.trigger} ${subtle?e.subtle:''}`} aria-label="ติดต่อฉุกเฉิน" aria-haspopup="dialog" onClick={open}><SolidEmergency size={subtle?20:24}/>{subtle&&<span>ฉุกเฉิน</span>}</button>
  <dialog ref={dialog} className={s.medicineDialog} aria-labelledby={title} onCancel={event=>{event.preventDefault();close()}} onClick={event=>{if(event.target===event.currentTarget)close()}}>
   <section className={`${s.medicineSheet} ${e.sheet} ${closing?s.medicineClosing:''}`} onAnimationEnd={event=>{if(event.target===event.currentTarget&&closing)finish()}}>
    <SheetResize onDismiss={close}/>
    <header className={`${s.medicineSheetHeader} ${e.header}`}><h2 id={title}>ขอความช่วยเหลือฉุกเฉิน</h2><button type="button" aria-label="ปิดช่องทางฉุกเฉิน" onClick={close} autoFocus><X size={20}/></button></header>
    <div className={`${s.medicineSheetBody} ${e.body}`}>
     <fieldset className={e.patient}><legend>ขอความช่วยเหลือให้</legend><div className={e.segment} data-patient={patient} role="radiogroup" aria-label="ผู้ป่วย" onPointerDown={event=>{patientSwiped.current=false;patientGesture.current={x:event.clientX,y:event.clientY}}} onPointerUp={event=>{const start=patientGesture.current;patientGesture.current=null;if(!start)return;const dx=event.clientX-start.x,dy=event.clientY-start.y;if(Math.abs(dx)>24&&Math.abs(dx)>Math.abs(dy)*1.3){patientSwiped.current=true;setPatient(dx>0?'baby':'mother')}}} onPointerCancel={()=>{patientGesture.current=null;patientSwiped.current=false}} onKeyDown={event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const next=event.key==='ArrowLeft'||event.key==='Home'?'mother':'baby';setPatient(next);event.currentTarget.querySelector<HTMLButtonElement>(`[data-value="${next}"]`)?.focus()}}><span className={e.segmentThumb} aria-hidden="true"/>{(['mother','baby'] as const).map(value=><button key={value} type="button" role="radio" data-value={value} aria-checked={patient===value} tabIndex={patient===value?0:-1} onClick={event=>{if(event.detail===0||!patientSwiped.current)setPatient(value);patientSwiped.current=false}}>{value==='mother'?'คุณแม่':'ลูกน้อย'}</button>)}</div></fieldset>
     <section className={e.location} aria-label="สถานที่เกิดเหตุ"><div className={e.sectionHeading}><h3><MapPin size={18}/>สถานที่เกิดเหตุ</h3><button type="button" disabled={locating} onClick={locate}>{locating?'กำลังค้นหา…':position?'อัปเดตพิกัด':'ใช้ตำแหน่งปัจจุบัน'}</button></div>
      {position&&<p className={e.coordinates}>{position.latitude.toFixed(6)}, {position.longitude.toFixed(6)}<small>อัปเดต {new Date(position.time).toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})} · คลาดเคลื่อนประมาณ {Math.round(position.accuracy)} ม.</small><a className={e.map} href={`https://www.google.com/maps/search/?api=1&query=${position.latitude},${position.longitude}`} target="_blank" rel="noreferrer">ดูใน Google Maps</a><small>เปิดแผนที่จะแชร์พิกัดกับ Google</small></p>}
      {locationError&&<p role="status" className={e.error}>{locationError}</p>}
      <label htmlFor={placeId}>ที่อยู่ / จุดสังเกต / ทางเข้า</label><textarea id={placeId} value={place} onChange={event=>setPlace(event.target.value)} rows={2} maxLength={500} placeholder="เช่น บ้านเลขที่ ซอย ชั้น หรือจุดสังเกตใกล้ตัว"/>
      
     </section>
     <label className={e.field} htmlFor={symptomId}>อาการที่เห็นตอนนี้<textarea id={symptomId} value={symptoms} onChange={event=>setSymptoms(event.target.value)} rows={2} maxLength={500} placeholder="บอกอาการ รู้สึกตัวไหม หายใจเป็นอย่างไร"/></label>
     <section className={e.readout} aria-label="ข้อความแจ้งเหตุ"><h3>ข้อมูลแจ้งเหตุ</h3><p>{message}</p><div className={e.actions}><button type="button" onClick={copy}><Copy size={17}/>คัดลอก</button><button type="button" onClick={share}><Share2 size={17}/>แชร์ให้คนใกล้ชิด</button></div></section>
     <p className={e.notice} role="status">{notice}</p>

    </div>
    <div className={e.callArea}>
     <a className={e.call} href="tel:1669"><SolidPhone size={20}/><span>โทร 1669</span></a>
     {phone?<a className={e.contact} href={`tel:${phone}`}><SolidPhone size={20}/>โทรผู้ติดต่อ</a>:<p className={e.missing}>ยังไม่ได้ตั้งเบอร์ผู้ติดต่อฉุกเฉิน</p>}
    </div>
   </section>
  </dialog>
 </>;
}
