'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {usePathname} from 'next/navigation';
import Image from 'next/image';
import s from './splash.module.css';
export default function EntryGate({children}:{children:ReactNode}){
 const path=usePathname();
 const [phase,setPhase]=useState<'loading'|'leaving'|'done'>(path==='/ruenfai'?'loading':'done');
 const content=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(phase!=='loading')return;
  let cancelled=false;let timer:ReturnType<typeof setTimeout>;
  const minimum=new Promise<void>(resolve=>{timer=setTimeout(resolve,3000)});
  const assets=Promise.allSettled([
   document.fonts.ready,
   ...Array.from(content.current?.querySelectorAll('img')??[]).map(image=>image.decode()),
  ]);
  Promise.all([minimum,assets]).then(()=>{if(!cancelled)setPhase(window.matchMedia('(prefers-reduced-motion: reduce)').matches?'done':'leaving')});
  return()=>{cancelled=true;clearTimeout(timer)};
 },[phase]);
 useEffect(()=>{if(phase!=='leaving')return;const timer=setTimeout(()=>setPhase('done'),260);return()=>clearTimeout(timer)},[phase]);
 return <><div ref={content} className={s.content} data-ready={phase!=='loading'} inert={phase!=='done'}>{children}</div>{phase!=='done'&&<div className={`${s.splash} ${phase==='leaving'?s.leaving:''}`} role="status" aria-label="กำลังเปิดเรือนไฟ"><Image className={s.mascot} src="/images/ruenfai/results/baby.png" alt="" width={176} height={160} priority/></div>}</>;
}
