"use client";
import {motherProfile} from '@/design/care-demo';
import {journalMembership,ensureJournalMembership} from './membership';
import SheetResize from '../SheetResize';
import {useRef,useState,useEffect} from 'react';
import {X} from 'lucide-react';
import MoodArt from '../MoodArt';
import '@/design/fonts.css';
import s from '../page.module.css';
import PageHeader from '../PageHeader';
import j from './journal.module.css';
import {useJournal,type Entry} from '../JournalState';
import JournalForm from '../JournalForm';
import JournalShare from './JournalShare';
function bangkokToday(){return new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Bangkok'})}
function dateLabel(date:string){return new Date(date+'T12:00:00').toLocaleDateString('th-TH',{day:'numeric',month:'long',year:'numeric'});}
export default function JournalPage(){
 const {entries}=useJournal();
 const profile=motherProfile.use(),membership=journalMembership.use();
 useEffect(()=>{ensureJournalMembership()},[]);
 const [entryDate,setEntryDate]=useState(bangkokToday);
 useEffect(()=>{const timer=setInterval(()=>setEntryDate(bangkokToday()),60000);return()=>clearInterval(timer)},[]);
 const [monthCount,setMonthCount]=useState(6);
 const [formDate,setFormDate]=useState(entryDate),[selected,setSelected]=useState<Entry|null>(null),[closing,setClosing]=useState(false);
 const initialEntries=useRef(entries);
 const dialog=useRef<HTMLDialogElement>(null),scroller=useRef<HTMLElement>(null);
 const canWrite=(date:string)=>!!profile.deliveryDate&&date>=profile.deliveryDate&&date<=entryDate;
 const open=(entry:Entry|null,date?:string)=>{if(!canWrite(date??entryDate))return;setFormDate(date??entryDate);setSelected(entry);setClosing(false);dialog.current?.showModal();};
 useEffect(()=>{const date=new URLSearchParams(window.location.search).get('date');if(date&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&date<=bangkokToday()&&profile.deliveryDate&&date>=profile.deliveryDate){const timer=setTimeout(()=>{setFormDate(date);const saved=initialEntries.current.find(item=>item.date===date)??null;setSelected(saved);dialog.current?.showModal()},0);return()=>clearTimeout(timer);}},[profile.deliveryDate]); // Resolve once when opening a date deep link.

 const close=()=>{if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){dialog.current?.close();return;}setClosing(true);};
 const [currentYear,currentMonth]=entryDate.split('-').map(Number);
 const joinedMonth=(membership.joinedDate||entryDate).slice(0,7);
 const [joinedYear,joinedMonthNumber]=joinedMonth.split('-').map(Number);
 const availableMonths=Math.max(1,(currentYear-joinedYear)*12+currentMonth-joinedMonthNumber+1);
 const months=Array.from({length:Math.min(monthCount,availableMonths)},(_,index)=>{const first=new Date(currentYear,currentMonth-1-index,1);return {key:`${first.getFullYear()}-${String(first.getMonth()+1).padStart(2,'0')}`,first,days:new Date(first.getFullYear(),first.getMonth()+1,0).getDate()}});
 return <main className={`${s.canvas} ${s.referenceBackground}`}><section ref={scroller} className={`${s.tabPage} ${j.page}`}><PageHeader title="บันทึกประจำวัน" action={<JournalShare/>}/><div className={j.monthStack}>{months.map(month=><section className={j.calendarMonth} key={month.key} aria-labelledby={`journal-month-${month.key}`}><h2 id={`journal-month-${month.key}`}>{month.first.toLocaleDateString('th-TH',{month:'long',year:'numeric'})}</h2><div className={j.weekdays} aria-hidden="true">{['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'].map(day=><span key={day}>{day}</span>)}</div><div className={j.calendarDays}>{Array.from({length:month.first.getDay()},(_,i)=><span key={`blank-${i}`} aria-hidden="true"/>)}{Array.from({length:month.days},(_,i)=>{const day=i+1,date=`${month.key}-${String(day).padStart(2,'0')}`,daily=entries.filter(entry=>entry.date===date),entry=daily[0],today=date===entryDate,future=date>entryDate;return <button type="button" key={date} data-date={date} className={j.calendarDay} disabled={!canWrite(date)} aria-current={today?'date':undefined} aria-haspopup="dialog" aria-label={`${today?'วันนี้ ':''}${dateLabel(date)} ${entry?`${entry.mood}${daily.length>1?` · ${daily.length} บันทึก`:''}`:future?'ยังไม่ถึงวันที่บันทึก':!canWrite(date)?'ยังไม่ถึงวันเริ่มบันทึก':'เขียนบันทึก'}`} onClick={()=>open(entry??null,date)}><span className={j.dayCircle}>{entry?<MoodArt mood={entry.mood}/>:<span className={j.emptyCircle}/>}</span><span className={j.dayNumber}>{day}</span>{daily.length>1&&<span className={j.entryCount}>{daily.length}</span>}</button>})}</div></section>)}</div>{monthCount<availableMonths&&<button type="button" className={j.olderMonths} onClick={()=>setMonthCount(count=>count+6)}>ดูเดือนก่อนหน้า</button>}</section>
 <dialog ref={dialog} className={s.medicineDialog} aria-labelledby="journal-title" onCancel={event=>{event.preventDefault();close();}} onClick={event=>{if(event.currentTarget===event.target)close();}}><section className={`${s.medicineSheet} ${j.composerSheet} ${closing?s.medicineClosing:''}`} onAnimationEnd={event=>{if(event.currentTarget===event.target&&closing){dialog.current?.close();setClosing(false);}}}><SheetResize onDismiss={close}/><header className={s.medicineSheetHeader}><h2 id="journal-title">{selected?'แก้ไขบันทึกประจำวัน':'เขียนบันทึกประจำวัน'}</h2><button aria-label="ปิดสมุดบันทึก" onClick={close}><X size={20}/></button></header><div className={`${s.medicineSheetBody} ${j.detail}`}><JournalForm date={selected?.date??formDate} entry={selected??undefined} key={selected?.id??formDate} onSaved={close}/></div></section></dialog></main>;
}
