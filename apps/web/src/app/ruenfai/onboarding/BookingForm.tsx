'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import r from './results.module.css';
import {ChevronLeft} from 'lucide-react';
import {SheetSelect as ProviderSelect,SheetDate} from '../PickerSheet';
import Checkbox from '@/components/ui/reuanfai-checkbox';
import s from './onboarding.module.css';
import b from './booking.module.css';
import shared from '../page.module.css';
import {futureSlot,saveBooking,useCareDemo} from '@/design/care-demo';
const services=['นวดไทย','ประคบสมุนไพร','ทับหม้อเกลือ','อบสมุนไพร','นวดกระตุ้นน้ำนม','ก้อนเส้า'];
const units=['ศูนย์บริการแพทย์แผนไทย (ตัวอย่าง)','โรงพยาบาลชุมชน (ตัวอย่าง)','คลินิกแพทย์แผนไทย (ตัวอย่าง)'];
export default function BookingForm({onBack}:{onBack:()=>void}){
 const care=useCareDemo();
 const [unit,setUnit]=useState('');const [selected,setSelected]=useState<string[]>([]);const [date,setDate]=useState('');const [time,setTime]=useState('');const [success,setSuccess]=useState(false);const [submitting,setSubmitting]=useState(false);const [rights,setRights]=useState('');const confirmation=useRef<HTMLDialogElement>(null);const review=false;
 const [clock,setClock]=useState(()=>Date.now());
 useEffect(()=>{const timer=setInterval(()=>setClock(Date.now()),30000);return()=>clearInterval(timer);},[]);
 const timeSection=useRef<HTMLFieldSetElement>(null);const page=useRef<HTMLElement>(null);
 useEffect(()=>{if(!date)return;const timer=setTimeout(()=>{const field=timeSection.current,container=page.current;if(!field||!container)return;const bottom=field.getBoundingClientRect().bottom;const available=window.innerHeight-120;if(bottom>available)container.scrollBy({top:bottom-available,behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});},280);return()=>clearTimeout(timer);},[date]);
 useEffect(()=>{if(!submitting)return;const timer=setTimeout(()=>{setSuccess(saveBooking({unit,services:selected,date,time,rights}));setSubmitting(false);},1500);return()=>clearTimeout(timer);},[submitting,unit,selected,date,time,rights]);
 const todayParts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const todayYear=Number(todayParts.find(p=>p.type==='year')?.value);const todayMonth=Number(todayParts.find(p=>p.type==='month')?.value)-1;const todayDay=Number(todayParts.find(p=>p.type==='day')?.value);
 const todayKey=`${todayYear}-${String(todayMonth+1).padStart(2,'0')}-${String(todayDay).padStart(2,'0')}`;
 const dateLabel=date?new Intl.DateTimeFormat('th-TH',{day:'numeric',month:'long',year:'numeric'}).format(new Date(`${date}T12:00:00+07:00`)):'เลือกวันที่เข้ารับบริการ';
 const reserved=(slot:string)=>care.bookings.some(b=>b.unit===unit&&b.date===date&&b.time===slot&&care.appointments.find(a=>a.id===b.id)?.status!=='ยกเลิก');
 const valid=!reserved(time)&&!!unit&&selected.length>0&&!!date&&futureSlot(date,time,clock)&&!!rights;
 if(success)return <main className={r.page}><section className={`${r.content} ${b.successContent}`}><div className={b.successHero}><picture className={b.successAnimation}><source media="(prefers-reduced-motion: reduce)" srcSet="/images/ruenfai/results/success-check-static.svg?v=purple"/><img src="/images/ruenfai/results/success-check.svg?v=purple" width="128" height="128" alt=""/></picture><h1>ยืนยันการจองสำเร็จ</h1><p className={b.successDescription}>กรุณาเข้ารับบริการตามวันและเวลาที่เลือก<br/>กับหน่วยบริการที่คุณจองไว้</p></div></section><footer className={r.footer}><Link className={r.primary} href="/ruenfai">กลับสู่หน้าแรก</Link></footer></main>;
 return <main ref={page} className={`${s.page} ${s.formPage} ${b.page}`}><header className={s.quizHeader}><div className={s.flowHeaderRow}><button type="button" disabled={submitting} aria-label={review?'กลับไปแก้ไขการจอง':'กลับไปผลการประเมิน'} onClick={()=>review?confirmation.current?.close():onBack()}><ChevronLeft size={18}/></button></div></header>
 <div className={`${s.content} ${s.quizContent}`} inert={submitting}><div key={review?'review':'form'} className={s.forward}><div className={s.stepTitle}><h1>{review?'ตรวจสอบการจอง':'จองคิวรับบริการ'}</h1><p>{review?'ตรวจสอบหน่วยบริการ หัตถการ และเวลาที่เลือก':'เลือกหน่วยบริการ หัตถการ และวันเวลาที่คุณสะดวก'}</p></div>
 {review?<section className={b.review}><div><span>หน่วยบริการ</span><p>{unit}</p></div><div><span>หัตถการที่เลือก</span><p>{selected.join(' · ')}</p></div><div><span>วันและเวลา</span><p>{dateLabel} · {time} น.</p></div><p className={b.note}>ข้อมูลคิวจำลอง ยังไม่มีการส่งคำขอจองไปยังหน่วยบริการ</p></section>:<div className={b.fields}><div className={s.dropdownField}><label>หน่วยบริการ</label><ProviderSelect ariaLabel="หน่วยบริการที่ต้องการจอง" value={unit} onChange={event=>{setUnit(event.target.value);setTime('');}} expandBelow options={[{value:'',label:'เลือกหน่วยบริการ'},...units.map(value=>({value,label:value}))]}/></div>
 <fieldset className={b.services}><legend>หัตถการที่ต้องการรับบริการ <small className={b.inlineStatus}>(เลือกได้หลายรายการ)</small></legend>{services.map(service=><Checkbox key={service} disabled={['ก้อนเส้า','อบสมุนไพร','นวดกระตุ้นน้ำนม'].includes(service)} checked={selected.includes(service)} onChange={checked=>{setSelected(items=>checked?[...items,service]:items.filter(item=>item!==service));setTime('');}}><span>{service}{service==='ก้อนเส้า'&&<small className={b.inlineStatus}> (ห้าม)</small>}{(service==='อบสมุนไพร'||service==='นวดกระตุ้นน้ำนม')&&<small className={b.inlineStatus}> (รอประเมิน)</small>}</span></Checkbox>)}</fieldset>
 <div className={s.dropdownField}><label>สิทธิที่ใช้รับบริการ</label><ProviderSelect ariaLabel="สิทธิที่ใช้รับบริการ" value={rights} onChange={event=>setRights(event.target.value)} expandBelow options={[{value:'',label:'เลือกสิทธิ'},...['บัตรทอง','ประกันสังคม','สิทธิข้าราชการ','ชำระเงินเอง'].map(value=>({value,label:value}))]}/></div><div className={s.dateField}><label>วันที่เข้ารับบริการ</label><SheetDate label="วันที่เข้ารับบริการ" min={todayKey} value={date} onChange={value=>{setDate(value);setTime('')}}/></div>
 <div className={`${b.timeReveal} ${date?b.timeRevealOpen:''}`} inert={!date}><div><fieldset ref={timeSection} className={b.times}><legend>ช่วงเวลาที่สะดวก</legend><div className={b.timeGrid}>{Array.from({length:10},(_,index)=>index+9).map(hour=>{const label=`${String(hour).padStart(2,'0')}:00`;const booked=reserved(label)||(hour+Number(date.slice(-2))+units.indexOf(unit))%4===0;return <button key={hour} type="button" disabled={booked||!unit||!futureSlot(date,label,clock)} aria-pressed={time===label} aria-label={`${label} น.${booked?' เต็มแล้ว':''}`} onClick={()=>setTime(label)}>{label}</button>;})}</div></fieldset></div></div>
 </div>}</div></div>
 <footer className={s.footer}><button className={`${shared.doseConfirm} ${submitting?b.submitting:''}`} type="button" disabled={!valid||submitting} aria-busy={submitting} onClick={()=>confirmation.current?.showModal()}>{submitting&&<span className={b.spinner} aria-hidden="true"/>}<span aria-live="polite">{submitting?'กำลังจองคิว':'ยืนยันการจอง'}</span></button></footer>
 <dialog ref={confirmation} className={b.confirmDialog} aria-labelledby="confirm-booking-title" aria-describedby="confirm-booking-description" onClick={event=>{if(event.target===event.currentTarget)confirmation.current?.close();}}><section className={b.confirmContent}><h2 id="confirm-booking-title" className={b.modalTitle}>ยืนยันการจองคิว?</h2><p id="confirm-booking-description" className={b.modalDescription}>โปรดตรวจสอบข้อมูลที่เลือกให้ครบถ้วน<br/>ก่อนยืนยันการจองคิวรับบริการ</p><div className={b.modalActions}><button type="button" onClick={()=>confirmation.current?.close()}>ยกเลิก</button><button type="button" onClick={()=>{confirmation.current?.close();if(valid&&futureSlot(date,time))setSubmitting(true);}}>ยืนยัน</button></div></section></dialog>

 </main>;
}
