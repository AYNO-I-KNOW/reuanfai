'use client';
import {useEffect,useRef,useState} from 'react';
import Image from 'next/image';
import {X} from 'lucide-react';
import type {MotherAppointment} from './useMotherAppointments';
import s from './page.module.css';
import styles from './appointment-sheet.module.css';
export default function AppointmentSheet({appointment,onClose}:{appointment:MotherAppointment|null;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 const [closing,setClosing]=useState(false);
 useEffect(()=>{if(appointment)dialog.current?.showModal();else dialog.current?.close();},[appointment]);
 function finish(){dialog.current?.close();setClosing(false);onClose();}
 function close(){if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)finish();else setClosing(true);}
 return <dialog ref={dialog} className={s.medicineDialog} aria-labelledby="appointment-detail-title" onCancel={event=>{event.preventDefault();close();}} onClick={event=>{if(event.currentTarget===event.target)close();}}><section className={`${s.medicineSheet} ${closing?s.medicineClosing:''}`} onAnimationEnd={event=>{if(event.target===event.currentTarget&&closing)finish();}}><header className={s.medicineSheetHeader}><h2 id="appointment-detail-title">รายละเอียดนัดหมาย</h2><button type="button" aria-label="ปิดรายละเอียดนัดหมาย" onClick={close}><X size={20}/></button></header>{appointment&&<div className={`${s.medicineSheetBody} ${styles.body}`}><div className={styles.identity}><Image src={`/images/ruenfai/services/${appointment.art}.svg`} alt="" width={72} height={72}/><div><h3>{appointment.service}</h3><span className={s.pill}>{appointment.status}</span></div></div><dl className={styles.details}><div><dt>วันที่</dt><dd>{new Date(appointment.date+'T12:00:00+07:00').toLocaleDateString('th-TH',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Bangkok'})}</dd></div><div><dt>เวลา</dt><dd>{appointment.time}{appointment.endTime?`–${appointment.endTime}`:''} น.</dd></div>{appointment.unit&&<div><dt>สถานที่</dt><dd>{appointment.unit}</dd></div>}{appointment.doctor&&<div><dt>ผู้ให้บริการ</dt><dd>{appointment.doctor}</dd></div>}</dl><button type="button" className={s.doseConfirm} onClick={close}>ปิด</button></div>}</section></dialog>;
}
