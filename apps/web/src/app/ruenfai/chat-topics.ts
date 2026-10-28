'use client';
import {motherProfile} from '@/design/care-demo';
// label = Thai text on the chip and in the mother's bubble; query = what /api/kb/ask gets — must equal an entry of knowledge/suggestions.json (verified answerable; WHO ones stay English because Thai→English retrieval is weak)
export type ChatTopic={label:string;query:string};
const t=(label:string,query:string):ChatTopic=>({label,query});
const EXCLUSIVE_BF=t('ให้นมแม่อย่างเดียวนานแค่ไหน','How long should exclusive breastfeeding last according to WHO?');
const EARLY=[t('ยาขับน้ำคาวปลา (ประสะไพล)','ยาประสะไพลใช้ทำอะไร'),t('ยาสตรีหลังคลอดกินอย่างไร','ยาสตรีหลังคลอดต้มกินอย่างไร กี่วัน')];
const PERINEUM=t('ปวดแผลฝีเย็บใช้ยาอะไร','What is the first-line analgesic for postpartum perineal pain?');
const MIDDLE=[t('นวดหลังคลอดได้เมื่อไหร่','การนวดหลังคลอดทำได้เมื่อไหร่'),t('ข้อห้ามการประคบสมุนไพร','ข้อห้ามของการประคบสมุนไพรหลังคลอด'),t('ต้องตรวจหลังคลอดกี่ครั้ง','How many postnatal contacts does WHO recommend?'),t('ยาบำรุงเลือดกินอย่างไร','ยาบำรุงโลหิตใช้ทำอะไร')];
const LATE=[t('ธาตุเหล็กต้องกินนานแค่ไหน','How long should postpartum women take oral iron and folic acid?'),EXCLUSIVE_BF,t('คัดกรองซึมเศร้าหลังคลอด','How should postpartum depression be screened?')];
const CESAREAN=[t('ผ่าคลอดทับหม้อเกลือได้เมื่อไหร่','ผ่าคลอดแล้วทำทับหม้อเกลือได้หลังกี่วัน'),t('ผ่าคลอดกินยาสตรีหลังคลอดได้ไหม','หญิงผ่าคลอดกินยาสตรีหลังคลอดได้ไหม')];
// every chip of every stage: the chat deep link (?question=label) is resolved against this, so a crafted link cannot pair a shown question with a different query
export const allChatTopics:ChatTopic[]=[...EARLY,PERINEUM,EXCLUSIVE_BF,...MIDDLE,...LATE,...CESAREAN];
export function useChatTopics():ChatTopic[]{
 const profile=motherProfile.use();
 const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Bangkok'});
 const days=profile.deliveryDate?Math.floor((Date.parse(today)-Date.parse(profile.deliveryDate))/86400000):NaN;
 const cesarean=profile.birth.includes('ผ่า');
 const stage=!Number.isFinite(days)||days<=7?[...EARLY,...(cesarean?[]:[PERINEUM]),EXCLUSIVE_BF]:days<=42?MIDDLE:LATE;
 const all=[...(cesarean?CESAREAN:[]),...stage];
 return all.filter((topic,index)=>all.findIndex(other=>other.label===topic.label)===index);
}
