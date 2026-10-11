'use client';

import Link from 'next/link';
import {usePathname,useSearchParams} from 'next/navigation';
import {useState} from 'react';
import {PanelLeftClose,PanelLeftOpen} from 'lucide-react';
import s from './flow-shortcuts.module.css';

const screens=[
 {label:'หน้าแรก',href:'/ruenfai'},
 {label:'ความยินยอม',href:'/ruenfai/onboarding?screen=consent'},
 {label:'1 · ข้อมูลคุณแม่',href:'/ruenfai/onboarding?screen=stage-1'},
 {label:'2 · อาการหลังคลอด',href:'/ruenfai/onboarding?screen=stage-2'},
 {label:'3 · ภาวะสุขภาพ',href:'/ruenfai/onboarding?screen=stage-3'},
 {label:'4 · ข้อควรระวัง',href:'/ruenfai/onboarding?screen=stage-4'},
 {label:'กำลังประมวลผล',href:'/ruenfai/onboarding?screen=processing'},
 {label:'ผลการประเมิน',href:'/ruenfai/onboarding?screen=results'},
 {label:'จองคิว',href:'/ruenfai/onboarding?screen=booking'},
 {label:'เขียนรีวิว',href:'/ruenfai/review'},
 {label:'นัดหมาย',href:'/ruenfai/appointments'},
 {label:'ยา',href:'/ruenfai/medicines'},
 {label:'บันทึก',href:'/ruenfai/journal'},
];

export default function MobileFlowShortcuts(){
 const path=usePathname(),query=useSearchParams();
 const [collapsed,setCollapsed]=useState(false);
 const active=path==='/ruenfai/onboarding'?`${path}?screen=${query.get('screen')||'consent'}`:path;
 if(process.env.NODE_ENV==='production')return null;
 return <aside className={`${s.panel} ${collapsed?s.collapsed:''}`} aria-label="ทางลัดทดสอบแอปมือถือ">
  <header><span>ทางลัดทดสอบ</span><button type="button" aria-label={collapsed?'เปิดทางลัดทดสอบ':'ย่อทางลัดทดสอบ'} aria-expanded={!collapsed} onClick={()=>setCollapsed(v=>!v)}>{collapsed?<PanelLeftOpen size={18}/>:<PanelLeftClose size={18}/>}</button></header>
  {!collapsed&&<><small>แอปคุณแม่ · พรีวิว</small><nav>{screens.map(screen=><Link href={screen.href} key={screen.href} prefetch={false} scroll={false} aria-current={active===screen.href?'page':undefined}>{screen.label}</Link>)}</nav></>}
 </aside>;
}
