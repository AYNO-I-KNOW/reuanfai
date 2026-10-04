'use client';
import {useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {Eye,EyeOff,ArrowRight} from 'lucide-react';
import '@/design/fonts.css';
import s from './page.module.css';
export default function Page(){const [show,setShow]=useState(false),[ready,setReady]=useState(false);return <main className={s.page}><section className={s.card}><Image src="/images/logo-dtam.png" alt="เรือนไฟ" width={56} height={56}/><h1>เข้าสู่ระบบเรือนไฟ</h1><p>สำหรับหน่วยบริการและกรม</p>{!ready?<form onSubmit={e=>{e.preventDefault();setReady(true)}}><label>ชื่อผู้ใช้<input name="username" autoComplete="username" required placeholder="กรอกชื่อผู้ใช้"/></label><label>รหัสผ่าน<div className={s.password}><input name="password" type={show?'text':'password'} autoComplete="current-password" required placeholder="กรอกรหัสผ่าน"/><button type="button" aria-label={show?'ซ่อนรหัสผ่าน':'แสดงรหัสผ่าน'} onClick={()=>setShow(!show)}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label><button className={s.primary} type="submit">เข้าสู่ระบบ <ArrowRight size={18}/></button><small>พรีวิวดีไซน์ · ยังไม่ตรวจสอบบัญชีจริง</small></form>:<div className={s.destinations}><h2>เลือกพื้นที่ทำงาน</h2><Link href="/clinic">หน่วยบริการ <ArrowRight size={18}/></Link><Link href="/department">กรม <ArrowRight size={18}/></Link><button onClick={()=>setReady(false)}>กลับไปหน้าเข้าสู่ระบบ</button></div>}</section></main>}
