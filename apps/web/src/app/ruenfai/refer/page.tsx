'use client';
import Link from 'next/link';
import {useState} from 'react';
import {careJourney} from '@/design/care-journey';
import s from '../care-flow.module.css';
export default function ReferralPage(){const state=careJourney.use();const [busy,setBusy]=useState(false),[error,setError]=useState('');
 return <main className={s.page}><Link href="/ruenfai" className={s.back}>กลับหน้าแรก</Link><h1>ควรไปพบแพทย์</h1><p>หากมีอาการที่ต้องส่งต่อ กรุณาติดต่อโรงพยาบาลเพื่อรับการประเมินก่อนรับบริการหลังคลอด</p><section className={s.card}><h2>เหตุผลการส่งต่อ</h2><p>ตัวอย่างสถานะส่งต่อจากระบบคัดกรอง ยังไม่ได้รับผลจาก rules engine</p><p className={s.muted}>คู่มือ หน้า 79 · ผลจากข้อมูลที่คุณแจ้ง · ไม่ใช่ผลการวินิจฉัย</p><Link className={s.primary} href="/ruenfai/emergency">ดูช่องทางติดต่อ</Link></section><p className={s.notice}>ระหว่างรอประเมิน จะยังไม่เปิดให้จองบริการ ผู้ให้บริการเป็นผู้พิจารณาปลดสถานะส่งต่อ</p>{state.contacted?<p className={s.success} role="status">บันทึกว่าติดต่อแล้วในพรีวิว ยังต้องรอผู้ให้บริการประเมิน</p>:<button className={s.primary} disabled={busy} onClick={async()=>{setBusy(true);setError('');try{careJourney.set(v=>({...v,referralLocked:true,contacted:true}));}catch{setError('บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง')}finally{setBusy(false)}}}>ฉันติดต่อแล้ว</button>}{error&&<p role="alert">{error}</p>}</main>
}
