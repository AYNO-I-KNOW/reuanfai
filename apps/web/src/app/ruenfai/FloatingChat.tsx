'use client';
import {useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import {usePathname} from 'next/navigation';
import ChatInvitation from './ChatInvitation';
import {SolidChat} from './SolidIcons';
import {useTabNavigation} from './TabMotion';
import {getServiceInfo} from './services/service-info';
import n from './bottom-nav.module.css';

/** One persistent assistant. Move its portal host, never its animated contents. */
export default function FloatingChat(){
 const path=usePathname(),navigate=useTabNavigation();
 const [host,setHost]=useState<HTMLElement|null>(null),[serviceId,setServiceId]=useState<string|null>(null);
 useEffect(()=>{
  const element=document.createElement('div');element.dataset.floatingChatHost='';element.style.display='contents';document.body.append(element);
  const sync=()=>{
   const modal=document.querySelector<HTMLDialogElement>('dialog[data-service-dialog][open]');
   const target=modal??document.body;if(element.parentElement!==target)target.append(element);
   setServiceId(modal?.dataset.serviceId??null);
   const nav=document.querySelector<HTMLElement>('[data-mother-bottom-nav]');
   if(nav)element.style.setProperty('--floating-nav-height',`${nav.getBoundingClientRect().height}px`);
  };
  const observer=new MutationObserver(sync);observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open','data-service-id']});
  const resize=new ResizeObserver(sync);const nav=document.querySelector('[data-mother-bottom-nav]');if(nav)resize.observe(nav);
  const timer=setTimeout(()=>{setHost(element);sync();},0);
  return()=>{clearTimeout(timer);observer.disconnect();resize.disconnect();element.remove();};
 },[]);
 const service=getServiceInfo(serviceId);
 function ask(question?:string){
  const modal=document.querySelector<HTMLDialogElement>('dialog[data-service-dialog][open]');
  if(modal){modal.dispatchEvent(new CustomEvent('service-chat-ask',{detail:question}));return;}
  navigate(`/ruenfai/chat?from=${encodeURIComponent(path)}${question?`&question=${encodeURIComponent(question)}`:''}`);
 }
 if(!host)return null;
 return createPortal(<div className={n.floatingLayer} data-floating-assistant><ChatInvitation from={path} questions={service?.faq.map(item=>item.question)} onAsk={ask}/><button type="button" className={n.chat} aria-label={service?`สนทนาเรื่อง${service.name}`:'สนทนากับผู้ช่วย AI'} onClick={()=>ask()}><SolidChat size={26}/></button></div>,host);
}
