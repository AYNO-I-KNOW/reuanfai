'use client';
import {useTabNavigation} from '../TabMotion';
import {Suspense,useEffect,useState,useRef} from 'react';
import {useSearchParams} from 'next/navigation';
import Image from 'next/image';
import {ChevronLeft} from 'lucide-react';
import '@/design/fonts.css';
import s from './onboarding.module.css';
import Checkbox from '@/components/ui/reuanfai-checkbox';
import shared from '../page.module.css';
import MotherForm from './MotherForm';
import SymptomsForm from './SymptomsForm';
import ResultsSummary from './ResultsSummary';
import BookingForm from './BookingForm';
import {markOnboarded} from './onboarded';
const information=[
 {title:'เราเก็บข้อมูลอะไรบ้าง',body:'ข้อมูลหลังคลอด วิธีคลอด สุขภาพ ยาและสมุนไพรที่ใช้ คำตอบคัดกรอง นัดหมาย รีวิว และบัญชี LINE ที่ใช้เข้าสู่ระบบ'},
 {title:'เราใช้ข้อมูลเพื่ออะไร',body:'ช่วยคัดกรองความพร้อม จัดนัดหมายและรอบยา พร้อมส่งข้อมูลให้หน่วยบริการที่คุณเลือกเพื่อดูแลคุณแม่อย่างต่อเนื่อง'},
 {title:'ใครดูข้อมูลของคุณได้บ้าง',body:'คุณและผู้ดูแลในหน่วยบริการที่คุณเลือก ข้อมูลเพื่อพัฒนาบริการใช้ในภาพรวมโดยไม่ระบุตัวตน และเฉพาะเมื่อคุณยินยอม'},
 {title:'เปลี่ยนใจภายหลังได้ไหม',body:'คุณจัดการการแชร์ข้อมูล ถอนความยินยอม หรือขอลบข้อมูลได้จาก “การแชร์ข้อมูลของฉัน” ส่วนประวัติการรักษาที่หน่วยบริการบันทึกแล้วเป็นไปตามนโยบายของหน่วยบริการ'},
];
export default function OnboardingPage(){return <Suspense fallback={null}><OnboardingFlow/></Suspense>;}
function OnboardingFlow(){
 const navigate=useTabNavigation();
 const consentSection=useRef<HTMLElement>(null);
 const query=useSearchParams();const screen=query.get('screen');
 const [required,setRequired]=useState(false);const [optional,setOptional]=useState(false);const [booking,setBooking]=useState(false);const [processing,setProcessing]=useState(false);const [ready,setReady]=useState(false);const [step,setStep]=useState(0);const [direction,setDirection]=useState(1);
 useEffect(()=>{
  if(!screen||(process.env.NODE_ENV==='production'&&screen!=='booking'))return;
  const targets:Record<string,number>={'consent':0,'stage-1':1,'stage-2':2,'stage-3':3,'stage-4':4,'results':4,'processing':4,'booking':4};
  const target=targets[screen];if(target===undefined)return;
  // dev booking shortcut skips the results screen, which is where onboarding completes
  if(process.env.NODE_ENV!=='production'&&screen==='booking')markOnboarded();
  const frame=requestAnimationFrame(()=>{setStep(target);setReady(screen==='results'||screen==='booking');setBooking(screen==='booking');setProcessing(screen==='processing');setDirection(1);document.querySelector(`.${s.page}`)?.scrollTo({top:0});});
  return()=>cancelAnimationFrame(frame);
 },[screen]);
 useEffect(()=>{if(!processing)return;const timer=setTimeout(()=>{setProcessing(false);setReady(true);requestAnimationFrame(()=>document.getElementById('results-heading')?.focus({preventScroll:true}));},6000);return()=>clearTimeout(timer);},[processing]);
 function go(next:number){setDirection(next>step?1:-1);setStep(next);requestAnimationFrame(()=>{document.querySelector(`.${s.page}`)?.scrollTo({top:0});document.getElementById(next===4?"precautions-heading":next===3?"conditions-heading":next===2?"symptoms-heading":next===1?"mother-heading":"onboarding-heading")?.focus({preventScroll:true});});}
 function finish(){setProcessing(true);}
 return <>{booking?<BookingForm onBack={()=>screen==='booking'?navigate('/ruenfai/appointments'):setBooking(false)}/>:ready&&<ResultsSummary onBook={()=>setBooking(true)} animateFromProcessing={screen!=='results'}/>}{processing&&<main className={s.processing} aria-busy="true"><div role="status"><div className={s.processingArt}><Image src="/images/ruenfai/results/baby.png" alt="" width={308} height={280} priority/></div><h1>ระบบกำลังประมวลผล<span className={s.loadingDots} aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></h1></div></main>}<main hidden={ready||processing||booking} className={`${s.page} ${step>0?s.formPage:""}`}>{step>0&&<header className={s.quizHeader}><div className={s.flowHeaderRow}><button type="button" aria-label="กลับไปช่วงก่อนหน้า" onClick={()=>go(step-1)}><ChevronLeft size={18}/></button><div className={s.flowProgress} role="progressbar" aria-label={`ช่วงที่ ${step} จาก 4`} aria-valuemin={0} aria-valuemax={4} aria-valuenow={step}><span style={{width:`${step*25}%`}}/></div><small>{step} จาก 4</small></div></header>}<div className={`${s.content} ${step>0?s.quizContent:''}`} data-direction={direction}><div hidden={step!==0} className={direction>0?s.forward:s.backward}><div className={s.hero}><Image src="/images/ruenfai/avatar.png" alt="ภาพประกอบคุณแม่" width={474} height={474} priority/><h1 id="onboarding-heading" tabIndex={-1}>เริ่มต้นใช้งานเรือนไฟ</h1></div><div className={s.introduction}><p>เรือนไฟช่วยดูแลสุขภาพหลังคลอด โดยใช้ข้อมูลสุขภาพของคุณเพื่อประเมินความพร้อมและจัดนัดหมายกับหน่วยบริการที่คุณเลือก การใช้ข้อมูลเพื่อพัฒนาบริการเป็นทางเลือก และใช้เฉพาะข้อมูลที่ไม่ระบุตัวตน</p><section className={s.policyDetails} aria-label="รายละเอียดการใช้ข้อมูล">{information.map(item=><section key={item.title} className={s.policySection}><h3>{item.title}</h3><p>{item.body}</p></section>)}</section></div><section ref={consentSection} className={s.privacy} aria-label="ความยินยอมในการใช้ข้อมูล"><div className={s.consents}><Checkbox className={s.consentRow} checked={required} onChange={value=>{setRequired(value);setReady(false);}}><strong>ยินยอมให้ใช้ข้อมูลเพื่อรับบริการ <span className={s.qualifier}>(จำเป็น)</span></strong><small>สำหรับการคัดกรองและนัดหมาย</small></Checkbox><Checkbox className={s.consentRow} checked={optional} onChange={setOptional}><strong>ยินยอมให้ใช้ข้อมูลเพื่อพัฒนาบริการ <span className={s.qualifier}>(ไม่บังคับ)</span></strong><small>ใช้ข้อมูลที่ไม่ระบุตัวตน</small></Checkbox></div></section></div><div className={direction>0?s.forward:s.backward} hidden={step!==1}><MotherForm onBack={()=>go(0)} onSaved={()=>go(2)}/></div><div className={direction>0?s.forward:s.backward} hidden={step!==2}><SymptomsForm onBack={()=>go(1)} onSaved={()=>go(3)}/></div><div className={direction>0?s.forward:s.backward} hidden={step!==3}><SymptomsForm stage={3} onBack={()=>go(2)} onSaved={()=>go(4)}/></div><div className={direction>0?s.forward:s.backward} hidden={step!==4}><section hidden={ready}><SymptomsForm stage={4} onBack={()=>go(3)} onSaved={finish}/></section></div></div><footer className={s.footer}><button className={shared.doseConfirm} type={step===0?'button':'submit'} form={step===0?undefined:step===1?'mother-information':step===2?'mother-symptoms':step===3?'mother-conditions':'mother-precautions'} onClick={()=>{if(step!==0)return;if(required){go(1);return;}const section=consentSection.current;section?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});section?.querySelector<HTMLInputElement>('input[type=checkbox]')?.focus({preventScroll:true});}}>{step===0?(required?'ยอมรับและดำเนินการต่อ':'ไปเลือกความยินยอม'):step===4?'ดูผลการประเมิน':'ถัดไป'}</button></footer></main></>;
}
