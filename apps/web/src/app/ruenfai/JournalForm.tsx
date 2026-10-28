'use client';
import {useState} from 'react';
import {useJournal,type Entry} from './JournalState';
import j from './journal/journal.module.css';
import MoodArt,{moods} from './MoodArt';
import {useToast} from './ToastProvider';
const options=['พักผ่อนน้อย','เจ็บแผล','คัดตึงเต้านม','ปวดเมื่อย'];
export default function JournalForm({date,onSaved,entry}:{date:string;onSaved:()=>void;entry?:Entry}){
 const toast=useToast();
 const {setEntries}=useJournal();
 const [mood,setMood]=useState(entry?.mood??'');
 const [body,setBody]=useState(entry?.body??'');
 const [symptoms,setSymptoms]=useState<string[]>(entry?.symptoms??[]);
 return <form className={j.form} onSubmit={e=>{
  e.preventDefault();if(!mood)return;
  setEntries(prev=>entry?prev.map(item=>item.id===entry.id?{...item,mood,body:body.trim(),symptoms}:item):[{id:crypto.randomUUID(),date,title:mood,body:body.trim(),mood,symptoms},...prev]);
  onSaved();toast(entry?'แก้ไขบันทึกเรียบร้อยแล้ว':'เก็บบันทึกเรียบร้อยแล้ว');
 }}>
 <fieldset><legend>วันนี้รู้สึกอย่างไร</legend><div className={j.moods} data-has-selection={Boolean(mood)}>{moods.map(value=><button type="button" key={value} aria-label={value} aria-pressed={mood===value} onClick={()=>setMood(previous=>previous===value?'':value)}><span className={j.moodIconSlot}><MoodArt mood={value} className={j.moodVector}/></span><span className={j.moodLabel}>{value}</span></button>)}</div></fieldset>
 <fieldset><legend>มีอะไรอยากบอกเพิ่มเติม <span className={j.optional}>(ไม่บังคับ)</span></legend><div className={j.symptoms}>{options.map(value=><button type="button" key={value} aria-pressed={symptoms.includes(value)} onClick={()=>setSymptoms(prev=>prev.includes(value)?prev.filter(item=>item!==value):[...prev,value])}>{value}</button>)}</div></fieldset>
 <label>เรื่องราวของวันนี้ <span className={j.optional}>(ไม่บังคับ)</span><textarea name="body" value={body} onChange={event=>setBody(event.target.value)} placeholder="เล่าเรื่องราวหรืออาการที่อยากบอก…" rows={3}/></label>
 <button className={j.save} type="submit" disabled={!mood}>{entry?'บันทึกการแก้ไข':'เก็บบันทึก'}</button>
 </form>;
}
