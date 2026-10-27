'use client';
import Image from 'next/image';
import {usePayments} from '../payment/payment-state';
import {useTabNavigation} from '../TabMotion';
import {useEffect,useState} from 'react';
import {ChevronRight} from 'lucide-react';
import '@/design/fonts.css';
import s from '../page.module.css';
import PageHeader from '../PageHeader';
import {useMotherAppointments} from '../useMotherAppointments';
import AppointmentSheet from '../AppointmentSheet';

// UI examples only: readiness reasons are supplied copy, not clinical rules.
type Appointment={id:string;service:string;art:string;status:'unavailable'|'choose'|'scheduled'|'review';paid?:boolean;description?:string;startsAt?:string};
const services:Appointment[]=[
 {id:'a4',service:'นวดแผนไทย',art:'massage',status:'review'},
 {id:'a2',service:'ประคบสมุนไพร',art:'compress',status:'review',paid:true},
 {id:'service-salt',service:'ทับหม้อเกลือ',art:'salt-pot',status:'choose',description:'เลือกวันและเวลาที่สะดวก'},
 {id:'service-steam',service:'อบสมุนไพร',art:'steam',status:'unavailable',description:'รอผู้ให้บริการประเมิน'},
 {id:'service-lactation',service:'นวดกระตุ้นน้ำนม',art:'lactation',status:'unavailable',description:'รอผู้ให้บริการประเมิน'},
 {id:'service-stones',service:'ก้อนเส้า',art:'hot-stones',status:'unavailable',description:'ไม่เปิดให้จองตามผลประเมินนี้'},
];
function countdown(startsAt:string,now:number){
  const hours=(new Date(startsAt).getTime()-now)/3600000;
  if(hours<=-24)return 'ดูรายละเอียดนัด';
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
  const navigate=useTabNavigation();
  const payments=usePayments();
  const isPaid=(id:string)=>services.some(item=>item.id===id&&item.paid)||payments.some(receipt=>receipt.appointment===id);
  const scheduled=useMotherAppointments();
  const [active,setActive]=useState<string|null>(null);
  const items:Appointment[]=[...services,...scheduled.map(item=>({id:item.id,service:item.service,art:item.art,status:item.completed?'review' as const:'scheduled' as const,startsAt:item.completed?undefined:`${item.date}T${item.time}:00+07:00`,description:item.status}))];
  const [now,setNow]=useState<number|null>(null);
  useEffect(()=>{const initial=setTimeout(()=>setNow(Date.now()),0);const timer=setInterval(()=>setNow(Date.now()),60000);return()=>{clearTimeout(initial);clearInterval(timer);};},[]);
  const label=(a:Appointment)=>a.status==='choose'?'จองคิว':a.status==='unavailable'?(a.art==='hot-stones'?'ไม่เปิดให้จอง':['steam','lactation'].includes(a.art)?'รอประเมิน':'ยังไม่พร้อม'):a.status==='review'?(isPaid(a.id)?'เขียนรีวิว':'ชำระเงิน'):now&&a.startsAt?countdown(a.startsAt,now):'กำลังตรวจเวลานัด';
  const description=(a:Appointment)=>a.startsAt?scheduledDescription(a.startsAt):a.status==='review'?(isPaid(a.id)?'ชำระเงินแล้ว แบ่งปันความรู้สึกหลังรับบริการ':'รับบริการแล้ว กรุณาชำระค่าบริการ'):a.description;
  return <main className={`${s.canvas} ${s.referenceBackground}`}><section className={`${s.tabPage} ${s.appointmentsPage} ${s.referenceAppointments}`}><PageHeader title="นัดหมายทั้งหมด"/><ol className={s.appointmentGrid}>{items.map(a=><li key={a.id}><button type="button" className={`${s.appointmentCard} ${s.appointmentActionCard}`} disabled={a.status==='unavailable'} onClick={()=>{if(a.status==='scheduled'){setActive(a.id);return;}if(a.status==='choose'){navigate('/ruenfai/onboarding?screen=booking');return;}if(a.status==='review'){navigate(isPaid(a.id)?`/ruenfai/review?appointment=${encodeURIComponent(a.id)}&service=${encodeURIComponent(a.service)}`:`/ruenfai/payment?appointment=${encodeURIComponent(a.id)}&service=${encodeURIComponent(a.service)}`);}}}><div className={s.appointmentArt}><Image src={`/images/ruenfai/services/${a.art}-base.svg`} alt="" width={80} height={80}/><Image className={s.serviceIllustration} src={`/images/ruenfai/services/${a.art}.svg`} alt="" width={80} height={80}/></div><h2>{a.service}</h2><p className={s.appointmentStatusDescription}>{description(a)}</p><span className={`${s.pill} ${a.status==='unavailable'?s.appointmentUnavailable:''}`}>{label(a)}{(a.status==='choose'||a.status==='review')&&<ChevronRight size={14} aria-hidden="true"/>}</span></button></li>)}</ol></section><AppointmentSheet appointment={scheduled.find(item=>item.id===active)||null} onClose={()=>setActive(null)}/></main>;
}
