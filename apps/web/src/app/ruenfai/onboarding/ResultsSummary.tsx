'use client';

import {useEffect} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import s from './results.module.css';
import {markOnboarded} from './onboarded';

// Supplied result-screen examples. These are not calculated from questionnaire answers.
const procedures=[
 {name:'นวดไทย',status:'ทำได้',kind:'available',art:'massage',description:'ตรวจสอบความพร้อมสำหรับนวดไทยหลังคลอด ก่อนเลือกวันเข้ารับบริการ'},
 {name:'ประคบสมุนไพร',status:'ทำได้',kind:'available',art:'compress',description:'ตรวจสอบความพร้อมสำหรับประคบสมุนไพร ก่อนเลือกวันเข้ารับบริการ'},
 {name:'ทับหม้อเกลือ',status:'ทำได้',kind:'available',art:'salt-pot',description:'ตรวจสอบระยะหลังคลอดและความพร้อมของแผล ก่อนรับบริการทับหม้อเกลือ'},
 {name:'อบสมุนไพร',status:'รอการประเมิน',kind:'assessment',art:'steam',description:'ให้ผู้ให้บริการประเมินสุขภาพและความพร้อม ก่อนเลือกวันอบสมุนไพร'},
 {name:'นวดกระตุ้นน้ำนม',status:'รอการประเมิน',kind:'assessment',art:'lactation',description:'ปรึกษาผู้ให้บริการเรื่องการให้นม เพื่อประเมินความเหมาะสมก่อนรับบริการ'},
 {name:'ก้อนเส้า',status:'ห้ามหลังคลอด',kind:'restricted',art:'hot-stones',description:'การใช้ก้อนหินร้อนวางบริเวณหน้าท้อง แสดงเป็นรายการห้ามในผลตัวอย่างนี้'},
] as const;

export default function ResultsSummary({animateFromProcessing=false,onBook}:{animateFromProcessing?:boolean;onBook?:()=>void}){
 // reaching the results screen = onboarding done
 useEffect(markOnboarded,[]);
 return <main className={`${s.page} ${animateFromProcessing?s.fromProcessing:''}`}>
  <section className={s.content}>
   <div className={s.hero}>
    <div className={s.heroArt}><Image src="/images/ruenfai/results/baby.png" alt="ภาพประกอบเด็กน้อย" width={308} height={280} priority/></div>
    <h1 id="results-heading" tabIndex={-1}>ผลการประเมิน</h1>
    <p>ดูความพร้อมของแต่ละบริการ ก่อนเลือกนัดหมายกับหน่วยบริการ</p>
   </div>
   <section className={s.procedures} aria-label="ผลตัวอย่างแยกตามหัตถการ">
    {procedures.map((procedure)=><article className={`${s.procedure} ${s[procedure.kind]}`} key={procedure.name}>
     <div className={s.procedureBody}><div className={s.procedureArt}><Image src={`/images/ruenfai/services/${procedure.art}-base.svg`} alt="" width={80} height={80}/><Image src={`/images/ruenfai/services/${procedure.art}.svg`} alt="" width={80} height={80}/></div><div className={s.procedureCopy}><div className={s.procedureHeading}><h2>{procedure.name}</h2><span className={s.status}>{procedure.status}</span></div><p className={s.procedureDescription}>{procedure.description}</p></div></div>
    </article>)}
   </section>
  </section>
  <footer className={s.footer}><Link className={s.secondary} href="/ruenfai" prefetch={false}>กลับสู่หน้าแรก</Link><button type="button" className={s.primary} onClick={onBook}>จองคิว</button></footer>
 </main>;
}
