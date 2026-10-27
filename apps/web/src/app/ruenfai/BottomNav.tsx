'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useRef,useState,type CSSProperties} from 'react';
import {X} from 'lucide-react';
import JournalForm from './JournalForm';
import ChatInvitation from './ChatInvitation';
import n from './bottom-nav.module.css';
import Image from 'next/image';
import {SolidChat} from './SolidIcons';
import {NavHome,NavCalendar,NavMedicine,NavJournal} from './NavIcons';
import s from './page.module.css';
import {useTabNavigation} from './TabMotion';
const tabs=[{path:'/ruenfai',label:'หน้าแรก',icon:NavHome},{path:'/ruenfai/appointments',label:'นัดหมาย',icon:NavCalendar},{path:'/ruenfai/medicines',label:'ยา',icon:NavMedicine},{path:'/ruenfai/journal',label:'บันทึก',icon:NavJournal}];
export default function BottomNav(){
 const navigate=useTabNavigation();const path=usePathname();
 const dialog=useRef<HTMLDialogElement>(null);const [closing,setClosing]=useState(false);const [date,setDate]=useState('');const [formId,setFormId]=useState(0);
 const openJournal=()=>{setDate(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok'}).format(new Date()));setFormId(value=>value+1);setClosing(false);dialog.current?.showModal()};
 const closeJournal=()=>{if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)dialog.current?.close();else setClosing(true)};
 const normalized=path==='/ruenfai/growth'?'/ruenfai/journal':path==='/ruenfai/profile'?'/ruenfai/appointments':path==='/ruenfai/baby'?'/ruenfai/medicines':path;
 const index=Math.max(0,tabs.findIndex(tab=>tab.path===normalized));
 if(path==='/ruenfai/profile'||path.startsWith('/ruenfai/onboarding')||path.startsWith('/ruenfai/review')||path.startsWith('/ruenfai/chat')||path.startsWith('/ruenfai/payment'))return null;
 return <><nav className={n.nav} aria-label="เมนูหลัก"><div className={n.items} style={{'--selected-slot':index<2?index:index+1} as CSSProperties}>{[tabs[0],tabs[1],null,tabs[2],tabs[3]].map((tab,slot)=>{if(!tab)return <button key="write" type="button" className={n.action} aria-label="เขียนบันทึกประจำวัน" aria-haspopup="dialog" onClick={openJournal}><Image src="/images/ruenfai/navigation/journal-add-purple.svg" alt="" width={48} height={48}/></button>;const {path:target,label,icon:Icon}=tab;const selected=index===(slot<2?slot:slot-1);return <Link key={target} href={target} onClick={event=>{if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();navigate(target)}} className={n.item} aria-current={selected?'page':undefined}><span className={`${n.icon} ${n.glyph}`}><Icon/></span><span>{label}</span></Link>})}</div><ChatInvitation from={path}/><Link className={n.chat} href={`/ruenfai/chat?from=${encodeURIComponent(path)}`} onClick={event=>{if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();navigate(`/ruenfai/chat?from=${encodeURIComponent(path)}`)}} aria-label="สนทนากับผู้ช่วย AI"><SolidChat size={26}/></Link></nav>
 <dialog ref={dialog} className={s.medicineDialog} aria-labelledby="nav-journal-title" onCancel={event=>{event.preventDefault();closeJournal()}} onClick={event=>{if(event.target===event.currentTarget)closeJournal()}}><section className={`${s.medicineSheet} ${closing?s.medicineClosing:''}`} onAnimationEnd={event=>{if(event.target===event.currentTarget&&closing){dialog.current?.close();setClosing(false)}}}><header className={s.medicineSheetHeader}><h2 id="nav-journal-title">เขียนบันทึก</h2><button aria-label="ปิดสมุดบันทึก" onClick={closeJournal}><X size={20}/></button></header><div className={s.medicineSheetBody}><JournalForm key={formId} date={date} onSaved={closeJournal}/></div></section></dialog></>;
}
