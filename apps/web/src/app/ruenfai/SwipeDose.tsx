'use client';
import {useEffect,useRef,useState,type CSSProperties,type ReactNode} from 'react';
import {Check} from 'lucide-react';
import s from './swipe-dose.module.css';
export default function SwipeDose({children,enabled,onComplete,label,restoring=false}:{children:ReactNode;enabled:boolean;onComplete:()=>void;label:string;restoring?:boolean}){
 const threshold=98;
 const [exiting,setExiting]=useState(false);
 const exitTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>()=>{if(exitTimer.current)clearTimeout(exitTimer.current)},[]);
 function complete(){
  if(exitTimer.current||exiting)return;
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){onComplete();return;}
  setExiting(true);setOffset(gesture.current?.width??600);
  exitTimer.current=setTimeout(onComplete,360);
 }
 const [offset,setOffset]=useState(0),[dragging,setDragging]=useState(false);
 const gesture=useRef<{x:number;y:number;axis:'pending'|'horizontal'|'vertical';offset:number;width:number}|null>(null);
 const suppressClick=useRef(false);
 if(!enabled)return children;
 return <div className={`${s.frame} ${restoring?s.restoring:""} ${exiting?s.exiting:""}`} style={{"--swipe-reveal-width":`${Math.min(88,Math.max(0,offset-10))}px`} as CSSProperties}><div className={s.body}><div className={`${s.reveal} ${offset>=threshold?s.ready:''}`} aria-hidden="true"><Check size={24}/><span>ทานแล้ว</span></div><div className={`${s.card} ${dragging?s.dragging:''}`} style={{transform:`translateX(${offset}px)`}} onDragStart={event=>event.preventDefault()} onPointerDown={event=>{if(exiting||!event.isPrimary||event.button!==0)return;suppressClick.current=false;gesture.current={x:event.clientX,y:event.clientY,axis:'pending',offset:0,width:event.currentTarget.clientWidth};}} onPointerMove={event=>{const origin=gesture.current;if(!origin)return;const x=event.clientX-origin.x,y=event.clientY-origin.y;if(origin.axis==='pending'&&Math.max(Math.abs(x),Math.abs(y))>8){origin.axis=Math.abs(x)>Math.abs(y)*1.25?'horizontal':'vertical';if(origin.axis==='horizontal'){event.currentTarget.setPointerCapture(event.pointerId);setDragging(true);suppressClick.current=true;}}if(origin.axis==='horizontal'){origin.offset=Math.max(0,Math.min(x,threshold));setOffset(origin.offset);}}} onPointerUp={()=>{const origin=gesture.current;setDragging(false);if(origin?.axis==='horizontal'&&origin.offset>=threshold){complete();}else setOffset(0);gesture.current=null;}} onPointerCancel={()=>{gesture.current=null;setOffset(0);setDragging(false);}} onClickCapture={event=>{if(suppressClick.current){event.preventDefault();event.stopPropagation();suppressClick.current=false;}}}>{children}</div><button className={s.accessibleAction} type="button" onClick={complete} aria-label={`บันทึกว่าทานแล้ว ${label}`}>บันทึกว่าทานแล้ว</button></div></div>
}
