'use client';
import Image from 'next/image';
import {useEffect, useState} from 'react';
import {ChevronRight} from 'lucide-react';
import {useCareDemo} from '@/design/care-demo';
import {usePayments} from '../payment/payment-state';
import {useTabNavigation} from '../TabMotion';
import {serviceStageView, serviceStages, type ServiceStage, type StageContext} from './service-stage';
import '@/design/fonts.css';
import s from '../page.module.css';
import PageHeader from '../PageHeader';
import AppointmentSheet from '../AppointmentSheet';
import ServiceInfoSheet from '../services/ServiceInfoSheet';
import {getServiceInfo} from '../services/service-info';
import {useMotherAppointments} from '../useMotherAppointments';

// Existing UI fixtures; these are not individual clinical eligibility decisions.
const services = [
  {id:'a4',name:'นวดแผนไทย',bookingName:'นวดไทย',art:'massage',stage:'payment'},
  {id:'a2',name:'ประคบสมุนไพร',bookingName:'ประคบสมุนไพร',art:'compress',stage:'review'},
  {id:'service-salt',name:'ทับหม้อเกลือ',bookingName:'ทับหม้อเกลือ',art:'salt-pot',stage:'book'},
  {id:'service-steam',name:'อบสมุนไพร',bookingName:'อบสมุนไพร',art:'steam',stage:'assessment'},
  {id:'service-lactation',name:'นวดกระตุ้นน้ำนม',bookingName:'นวดกระตุ้นน้ำนม',art:'lactation',stage:'assessment'},
  {id:'service-stones',name:'ก้อนเส้า',bookingName:'ก้อนเส้า',art:'hot-stones',stage:'unavailable'},
] as const;
export default function AppointmentsPage(){
  const navigate=useTabNavigation();
  const care=useCareDemo();
  const payments=usePayments();
  const scheduled=useMotherAppointments();
  const [infoId,setInfoId]=useState<string|null>(null);
  const [active,setActive]=useState<string|null>(null);
  const [now,setNow]=useState<number|null>(null);
  const [preview,setPreview]=useState<ServiceStage|null>(null);
  useEffect(()=>{
    const update=()=>setNow(Date.now());
    const initial=setTimeout(()=>{
      update();
      const serviceId=new URLSearchParams(window.location.search).get('service');
      if(getServiceInfo(serviceId))setInfoId(serviceId);
      if(process.env.NODE_ENV==='development'){
        const value=new URLSearchParams(window.location.search).get('previewStatus');
        if(serviceStages.includes(value as ServiceStage))setPreview(value as ServiceStage);
      }
    },0);
    const timer=setInterval(update,60000);
    return()=>{clearTimeout(initial);clearInterval(timer);};
  },[]);
  function resolve(service:typeof services[number]){
      // Match each booking back into its service card. Never append booking cards.
      const booking=[...care.bookings].reverse().find(item=>item.services.some(name=>name===service.bookingName||name===service.name)&&care.appointments.find(record=>record.id===item.id)?.status!=='ยกเลิก');
      const appointment=booking?scheduled.find(item=>item.id===booking.id):undefined;
      const paid=payments.some(item=>item.appointment===(booking?.id||service.id));
      let context:StageContext={stage:service.stage,firstAssessment:true};
      if(appointment){
        context={stage:appointment.completed?(paid?'review':'payment'):appointment.status==='รอยืนยันนัด'?'pending':appointment.status==='รอประเมิน'?'assessment':'confirmed',date:appointment.date,time:appointment.time,clinic:appointment.unit};
      }else if(service.stage==='payment'&&paid)context={stage:'review'};
      // Development-only visual examples. No storage writes or clinical decisions.
      if(preview&&now!==null){
        const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
        context={stage:preview,firstAssessment:service.art==='steam',date:today,time:'09:00',clinic:'คลินิกตัวอย่าง',nextBookingDate:new Date(Date.parse(`${today}T00:00:00Z`)+10*86400000).toISOString().slice(0,10),reason:'ผู้ให้บริการระบุให้งดบริการนี้ในแผนตัวอย่าง'};
      }
      const view=serviceStageView(context,now??Date.UTC(2026,0,1));
      return {view,booking,appointment};
  }
  const selected=services.find(service=>service.art===infoId);
  const selectedState=selected?resolve(selected):null;
  function act(service:typeof services[number],booking?:{id:string}){
    if(resolve(service).view.stage==='book'){navigate('/ruenfai/onboarding?screen=booking');return;}
    navigate(`/ruenfai/${resolve(service).view.stage==='payment'?'payment':'review'}?appointment=${encodeURIComponent(booking?.id||service.id)}&service=${encodeURIComponent(service.name)}`);
  }
  return <main className={`${s.canvas} ${s.referenceBackground}`}><section className={`${s.tabPage} ${s.appointmentsPage} ${s.referenceAppointments}`}><PageHeader title="นัดหมายทั้งหมด"/>
    <ol className={s.appointmentGrid}>{services.map(service=>{
      const {view,booking,appointment}=resolve(service);
      return <li key={service.id} data-service={service.art} data-stage={view.stage}><article className={s.appointmentCard}>
        <button type="button" className={s.serviceInfoTrigger} aria-label={`ข้อมูลบริการ ${service.name}`} aria-haspopup="dialog" onClick={()=>setInfoId(service.art)}><div className={s.appointmentArt}><Image src={`/images/ruenfai/services/${service.art}-base.svg`} alt="" width={80} height={80}/><Image className={s.serviceIllustration} src={`/images/ruenfai/services/${service.art}.svg`} alt="" width={80} height={80}/></div><h2>{service.name}</h2></button>
        {view.stage==='confirmed'&&appointment?<button type="button" className={`${s.appointmentStatusDescription} ${s.appointmentDateLink}`} aria-label={`ดูรายละเอียดนัด ${service.name}`} onClick={()=>setActive(appointment.id)}>{view.description}</button>:<p className={s.appointmentStatusDescription}>{view.description}</p>}
        {view.actionable?<button type="button" className={s.serviceActionRow} aria-label={`${view.label} ${service.name}`} onClick={()=>act(service,booking)}><span className={`${s.pill} ${s[`appointmentTone${view.tone}`]}`}>{view.label}<ChevronRight size={14} aria-hidden="true"/></span></button>:<div className={s.serviceStatusRow}><span className={`${s.pill} ${s[`appointmentTone${view.tone}`]}`}>{view.label}</span></div>}
      </article></li>;
    })}</ol>
  </section>{selected&&<ServiceInfoSheet key={selected.art} service={getServiceInfo(infoId)??null} view={selectedState?.view??null} onClose={()=>setInfoId(null)} onAction={()=>{if(selected)act(selected,selectedState?.booking)}}/>}<AppointmentSheet appointment={scheduled.find(item=>item.id===active)||null} onClose={()=>setActive(null)}/></main>;
}
