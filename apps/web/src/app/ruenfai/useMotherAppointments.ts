'use client';
import {useCareDemo} from '@/design/care-demo';
export type MotherAppointment={id:string;service:string;art:string;date:string;time:string;status:string;unit?:string;doctor?:string;endTime?:string;completed:boolean};
// Mother-app examples only; provider-wide patient records must not appear here.
const examples:MotherAppointment[]=[
 {id:'mother-o6-massage',service:'นวดแผนไทย',art:'massage',date:'2026-10-06',time:'09:00',status:'ยืนยันแล้ว',completed:false},
 {id:'mother-o6-compress',service:'ประคบสมุนไพร',art:'compress',date:'2026-10-06',time:'10:00',status:'ยืนยันแล้ว',completed:false},
 {id:'mother-o10-salt',service:'ทับหม้อเกลือ',art:'salt-pot',date:'2026-10-10',time:'09:00',status:'ยืนยันแล้ว',completed:false},
 {id:'mother-o13-massage',service:'นวดแผนไทย',art:'massage',date:'2026-10-13',time:'09:00',status:'ยืนยันแล้ว',completed:false},
 {id:'mother-o13-compress',service:'ประคบสมุนไพร',art:'compress',date:'2026-10-13',time:'10:00',status:'ยืนยันแล้ว',completed:false},
 {id:'a6',service:'ทับหม้อเกลือ',art:'salt-pot',date:'2026-10-17',time:'09:00',status:'ยืนยันแล้ว',completed:false},
];
export function useMotherAppointments():MotherAppointment[]{
 const care=useCareDemo();
 return [...examples,...care.bookings.flatMap(booking=>{
  const record=care.appointments.find(item=>item.id===booking.id);
  if(record?.status==='ยกเลิก')return [];
  return booking.services.map((service,index)=>({id:`${booking.id}-${index}`,service:service==='นวดไทย'?'นวดแผนไทย':service,art:service==='ประคบสมุนไพร'?'compress':service==='ทับหม้อเกลือ'?'salt-pot':'massage',date:booking.date,time:record?.time||booking.time,status:record?.status==='บันทึกแล้ว'?'รับบริการแล้ว':record?.status||'รอยืนยันนัด',completed:record?.status==='บันทึกแล้ว',unit:booking.unit,doctor:record?.doctor,endTime:record?.endTime,
   ...(record?.year!==undefined&&record.month!==undefined?{date:`${record.year>2400?record.year-543:record.year}-${String(record.month+1).padStart(2,'0')}-${String(record.day).padStart(2,'0')}`}:{})}));
 })].sort((a,b)=>`${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
}
