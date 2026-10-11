export type Appointment = {
  id: string; name?:string; phone?:string; day: number; month?: number; year?: number; time: string; services: string; birth: string;
  postpartum: number; visit: number; rights: boolean;
  status: 'ยืนยันแล้ว' | 'รอยืนยันนัด' | 'รอประเมิน' | 'บันทึกแล้ว' | 'ยกเลิก';
  screening: string; illustration: number; doctor?:string; endTime?:string; endDate?:string;
};
export const doctors = ['พท. พิมพ์ชนก ใจดี','พท. ณัฐวุฒิ สุขใจ','พท. ชลธิชา วัฒนกุล'];
export const initialAppointments: Appointment[] = [
  {id:'J10',day:3,month:10,year:2569,time:'09:00',services:'นวดไทย, ประคบสมุนไพร',birth:'คลอดทางช่องคลอด',postpartum:16,visit:2,rights:true,status:'บันทึกแล้ว',screening:'ผ่าน',illustration:0},
  {id:'K11',day:4,month:10,year:2569,time:'11:00',services:'นัดประเมิน',birth:'ผ่าคลอด',postpartum:34,visit:1,rights:false,status:'ยกเลิก',screening:'ให้ประเมิน',illustration:2},
  {id:'G09',day:4,month:10,year:2569,time:'14:30',services:'นัดประเมิน',birth:'คลอดทางช่องคลอด',postpartum:21,visit:1,rights:false,status:'รอยืนยันนัด',screening:'ให้ประเมิน',illustration:2},
  {id:'A12',day:5,month:10,year:2569,time:'09:00',services:'นวดไทย, ประคบสมุนไพร',birth:'คลอดทางช่องคลอด',postpartum:9,visit:3,rights:true,status:'ยืนยันแล้ว',screening:'ผ่าน',illustration:0},
  {id:'B07',day:5,month:10,year:2569,time:'10:30',services:'นวดไทย, ประคบสมุนไพร',birth:'ผ่าคลอด',postpartum:35,visit:2,rights:false,status:'รอประเมิน',screening:'ไม่แน่ใจ 1 ข้อ',illustration:0},
  {id:'C03',day:5,month:10,year:2569,time:'13:00',services:'นัดประเมิน',birth:'ผ่าคลอด',postpartum:40,visit:1,rights:false,status:'รอยืนยันนัด',screening:'ให้ประเมิน',illustration:2},
  {id:'D04',day:6,month:10,year:2569,time:'09:00',services:'นวดไทย',birth:'คลอดทางช่องคลอด',postpartum:18,visit:2,rights:true,status:'ยืนยันแล้ว',screening:'ผ่าน',illustration:0},
  {id:'E05',day:6,month:10,year:2569,time:'11:00',services:'นัดประเมิน',birth:'ผ่าคลอด',postpartum:32,visit:1,rights:false,status:'รอยืนยันนัด',screening:'ให้ประเมิน',illustration:2},
  {id:'F06',day:9,month:10,year:2569,time:'10:30',services:'ประคบสมุนไพร',birth:'คลอดทางช่องคลอด',postpartum:26,visit:4,rights:true,status:'ยืนยันแล้ว',screening:'ผ่าน',illustration:1},
  // นัดหมายเดือนธันวาคม 2569 (เดือนถัดไป)
  {id:'A12-D2',name:'A12',day:2,month:11,year:2569,time:'09:00',services:'นวดไทย, ประคบสมุนไพร',birth:'คลอดทางช่องคลอด',postpartum:36,visit:4,rights:true,status:'ยืนยันแล้ว',screening:'ผ่าน',illustration:0},
  {id:'B07-D8',name:'B07',day:8,month:11,year:2569,time:'10:30',services:'นวดไทย, ประคบสมุนไพร',birth:'ผ่าคลอด',postpartum:62,visit:3,rights:true,status:'ยืนยันแล้ว',screening:'ผ่าน',illustration:0},
  {id:'F06-D15',name:'F06',day:15,month:11,year:2569,time:'13:00',services:'ประคบสมุนไพร',birth:'คลอดทางช่องคลอด',postpartum:53,visit:5,rights:false,status:'รอยืนยันนัด',screening:'ผ่าน',illustration:1},
  {id:'H08-D22',name:'H08',day:22,month:11,year:2569,time:'14:30',services:'นัดประเมิน',birth:'ผ่าคลอด',postpartum:45,visit:2,rights:false,status:'รอยืนยันนัด',screening:'ให้ประเมิน',illustration:2},
  // ประวัตินัดหมายเดือนตุลาคม 2569 (เดือนก่อนหน้า)
  {id:'A12-O18',name:'A12',day:18,month:9,year:2569,time:'09:00',services:'นวดไทย',birth:'คลอดทางช่องคลอด',postpartum:0,visit:1,rights:true,status:'บันทึกแล้ว',screening:'ผ่าน',illustration:0},
  {id:'B07-O24',name:'B07',day:24,month:9,year:2569,time:'10:30',services:'นัดประเมิน',birth:'ผ่าคลอด',postpartum:14,visit:1,rights:true,status:'บันทึกแล้ว',screening:'ผ่าน',illustration:2},
  {id:'J10-O28',name:'J10',day:28,month:9,year:2569,time:'14:00',services:'นวดไทย, ประคบสมุนไพร',birth:'คลอดทางช่องคลอด',postpartum:10,visit:1,rights:true,status:'บันทึกแล้ว',screening:'ผ่าน',illustration:0},
].map(a=>({...a,doctor:doctors[(a.name||a.id).charCodeAt(0)%doctors.length]})) as Appointment[];
export type Medicine = {name:string;quantity:number;unit:string;lot:string;expiry:string;threshold:number;days:number;image?:string;benefits?:string};
export const initialMedicines: Medicine[] = [
  ['ยาเลือดงาม',40,'ซอง','L2604','2027-03-31',20,146],
  ['ยาไฟประลัยกัลป์',24,'ซอง','L2603','2027-02-28',20,115],
  ['ยาไฟห้ากอง',18,'ซอง','L2601','2026-12-31',20,56],
  ['ยาประสะไพล',30,'ซอง','L2608','2027-05-31',10,207],
  ['ยาปลูกไฟธาตุ',12,'ซอง','L2609','2027-04-30',10,176],
  ['ยาสตรีหลังคลอด',8,'ห่อ','L2605','2026-12-20',10,45],
  ['ยาหอมเทพจิตร',20,'ขวด','L2602','2027-08-31',10,299],
  ['ยาหอมแก้ลมวิงเวียน',15,'ขวด','L2610','2027-06-30',10,237],
  ['ยาหอมทิพโอสถ',10,'ขวด','L2611','2027-09-30',5,329],
  ['ยาหอมนวโกฐ',14,'ขวด','L2612','2027-07-31',10,268],
  ['ยาหอมอินทจักร์',9,'ขวด','L2606','2027-06-30',10,237],
].map(([name,quantity,unit,lot,expiry,threshold,days],index)=>({name:String(name),quantity:Number(quantity),unit:String(unit),lot:String(lot),expiry:String(expiry),threshold:Number(threshold),days:Number(days),benefits:[
  'บำรุงเลือด บรรเทาอาการปวดประจำเดือน',
  'ขับน้ำคาวปลาในหญิงหลังคลอด',
  'ขับน้ำคาวปลาในหญิงหลังคลอด',
  'บรรเทาปวดประจำเดือน และขับน้ำคาวปลาหลังคลอด',
  'กระตุ้นน้ำนมในหญิงหลังคลอด',
  'ขับน้ำคาวปลา และบำรุงเลือดหลังคลอด',
  'บรรเทาวิงเวียน ใจสั่น และบำรุงจิตใจ',
  'บรรเทาอาการวิงเวียนและอ่อนเพลีย',
  'บรรเทาวิงเวียน และอ่อนเพลียช่วงพักฟื้น',
  'บรรเทาวิงเวียน คลื่นไส้ และอ่อนเพลีย',
  'บรรเทาคลื่นไส้ อาเจียน และจุกเสียด',
][index]}));
export const services = ['นวดไทย','ประคบสมุนไพร','ทับหม้อเกลือ','อบสมุนไพร','นัดประเมิน'];
export const activities = ['ทับหม้อเกลือ (9007712)','นวด (9007713)','ประคบสมุนไพร (9007714)','อบไอน้ำสมุนไพร (9007716)','คำแนะนำการปฏิบัติตัว (9007730)'];
export const LOW_STOCK_LIMIT = 10; // Preview policy, not a universal medicine standard.
export const stockState = (m:Medicine) => m.quantity <= 0 ? 'หมด' : m.quantity <= LOW_STOCK_LIMIT ? 'ใกล้หมด' : m.expiry && m.days < 60 ? 'ใกล้หมดอายุ' : 'ปกติ';
