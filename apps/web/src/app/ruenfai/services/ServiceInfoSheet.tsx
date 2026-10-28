'use client';
import {useEffect,useRef,useState} from 'react';
import Image from 'next/image';
import {X,ChevronRight} from 'lucide-react';
import SheetResize from '../SheetResize';
import {useTabNavigation} from '../TabMotion';
import type {ServiceInfo} from './service-info';
import type {serviceStageView} from '../appointments/service-stage';
import s from '../page.module.css';
import css from './service-info.module.css';
type StageView=ReturnType<typeof serviceStageView>;
export default function ServiceInfoSheet({service,view,onClose,onAction}:{service:ServiceInfo|null;view:StageView|null;onClose:()=>void;onAction:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),afterClose=useRef<(()=>void)|null>(null);
 const [closing,setClosing]=useState(false);
 const navigate=useTabNavigation();
 useEffect(()=>{if(service)dialog.current?.showModal();else dialog.current?.close();},[service]);
 function finish(){dialog.current?.close();setClosing(false);onClose();const next=afterClose.current;afterClose.current=null;next?.();}
 function close(next?:()=>void){afterClose.current=next??null;if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)finish();else setClosing(true);}
 function ask(question?:string){if(!service)return;const href=`/ruenfai/chat?from=${encodeURIComponent('/ruenfai/appointments')}&service=${service.id}${question?`&question=${encodeURIComponent(question)}`:''}`;close(()=>navigate(href));}
 const askLatest=useRef(ask);
 useEffect(()=>{askLatest.current=ask;});
 useEffect(()=>{const element=dialog.current;if(!element)return;const listener=(event:Event)=>askLatest.current(typeof (event as CustomEvent).detail==='string'?(event as CustomEvent<string>).detail:undefined);element.addEventListener('service-chat-ask',listener);return()=>element.removeEventListener('service-chat-ask',listener);},[]);
 return <dialog data-service-dialog data-service-id={service?.id} ref={dialog} className={s.medicineDialog} aria-labelledby="service-info-title" onCancel={event=>{event.preventDefault();close();}} onClick={event=>{if(event.target===event.currentTarget)close();}}>
  <section data-sheet-edge-expanded data-sheet-scroll-collapse className={`${s.medicineSheet} ${css.sheet} ${closing?s.medicineClosing:''}`} onAnimationEnd={event=>{if(event.target===event.currentTarget&&closing)finish();}}>
   <SheetResize onDismiss={()=>close()}/>
   <header className={`${s.medicineSheetHeader} ${css.header}`}><h2 id="service-info-title">{service?.name||'ข้อมูลบริการ'}</h2><button type="button" aria-label="ปิดข้อมูลบริการ" onClick={()=>close()}><X size={20}/></button></header>
   {service&&view&&<>
    <div className={css.body} data-sheet-scroll-body>
     <div className={css.hero}><div className={css.art}><Image src={`/images/ruenfai/services/${service.art}-base.svg`} alt="" width={120} height={120}/><Image src={`/images/ruenfai/services/${service.art}.svg`} alt={`ภาพประกอบ${service.name}`} width={120} height={120}/></div><p>{service.intro}</p></div>
     {service.sections.map(section=><section className={css.section} key={section.title}><h3>{section.title}</h3><p>{section.text}</p></section>)}
     <section className={css.section}><h3>คำถามที่พบบ่อย</h3><div className={css.faq}>{service.faq.map(item=><details key={item.question}><summary>{item.question}<ChevronRight size={18} aria-hidden="true"/></summary><p>{item.answer}</p><button type="button" onClick={()=>ask(item.question)}>ถามน้องเรือนไฟต่อ</button></details>)}</div></section>

    </div>

    <footer className={css.footer} data-sheet-footer>{view.actionable?<button type="button" className={`${s.doseConfirm} ${css.primary}`} onClick={()=>close(onAction)}>{view.label}<ChevronRight size={18} aria-hidden="true"/></button>:<div className={`${css.status} ${css[view.tone]}`} role="status"><span>{view.label}</span></div>}</footer>
   </>}
  </section>
 </dialog>;
}
