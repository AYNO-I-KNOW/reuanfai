'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {usePathname} from 'next/navigation';
import Image from 'next/image';
import s from './splash.module.css';
// A stuck font or image decode must never hold the splash open.
const assetTimeout=5000;
export default function EntryGate({children}:{children:ReactNode}){
 const path=usePathname();
 const [phase,setPhase]=useState<'loading'|'leaving'|'done'>(path==='/ruenfai'?'loading':'done');
 const content=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(phase!=='loading')return;
  let cancelled=false;let timer:ReturnType<typeof setTimeout>,cap:ReturnType<typeof setTimeout>;
  const minimum=new Promise<void>(resolve=>{timer=setTimeout(resolve,3000)});
  const assets=Promise.allSettled([
   document.fonts.ready,
   ...Array.from(content.current?.querySelectorAll('img')??[]).filter(image=>{const rect=image.getBoundingClientRect();return rect.width>0&&rect.height>0&&rect.bottom>0&&rect.top<window.innerHeight}).map(image=>{image.loading='eager';return image.decode()}),
  ]);
  const capped=Promise.race([assets,new Promise<void>(resolve=>{cap=setTimeout(resolve,assetTimeout)})]);
  Promise.all([minimum,capped]).then(()=>{if(!cancelled)setPhase(window.matchMedia('(prefers-reduced-motion: reduce)').matches?'done':'leaving')});
  return()=>{cancelled=true;clearTimeout(timer);clearTimeout(cap)};
 },[phase]);
 useEffect(()=>{if(phase!=='leaving')return;const timer=setTimeout(()=>setPhase('done'),260);return()=>clearTimeout(timer)},[phase]);
 return <><div ref={content} className={s.content} data-ready={phase!=='loading'} inert={phase!=='done'}>{children}</div>{phase!=='done'&&<div className={`${s.splash} ${phase==='leaving'?s.leaving:''}`} role="status" aria-label="กำลังเปิดเรือนไฟ"><Image className={s.mascot} src="/images/ruenfai/results/baby.png" alt="" width={176} height={160} priority/></div>}</>;
}
