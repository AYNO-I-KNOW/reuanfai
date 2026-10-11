'use client';
import Image from 'next/image';
import {useRouter} from 'next/navigation';
import {useEffect,useState} from 'react';
import {ChevronRight} from 'lucide-react';
import '@/design/fonts.css';
import s from '../page.module.css';
import PageHeader from '../PageHeader';
import {useCareDemo} from '@/design/care-demo';

// UI examples only: readiness reasons are supplied copy, not clinical rules.
type Appointment={id:string;service:string;art:string;status:'unavailable'|'choose'|'scheduled'|'review';description?:string;startsAt?:string};
const appointments:Appointment[]=[
  {id:'a1',service:'นวดแผนไทย',art:'massage',status:'choose',description:'พร้อมรับบริการแล้ว เลือกวันและเวลาที่สะดวก'},
  {id:'a2',service:'ประคบสมุนไพร',art:'compress',status:'scheduled',startsAt:'2026-10-06T10:00:00+07:00'},
  {id:'a3',service:'ทับหม้อเกลือ',art:'salt-pot',status:'unavailable',description:'รอให้แผลหายสนิท และให้ผู้ดูแลยืนยันความพร้อม'},
  {id:'a4',service:'นวดแผนไทย',art:'massage',status:'review',description:'รับบริการแล้ว แบ่งปันความรู้สึกหลังรับบริการ'},
  {id:'a5',service:'ประคบสมุนไพร',art:'compress',status:'choose',description:'พร้อมรับบริการแล้ว เลือกวันและเวลาที่สะดวก'},
  {id:'a6',service:'ทับหม้อเกลือ',art:'salt-pot',status:'scheduled',startsAt:'2026-10-17T09:00:00+07:00'},
];
function countdown(startsAt:string,now:number){
  const hours=(new Date(startsAt).getTime()-now)/3600000;
  if(hours<=0)return 'ถึงเวลานัดหมาย';
  if(hours<1)return `อีก ${Math.ceil(hours*60)} นาที`;
  if(hours<24)return `อีก ${Math.ceil(hours)} ชั่วโมง`;
  return `อีก ${Math.floor(hours/24)} วัน`;
}
function scheduledDescription(startsAt:string){
  const date=new Date(startsAt);
  return `${date.toLocaleDateString('th-TH',{timeZone:'Asia/Bangkok',day:'numeric',month:'short'})} · ${date.toLocaleTimeString('th-TH',{timeZone:'Asia/Bangkok',hour:'2-digit',minute:'2-digit',hour12:false})} น.`;
}
export default function AppointmentsPage(){
  const router=useRouter();
  const care=useCareDemo();
  const items:Appointment[]=[...appointments,...care.bookings.flatMap(booking=>{
   const record=care.appointments.find(a=>a.id===booking.id);
   if(record?.status==='ยกเลิก')return [];
   return booking.services.map((service,index)=>({id:`${booking.id}-${index}`,service:service==='นวดไทย'?'นวดแผนไทย':service,art:service==='ประคบสมุนไพร'?'compress':service==='ทับหม้อเกลือ'?'salt-pot':'massage',status:record?.status==='บันทึกแล้ว'?'review' as const:'scheduled' as const,startsAt:record?.status==='บันทึกแล้ว'?undefined:`${booking.date}T${booking.time}:00+07:00`,description:record?.status==='บันทึกแล้ว'?'รับบริการแล้ว แบ่งปันความรู้สึกหลังรับบริการ':undefined}));
  })];
  const [now,setNow]=useState<number|null>(null);
  useEffect(()=>{const initial=setTimeout(()=>setNow(Date.now()),0);const timer=setInterval(()=>setNow(Date.now()),60000);return()=>{clearTimeout(initial);clearInterval(timer);};},[]);
  const label=(a:Appointment)=>a.status==='choose'?'จองคิว':a.status==='unavailable'?'ยังไม่พร้อม':a.status==='review'?'เขียนรีวิว':now&&a.startsAt?countdown(a.startsAt,now):'กำลังตรวจเวลานัด';
  const description=(a:Appointment)=>a.startsAt?scheduledDescription(a.startsAt):a.description;
  return <main className={`${s.canvas} ${s.referenceBackground}`}><section className={`${s.tabPage} ${s.appointmentsPage} ${s.referenceAppointments}`}><PageHeader title="นัดหมายทั้งหมด"/><ol className={s.appointmentGrid}>{items.map(a=><li key={a.id}><button type="button" className={`${s.appointmentCard} ${s.appointmentActionCard}`} disabled={a.status==='unavailable'||a.status==='scheduled'} onClick={()=>{if(a.status==='choose'){router.push('/ruenfai/onboarding?screen=booking');return;}if(a.status==='review'){router.push('/ruenfai/review');}}}><div className={s.appointmentArt}><Image src={`/images/ruenfai/services/${a.art}-base.svg`} alt="" width={80} height={80}/><Image className={s.serviceIllustration} src={`/images/ruenfai/services/${a.art}.svg`} alt="" width={80} height={80}/></div><h2>{a.service}</h2><p className={s.appointmentStatusDescription}>{description(a)}</p><span className={`${s.pill} ${a.status==='unavailable'?s.appointmentUnavailable:''}`}>{label(a)}{(a.status==='choose'||a.status==='review')&&<ChevronRight size={14} aria-hidden="true"/>}</span></button></li>)}</ol></section></main>;
}
