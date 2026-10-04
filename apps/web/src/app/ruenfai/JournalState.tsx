'use client';
import {createContext,useContext,useState,type ReactNode,type Dispatch,type SetStateAction} from 'react';
export type Entry={id:string;date:string;title:string;body:string;mood:string};
const initial:Entry[]=[
{id:'1',date:'2026-10-03',title:'วันนี้ได้พักมากขึ้น',body:'เช้านี้ตื่นมาแล้วรู้สึกสดชื่นขึ้น ได้พักระหว่างวันและมีเวลานั่งเล่นกับลูก อยากจำช่วงเวลาเล็ก ๆ แบบนี้ไว้',mood:'สบายใจ'},
{id:'2',date:'2026-10-02',title:'ค่อย ๆ ดูแลตัวเอง',body:'วันนี้รู้สึกเหนื่อยนิดหน่อย เลยให้ตัวเองพัก ไม่ต้องทำทุกอย่างให้เสร็จในวันเดียว ขอบคุณคนในบ้านที่ช่วยดูแลลูก',mood:'เหนื่อย'},
{id:'3',date:'2026-10-01',title:'รอยยิ้มเล็ก ๆ ของวันนี้',body:'ลูกยิ้มให้ตอนเช้า เป็นช่วงเวลาสั้น ๆ ที่ทำให้ทั้งวันรู้สึกดีขึ้น',mood:'สบายใจ'}];

const Context=createContext<{entries:Entry[];setEntries:Dispatch<SetStateAction<Entry[]>>}|null>(null);
export function JournalProvider({children}:{children:ReactNode}){const [entries,setEntries]=useState(initial);return <Context.Provider value={{entries,setEntries}}>{children}</Context.Provider>}
export function useJournal(){const value=useContext(Context);if(!value)throw new Error('JournalProvider missing');return value;}
