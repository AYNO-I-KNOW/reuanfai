'use client';
import {useEffect,useState} from 'react';
import Image from 'next/image';
import s from './chat.module.css';

export const MIN_THINKING_MS=6000;
const stages=['กำลังคิด','กำลังเรียบเรียง','เตรียมคำตอบ'];
/** Timed presentation stages for the demo, not backend analysis telemetry. */
export default function ThinkingIndicator(){
 const [stage,setStage]=useState(0);
 useEffect(()=>{const timers=[setTimeout(()=>setStage(1),2000),setTimeout(()=>setStage(2),4000)];return()=>timers.forEach(clearTimeout)},[]);
 return <div className={s.thinking} role="status" aria-label={stages[stage]}>
  <Image className={s.thinkingMascot} src="/images/ruenfai/results/baby.png" alt="" width={72} height={66} loading="eager"/>
  <div className={s.thinkingCaption} aria-hidden="true"><span key={stage} className={s.thinkingStage}>{stages[stage]}</span><span className={s.thinkingDots}><span>.</span><span>.</span><span>.</span></span></div>
 </div>;
}
