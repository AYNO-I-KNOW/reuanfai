'use client';
import {useState} from 'react';
import Checkbox from '@/components/ui/reuanfai-checkbox';
import {Share2,Copy,Download} from 'lucide-react';
import {PickerSheet,SheetDate} from '../PickerSheet';
import {useJournal,type Entry} from '../JournalState';
import {motherIdentity} from '../mother-identity';
import {profileDetails} from '../profile/profile-details';
import {useToast} from '../ToastProvider';
import {healthRows} from './daily-health';
import j from './journal.module.css';
type Period='รายวัน'|'รายสัปดาห์'|'รายเดือน'|'รายปี';
const dateKey=(date:Date)=>date.toISOString().slice(0,10);
export function journalRange(anchor:string,period:Period){const date=new Date(anchor+'T00:00:00Z'),start=new Date(date),end=new Date(date);if(period==='รายสัปดาห์'){start.setUTCDate(date.getUTCDate()-((date.getUTCDay()+6)%7));end.setTime(start.getTime());end.setUTCDate(start.getUTCDate()+6)}else if(period==='รายเดือน'){start.setUTCDate(1);end.setUTCMonth(date.getUTCMonth()+1,0)}else if(period==='รายปี'){start.setUTCMonth(0,1);end.setUTCMonth(11,31)}return {start:dateKey(start),end:dateKey(end)}}
const thaiDate=(date:string)=>new Date(date+'T12:00:00').toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'numeric'});
function entryText(entry:Entry,notes:boolean){return [`วันที่ ${thaiDate(entry.date)}`,`อารมณ์: ${entry.mood}`,...healthRows(entry.health).map(([label,value])=>`${label}: ${value}`),...(entry.symptoms?.length?[`อาการที่บันทึกเดิม: ${entry.symptoms.join(' · ')}`]:[]),...(notes?[`บันทึกเพิ่มเติม: ${entry.body||'ไม่ได้ระบุ'}`]:[])].join('\n')}
export default function JournalShare({date}:{date?:string}){
 const {entries}=useJournal(),identity=motherIdentity.use(),details=profileDetails.use(),toast=useToast();
 const [period,setPeriod]=useState<Period>('รายวัน'),[anchor,setAnchor]=useState(date??new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Bangkok'})),[notes,setNotes]=useState(false),[name,setName]=useState(false),[busy,setBusy]=useState(false);
 const range=journalRange(anchor,period),records=entries.filter(entry=>entry.date>=range.start&&entry.date<=range.end).sort((a,b)=>a.date.localeCompare(b.date)),days=new Set(records.map(entry=>entry.date)).size;
 const displayName=identity.nickname.trim()||details.name.trim();
 const report=[`บันทึกสุขภาพประจำวัน · ${period}`,`ช่วง ${thaiDate(range.start)} – ${thaiDate(range.end)} (เวลาไทย)`,...(name&&displayName?[`ชื่อ: ${displayName}`]:[]),`มีข้อมูล ${days} วัน · ${records.length} บันทึก`,'วันที่ไม่มีรายการ = ไม่ได้บันทึก ไม่ใช่ไม่มีอาการ','ข้อมูลที่เจ้าของบันทึกระบุเอง ไม่ใช่ผลวินิจฉัย','',...records.map(entry=>entryText(entry,notes)+'\n')].join('\n');
 async function copy(){try{await navigator.clipboard.writeText(report);toast('คัดลอกข้อมูลแล้ว')}catch{toast('คัดลอกไม่ได้ กรุณาลองดาวน์โหลดข้อความ')}}
 async function share(){if(busy)return;setBusy(true);try{if(navigator.share)await navigator.share({title:'บันทึกสุขภาพประจำวัน',text:report});else await copy()}catch(error){if(!(error instanceof DOMException&&error.name==='AbortError'))toast('แชร์ไม่ได้ กรุณาลองคัดลอกข้อมูล')}finally{setBusy(false)}}
 function download(){const url=URL.createObjectURL(new Blob(['\ufeff'+report],{type:'text/plain;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download=`ruenfai-journal-${range.start}-${range.end}.txt`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 return <div className={j.shareLaunch}><PickerSheet title="แชร์บันทึกประจำวัน" trigger={<Share2 size={20}/>} >{()=> <div className={j.shareContent}><p className={j.fieldHelp}>เลือกช่วงและตรวจข้อมูลก่อนแชร์</p><div className={j.periodChoices}>{(['รายวัน','รายสัปดาห์','รายเดือน','รายปี'] as Period[]).map(value=><button type="button" key={value} aria-pressed={period===value} onClick={()=>setPeriod(value)}>{value}</button>)}</div><div className={j.healthField}><span>วันที่อ้างอิง</span><SheetDate label="วันที่อ้างอิงสำหรับแชร์" value={anchor} onChange={setAnchor}/></div><p className={j.fieldHelp}>{thaiDate(range.start)} – {thaiDate(range.end)}{period==='รายสัปดาห์'?' · จันทร์–อาทิตย์':''}</p><Checkbox className={j.systemCheck} checked={notes} onChange={setNotes}>รวมบันทึกข้อความเพิ่มเติม</Checkbox><Checkbox className={j.systemCheck} checked={name} disabled={!displayName} onChange={setName}>รวมชื่อ{!displayName?' (ยังไม่ได้ระบุชื่อ)':''}</Checkbox><section className={j.reportPreview} aria-label="ตัวอย่างข้อมูลที่จะแชร์"><h3>ตัวอย่างข้อมูล</h3>{records.length?<pre>{report}</pre>:<p>ไม่มีบันทึกในช่วงวันที่เลือก</p>}</section><div className={j.shareActions}><button type="button" disabled={!records.length||busy} onClick={share}><Share2 size={18}/>{busy?'กำลังเปิดการแชร์…':'แชร์ข้อมูล'}</button><button type="button" disabled={!records.length||busy} onClick={copy}><Copy size={18}/>คัดลอก</button><button type="button" disabled={!records.length||busy} onClick={download}><Download size={18}/>ดาวน์โหลดข้อความ</button></div></div>}</PickerSheet></div>
}
