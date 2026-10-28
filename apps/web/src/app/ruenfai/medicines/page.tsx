'use client';
import SheetResize from '../SheetResize';
import {useRef,useState} from 'react';
import Image from 'next/image';
import {ChevronRight,X} from 'lucide-react';
import '@/design/fonts.css';
import s from '../page.module.css';
import PageHeader from '../PageHeader';
import m from './medicines.module.css';
import {useMedicines} from './useMedicines';
import MedicineDetails from './MedicineDetails';
import {useMedicine} from '../MedicineState';

// Illustrative schedules for UI demos, not prescription instructions.
function MedicineArt({art}:{art:number}){return <div className={m.art}><Image src={`/images/ruenfai/medicines/medicine-${art}.svg`} alt="" width={80} height={80}/></div>}
function Times({times}:{times:string[]}){return <span className={m.times} aria-label={`เวลาใช้ยา ${times.join(', ')}`}>{times.map(time=><span className={m.time} key={time}>{time}</span>)}</span>}
export default function MedicinesPage(){
 const {date,taken,mark}=useMedicine();
 const medicines=useMedicines();
 const dialog=useRef<HTMLDialogElement>(null);const [selection,setSelected]=useState(medicines[0]);const [closing,setClosing]=useState(false);
 const selected=medicines.find(m=>m.name===selection.name)||selection;
 const finishClose=()=>{dialog.current?.close();setClosing(false);};
 const close=()=>{if(closing)return;if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){finishClose();return;}setClosing(true);};
 return <main className={`${s.canvas} ${s.referenceBackground}`}><section className={`${s.tabPage} ${s.appointmentsPage}`}><PageHeader title="ยาของฉัน"/><ol className={`${s.appointmentGrid} ${s.medicineList}`}>{medicines.map(medicine=><li key={medicine.name}><button className={s.medicineSummary} aria-haspopup="dialog" onClick={()=>{setSelected(medicine);setClosing(false);dialog.current?.showModal();}}><MedicineArt art={medicine.art}/><span className={`${s.medicineContent} ${m.copy}`}><strong>{medicine.name}</strong><span className={m.benefit}>{medicine.benefit}</span><Times times={medicine.times}/></span><ChevronRight size={20} strokeWidth={1.7} aria-hidden="true"/></button></li>)}</ol></section>
 <dialog ref={dialog} className={s.medicineDialog} aria-labelledby="medicine-title" onCancel={e=>{e.preventDefault();close();}} onClick={e=>{if(e.target===e.currentTarget)close();}}><section className={`${s.medicineSheet} ${closing?s.medicineClosing:""}`} onAnimationEnd={e=>{if(e.target===e.currentTarget&&closing)finishClose();}}><SheetResize onDismiss={close}/><div className={`${s.medicineSheetHeader} ${s.medicineIdentityHeader}`}><MedicineArt art={selected.art}/><div className={s.medicineIdentityText}><h2 id="medicine-title">{selected.name}</h2><Times times={selected.times}/></div><button onClick={close} aria-label="ปิดรายละเอียดยา" autoFocus><X size={20}/></button></div><div className={s.medicineSheetBody}><MedicineDetails medicine={selected}/><div className={m.actions}>{selected.times.length>1&&<button className={`${s.doseConfirm} ${m.secondary}`} disabled={!selected.times.some(time=>!taken.includes(`${date}:${selected.name}:${time}`))} onClick={()=>{const next=selected.times.find(time=>!taken.includes(`${date}:${selected.name}:${time}`));if(next)mark(selected.name,[next])}}>{selected.times.some(time=>!taken.includes(`${date}:${selected.name}:${time}`))?`ทาน ${selected.times.find(time=>!taken.includes(`${date}:${selected.name}:${time}`))} แล้ว`:'ทานครบทุกรอบแล้ว'}</button>}<button className={s.doseConfirm} disabled={selected.times.every(time=>taken.includes(`${date}:${selected.name}:${time}`))} onClick={()=>{mark(selected.name,selected.times);close()}}>{selected.times.length>1?'ทานครบทุกรอบแล้ว':'ทานยารอบนี้แล้ว'}</button></div></div></section></dialog></main>;
}
