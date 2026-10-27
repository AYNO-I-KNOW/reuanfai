'use client';
import {useCareDemo} from '@/design/care-demo';
export type MotherAppointment={id:string;service:string;art:string;date:string;time:string;status:string;unit?:string;doctor?:string;endTime?:string;completed:boolean};
export function useMotherAppointments():MotherAppointment[]{
 const care=useCareDemo();
 return [...care.bookings.flatMap(booking=>{
  const record=care.appointments.find(item=>item.id===booking.id);
  if(record?.status==='ยกเลิก')return [];
  const service=booking.services[0];
  return [{id:booking.id,service:booking.services.map(value=>value==='นวดไทย'?'นวดแผนไทย':value).join(' · '),art:service==='ประคบสมุนไพร'?'compress':service==='ทับหม้อเกลือ'?'salt-pot':'massage',date:booking.date,time:record?.time||booking.time,status:record?.status==='บันทึกแล้ว'?'รับบริการแล้ว':record?.status||'รอยืนยันนัด',completed:record?.status==='บันทึกแล้ว',unit:booking.unit,doctor:record?.doctor,endTime:record?.endTime,
   ...(record?.year!==undefined&&record.month!==undefined?{date:`${record.year>2400?record.year-543:record.year}-${String(record.month+1).padStart(2,'0')}-${String(record.day).padStart(2,'0')}`}:{})}];
 })].sort((a,b)=>`${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
}
