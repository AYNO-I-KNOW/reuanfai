'use client';
import {useState} from 'react';
import {FileText,Share} from 'lucide-react';
import {PickerSheet,SheetDate} from '../PickerSheet';
import {useJournal} from '../JournalState';
import {useToast} from '../ToastProvider';
import j from './journal.module.css';

/** Export interaction preview only: no file or patient-data transmission. */
export default function JournalShare(){
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok'}).format(new Date());
 const [start,setStart]=useState(today),[end,setEnd]=useState(today);
 const {entries}=useJournal(),toast=useToast();
 const valid=Boolean(start&&end&&start<=end);
 const days=new Set(entries.filter(entry=>entry.date>=start&&entry.date<=end).map(entry=>entry.date)).size;
 return <div className={j.shareLaunch}><PickerSheet title="ส่งออกบันทึกประจำวัน" trigger={<><Share size={20} aria-hidden="true"/><span>ส่งออก</span></>}>{close=><form className={j.exportForm} onSubmit={event=>{event.preventDefault();if(!valid)return;close();toast('ส่งออกสำเร็จ')}}>
  <div className={j.exportDates}><div className={j.healthField}><span>วันที่เริ่มต้น</span><SheetDate label="เลือกวันที่เริ่มต้น" value={start} onChange={value=>{setStart(value);if(value>end)setEnd(value)}} max={today}/></div><div className={j.healthField}><span>วันที่สิ้นสุด</span><SheetDate label="เลือกวันที่สิ้นสุด" value={end} onChange={setEnd} min={start} max={today}/></div></div>
  <div className={j.exportFile}><FileText size={24} aria-hidden="true"/><div><strong>ไฟล์ PDF</strong><span>บันทึกในช่วงที่เลือก {days} วัน</span></div></div>
  <button className={j.save} type="submit" disabled={!valid}>ยืนยันส่งออก</button>
 </form>}</PickerSheet></div>;
}
