'use client';
import {useEffect,useRef,useState} from 'react';
import s from './sheet-resize.module.css';

/** Shared detents for mother-app sheets; leaves confirmation dialogs alone. */
export default function SheetResize({onDismiss}:{onDismiss?:()=>void}){
 const dismiss=useRef(onDismiss);
 useEffect(()=>{dismiss.current=onDismiss},[onDismiss]);
 const handle=useRef<HTMLButtonElement>(null),[expanded,setExpanded]=useState(false),[scrollable,setScrollable]=useState(false);
 const expandedRef=useRef(false);
 const toggle=(value:boolean)=>{expandedRef.current=value;setExpanded(value)};
 useEffect(()=>{
  const sheet=handle.current?.parentElement,dialog=sheet?.closest('dialog');if(!sheet||!dialog)return;
  const body=sheet.lastElementChild as HTMLElement;
  let base=0,opening=false,touchY:number|null=null,lockedUntil=0;
  const resize=new ResizeObserver(()=>{
   if(!dialog.open)return;
   const hasOverflow=body.scrollHeight>body.clientHeight+2;
   setScrollable(hasOverflow||expandedRef.current);
  });resize.observe(body);
  const reset=()=>{if(!dialog.open){sheet.style.removeProperty('height');sheet.removeAttribute('data-sheet-expanded');toggle(false);base=0;opening=false;return}if(opening)return;opening=true;base=sheet.getBoundingClientRect().height;};
  const viewport=window.visualViewport;
  const fitViewport=()=>{if(!dialog.open||!viewport||viewport.scale!==1)return;sheet.style.setProperty('--sheet-available-height',`${viewport.height}px`);sheet.style.marginBottom=`${Math.max(0,window.innerHeight-viewport.height-viewport.offsetTop)}px`};
  viewport?.addEventListener('resize',fitViewport);viewport?.addEventListener('scroll',fitViewport);fitViewport();
  const observer=new MutationObserver(()=>{reset();fitViewport()});observer.observe(dialog,{attributes:true,attributeFilter:['open']});reset();
  const expand=()=>{
   if(expandedRef.current||body.scrollHeight<=body.clientHeight+2)return false;
   base=sheet.getBoundingClientRect().height;sheet.style.setProperty('--sheet-rest-height',`${base}px`);sheet.style.height=`${base}px`;
   sheet.getBoundingClientRect();sheet.dataset.sheetExpanded='true';sheet.style.height='calc(var(--sheet-available-height, 100dvh) - 8px - env(safe-area-inset-top, 0px))';toggle(true);lockedUntil=performance.now()+300;return true;
  };
  const wheel=(event:WheelEvent)=>{if((event.target as HTMLElement).closest('dialog')!==dialog)return;if(event.deltaY>0&&(expand()||performance.now()<lockedUntil)){event.preventDefault();}};
  const start=(event:TouchEvent)=>{if((event.target as HTMLElement).closest('dialog')!==dialog)return;touchY=event.touches[0]?.clientY??null};
  const move=(event:TouchEvent)=>{if((event.target as HTMLElement).closest('dialog')!==dialog)return;if(touchY!==null&&touchY-(event.touches[0]?.clientY??touchY)>8&&(expand()||performance.now()<lockedUntil))event.preventDefault()};
  const key=(event:KeyboardEvent)=>{if((event.target as HTMLElement).closest('dialog')!==dialog)return;if(['PageDown','ArrowDown',' '].includes(event.key)&&(event.target as HTMLElement).matches('input,textarea,select,button')===false&&expand())event.preventDefault()};
  const focus=(event:FocusEvent)=>{if((event.target as HTMLElement).closest('dialog')!==dialog)return;if((event.target as HTMLElement).matches('input,textarea,select'))expand()};
  body.addEventListener('wheel',wheel,{passive:false});body.addEventListener('touchstart',start,{passive:true});body.addEventListener('touchmove',move,{passive:false});body.addEventListener('focusin',focus);body.addEventListener('keydown',key);
  const button=handle.current;
  let dragged=false;
  const change=()=>{if(dragged){dragged=false;return}if(expandedRef.current){sheet.style.height=`${base}px`;sheet.removeAttribute('data-sheet-expanded');toggle(false)}else if(!expand())dismiss.current?.()};
  button?.addEventListener('click',change);
  let pointerY=0;
  const down=(event:PointerEvent)=>{dragged=false;pointerY=event.clientY;button?.setPointerCapture(event.pointerId)};
  const up=(event:PointerEvent)=>{if(Math.abs(event.clientY-pointerY)<12)return;dragged=true;if(event.clientY<pointerY)expand();else if(expandedRef.current){sheet.style.height=`${base}px`;sheet.removeAttribute('data-sheet-expanded');toggle(false)}else dismiss.current?.()};
  button?.addEventListener('pointerdown',down);button?.addEventListener('pointerup',up);
  sheet.classList.add(s.resizable);
  return()=>{resize.disconnect();observer.disconnect();viewport?.removeEventListener('resize',fitViewport);viewport?.removeEventListener('scroll',fitViewport);body.removeEventListener('wheel',wheel);body.removeEventListener('touchstart',start);body.removeEventListener('touchmove',move);body.removeEventListener('focusin',focus);body.removeEventListener('keydown',key);button?.removeEventListener('click',change);button?.removeEventListener('pointerdown',down);button?.removeEventListener('pointerup',up);sheet.classList.remove(s.resizable)};
 },[]);
 return <button ref={handle} type="button" className={s.handle} aria-label={expanded?'ย่อชีต':scrollable?'ขยายชีต':'ปิดชีต'} aria-expanded={scrollable?expanded:undefined} disabled={!scrollable&&!onDismiss} data-scrollable={scrollable}><span/></button>;
}
