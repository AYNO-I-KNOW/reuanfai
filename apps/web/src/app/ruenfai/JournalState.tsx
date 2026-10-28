'use client';
import {createContext,useContext,useState,type ReactNode,type Dispatch,type SetStateAction} from 'react';
import type {DailyHealth} from './journal/daily-health';
export type Entry={id:string;date:string;title:string;body:string;mood:string;symptoms?:string[];health?:DailyHealth};
// Pitch demo: ~2.5 months of entries relative to today (Bangkok), so the calendar always looks lived-in.
const demoNotes:[string,string,string][]=[
['ไม่ค่อยดี','นอนไม่ค่อยพอ','ลูกตื่นบ่อยตอนกลางคืน เลยนอนได้เป็นช่วงสั้น ๆ รู้สึกเพลียแต่ก็ค่อย ๆ ปรับตัว'],
['แย่มาก','วันที่หนักหน่อย','ปวดแผลและเหนื่อยมาก ร้องไห้ไปหนึ่งรอบ คุยกับแฟนแล้วรู้สึกดีขึ้นนิดหนึ่ง'],
['เฉย ๆ','วันธรรมดา ๆ','ทำกิจวัตรตามปกติ ให้นม พักผ่อน ไม่ได้มีอะไรพิเศษ'],
['ดี','ได้ออกไปเดินเล่น','ช่วงเย็นพาลูกออกไปรับลมหน้าบ้าน อากาศดี รู้สึกสดชื่นขึ้น'],
['ดี','วันนี้ได้พักมากขึ้น','เช้านี้ตื่นมาแล้วรู้สึกสดชื่นขึ้น ได้พักระหว่างวันและมีเวลานั่งเล่นกับลูก'],
['ดีมาก','รอยยิ้มเล็ก ๆ ของวันนี้','ลูกยิ้มให้ตอนเช้า เป็นช่วงเวลาสั้น ๆ ที่ทำให้ทั้งวันรู้สึกดีขึ้น'],
['ไม่ค่อยดี','ค่อย ๆ ดูแลตัวเอง','รู้สึกเหนื่อยนิดหน่อย เลยให้ตัวเองพัก ไม่ต้องทำทุกอย่างให้เสร็จในวันเดียว'],
['ดีมาก','ไปนวดมาแล้ว','ไปรับบริการนวดหลังคลอดที่คลินิก ตัวเบาขึ้นมาก นอนหลับสบาย']];
function demoEntries():Entry[]{
 const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Bangkok'});
 const [year,month,day]=today.split('-').map(Number);
 const todayUtc=Date.UTC(year,month-1,day),first=Date.UTC(year,month-3,1);
 const entries:Entry[]=[];
 for(let time=todayUtc-86400000,offset=1;time>=first;time-=86400000,offset++){
  if(offset%4===0||offset%7===3)continue;
  // Earlier weeks skew harder, recent weeks skew lighter: a plausible recovery arc.
  const pool=offset>45?[0,1,2,6,3]:offset>20?[2,3,6,4,0]:[3,4,5,7,2];
  const [mood,title,body]=demoNotes[pool[offset%pool.length]];
  entries.push({id:`demo-${offset}`,date:new Date(time).toISOString().slice(0,10),title,body,mood});
 }
 return entries;
}

const Context=createContext<{entries:Entry[];setEntries:Dispatch<SetStateAction<Entry[]>>}|null>(null);
export function JournalProvider({children}:{children:ReactNode}){const [entries,setEntries]=useState(demoEntries);return <Context.Provider value={{entries,setEntries}}>{children}</Context.Provider>}
export function useJournal(){const value=useContext(Context);if(!value)throw new Error('JournalProvider missing');return value;}
