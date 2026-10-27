'use client';
import {motherProfile} from '@/design/care-demo';
import {useMotherAppointments} from './useMotherAppointments';
export function useChatTopics(){
 const profile=motherProfile.use(),appointments=useMotherAppointments();
 const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Bangkok'});
 const upcoming=appointments.some(a=>!a.completed&&a.date>=today);
 const days=profile.deliveryDate?Math.floor((Date.parse(today)-Date.parse(profile.deliveryDate))/86400000):NaN;
 const stage=!Number.isFinite(days)||days<0?['เริ่มดูแลหลังคลอดอย่างไร?']:days<=7?['ให้นมช่วงแรกอย่างไร?','พักช่วงลูกหลับอย่างไร?','ดูแลแผลช่วงแรกอย่างไร?']:days<=14?['คัดตึงเต้านมทำอย่างไร?','เหนื่อยง่าย พักอย่างไร?','น้ำคาวปลาอยากถามไหม?']:days<=42?['เตรียมตรวจหลังคลอดไหม?','จัดเวลาพักอย่างไรดี?','กลับมาขยับตัวอย่างไร?']:['กลับไปทำงาน เตรียมอะไร?','ปั๊มนมระหว่างวันอย่างไร?','หาเวลาดูแลตัวเองไหม?'];
 return [...new Set([...(upcoming?['เตรียมตัวไปตามนัดไหม?']:[]),...stage,...(profile.birth.includes('ผ่า')?['ดูแลแผลผ่าคลอดอย่างไร?']:[]),'มีเรื่องยาอยากถาม?','วันนี้รู้สึกอย่างไร?'])];
}
