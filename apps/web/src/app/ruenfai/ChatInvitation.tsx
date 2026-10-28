'use client';
import {useEffect,useState} from 'react';
import {useChatTopics} from './chat-topics';
import {useTabNavigation} from './TabMotion';
import s from './bottom-nav.module.css';
export default function ChatInvitation({from}:{from:string}){
 const topics=useChatTopics(),navigate=useTabNavigation();
 const [phase,setPhase]=useState<'typing'|'hold'|'exit'|'hidden'>('typing');
 const [cycle,setCycle]=useState(0),[text,setText]=useState(''),[visible,setVisible]=useState(false);
 const topic=topics[cycle%topics.length],question=topic.label;
 useEffect(()=>{const timer=setTimeout(()=>setVisible(true),2400);return()=>clearTimeout(timer)},[]);
 useEffect(()=>{if(!visible)return;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;const segments=Array.from(new Intl.Segmenter('th',{granularity:'grapheme'}).segment(question),s=>s.segment);let count=0;const timers:ReturnType<typeof setTimeout>[]=[];let typing:ReturnType<typeof setInterval>|undefined;
 timers.push(setTimeout(()=>{setPhase('typing');setText('');if(reduced){setText(question);setPhase('hold')}else typing=setInterval(()=>{count++;setText(segments.slice(0,count).join(''));if(count>=segments.length){clearInterval(typing);setPhase('hold')}},65)},400));
 const reading=400+(reduced?0:segments.length*65)+6000;
 timers.push(setTimeout(()=>setPhase('exit'),reading));timers.push(setTimeout(()=>setPhase('hidden'),reading+240));timers.push(setTimeout(()=>{setCycle(value=>value+1)},reading+2000));return()=>{timers.forEach(clearTimeout);clearInterval(typing)}},[question,visible]);
 if(!visible)return null;
 return <aside data-phase={phase} className={s.invitation} aria-label="คำถามแนะนำ" inert={phase==='hidden'}><button type="button" className={s.inviteQuestion} aria-label={question} onClick={()=>navigate(`/ruenfai/chat?from=${encodeURIComponent(from)}&question=${encodeURIComponent(question)}&query=${encodeURIComponent(topic.query)}`)}>{text||<span className={s.typingDots} aria-hidden="true"><i/><i/><i/></span>}</button></aside>;
}
