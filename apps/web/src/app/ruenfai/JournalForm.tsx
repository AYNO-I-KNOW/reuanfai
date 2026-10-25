'use client';
import {useState} from 'react';
import {useJournal} from './JournalState';
import j from './journal/journal.module.css';
import MoodArt,{moods} from './MoodArt';
import {useToast} from './ToastProvider';
export default function JournalForm({date,onSaved}:{date:string;onSaved:()=>void}){
 const toast=useToast();
 const {setEntries}=useJournal();const [mood,setMood]=useState('สบายใจ');const [body,setBody]=useState('');
 return <form className={j.form} onSubmit={e=>{e.preventDefault();const text=body.trim();if(!text)return;setEntries(prev=>[{id:crypto.randomUUID(),date,title:mood,body:text,mood},...prev]);setBody('');onSaved();toast('เก็บบันทึกเรียบร้อยแล้ว');}}><fieldset><legend>วันนี้รู้สึกอย่างไร</legend><div className={j.moods}>{moods.map(value=><button type="button" key={value} aria-label={value} aria-pressed={mood===value} onClick={()=>setMood(value)}><MoodArt mood={value} className={j.moodVector}/></button>)}</div></fieldset><label>เรื่องราวของวันนี้<textarea name="body" value={body} onChange={event=>setBody(event.target.value)} placeholder="เขียนได้ตามที่คุณอยากเล่า…" rows={4} required/></label><button className={j.save} type="submit" disabled={!body.trim()}>เก็บบันทึก</button></form>;
}
