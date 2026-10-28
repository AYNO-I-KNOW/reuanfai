'use client';
import SheetResize from './SheetResize';
import {useState, useRef, useEffect, type CSSProperties} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {useJournal} from './JournalState';
import {ChevronLeft, ChevronRight, X, Check} from 'lucide-react';
import '@/design/fonts.css';
import s from './page.module.css';
import {motherIdentity,avatarSource} from './mother-identity';
import PageHeader from './PageHeader';
import EmergencyAction from './EmergencyAction';
import {useMedicine} from './MedicineState';
import {useMedicines} from './medicines/useMedicines';
import {useCareDemo,motherProfile} from '@/design/care-demo';
import MedicineDetails from './medicines/MedicineDetails';
import JournalForm from './JournalForm';
import journalStyles from './journal/journal.module.css';
import SwipeDose from './SwipeDose';
import {useMotherAppointments} from './useMotherAppointments';
import AppointmentSheet from './AppointmentSheet';
import swipeStyle from './swipe-dose.module.css';
const monthNames=['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const days=['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'];
// Illustrative schedule: times are UI examples, not prescribing instructions.
const medicineRounds=['07:00','12:00','18:00'].map(time=>({title:'ทานยาเลือดงาม',detail:'รับประทานก่อนอาหาร วันละ 3 ครั้ง',kind:'medicine',art:'herbal-pouch',time,action:time+' น.'}));


export default function Page(){
const profile=motherProfile.use();
const identity=motherIdentity.use();
const medicines=useMedicines();
const care=useCareDemo();
const appointments=useMotherAppointments();
const [activeAppointment,setActiveAppointment]=useState<string|null>(null);
const doseDialog=useRef<HTMLDialogElement>(null);
const [activeDose,setActiveDose]=useState<(typeof medicineRounds)[number]&{date:string;medicine?:string}|null>(null);
const {taken,mark,unmark,setDate}=useMedicine();
const [restoringDoses,setRestoringDoses]=useState<string[]>([]);
useEffect(()=>{if(!restoringDoses.length)return;const timer=setTimeout(()=>setRestoringDoses([]),480);return()=>clearTimeout(timer)},[restoringDoses]);
const [undoDoses,setUndoDoses]=useState<{medicine:string;time:string;date:string}[]>([]);
const toastTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
useEffect(()=>()=>{if(toastTimer.current)clearTimeout(toastTimer.current)},[]);
function completeSwipe(medicine:string,time:string,date:string){mark(medicine,[time],date);setUndoDoses(values=>[...values,{medicine,time,date}]);if(toastTimer.current)clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setUndoDoses([]),8000);}
function undoSwipe(){setRestoringDoses(undoDoses.map(dose=>`${dose.date}:${dose.medicine}:${dose.time}`));undoDoses.forEach(dose=>unmark(dose.medicine,[dose.time],dose.date));setUndoDoses([]);if(toastTimer.current)clearTimeout(toastTimer.current);}

const takenDoses=taken.filter(value=>value.includes(':ยาเลือดงาม:')).map(value=>value.replace(':ยาเลือดงาม:',':'));
const [doseClosing,setDoseClosing]=useState(false);
const closeDose=()=>{if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){doseDialog.current?.close();}else setDoseClosing(true);};

const {entries}=useJournal();
const journalDialog=useRef<HTMLDialogElement>(null);
const [journalDate,setJournalDate]=useState('');
const [journalClosing,setJournalClosing]=useState(false);
const closeJournal=()=>{if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)journalDialog.current?.close();else setJournalClosing(true);};
const [selected,setSelected]=useState(24);
const [today,setToday]=useState('');
const deliveryDay=Date.parse(`${profile.deliveryDate}T00:00:00Z`);
const validDelivery=/^\d{4}-\d{2}-\d{2}$/.test(profile.deliveryDate)&&Number.isFinite(deliveryDay)&&new Date(deliveryDay).toISOString().slice(0,10)===profile.deliveryDate;
const daysSinceBirth=validDelivery&&today?Math.floor((Date.parse(`${today}T00:00:00Z`)-deliveryDay)/86400000):-1;
const greetingSubtitle=daysSinceBirth===0?'วันนี้เป็นวันคลอด':daysSinceBirth>0?`หลังคลอดมา ${daysSinceBirth.toLocaleString('th-TH')} วัน`:'ดูแลคุณแม่และลูกน้อยในทุกวัน';
useEffect(()=>{const update=()=>{const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());setToday(['year','month','day'].map(type=>parts.find(p=>p.type===type)?.value).join('-'));};update();const timer=setInterval(update,60000);return()=>clearInterval(timer);},[]);
const isToday=(date:Date)=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`===today;
const [mode,setMode]=useState(1);
const expanded=mode===2;
const [monthSelected,setMonthSelected]=useState(9);
const [yearSelected,setYearSelected]=useState(2026);
const [monthCursor,setMonthCursor]=useState(9);
const [monthDirection,setMonthDirection]=useState(1);
function changeMonth(direction:number){setMonthDirection(direction);setMonthCursor(v=>v+direction);}
const monthDate=new Date(2026,monthCursor,1);
const month=monthDate.getMonth();const year=monthDate.getFullYear();
const calendar=useRef<HTMLElement>(null);
const [calendarHeight,setCalendarHeight]=useState(338);
const [calendarTop,setCalendarTop]=useState(96);
const swipe=useRef<{x:number;y:number}|null>(null);
const [monthDrag,setMonthDrag]=useState(0);
const [monthDragging,setMonthDragging]=useState(false);
const weekSwipe=useRef<{x:number;y:number}|null>(null);
const [weekDrag,setWeekDrag]=useState(0);
const [weekDragging,setWeekDragging]=useState(false);
const [weekDirection,setWeekDirection]=useState(0);
useEffect(()=>{const el=calendar.current;if(!el)return;const update=()=>setCalendarHeight(el.offsetHeight);const observer=new ResizeObserver(update);observer.observe(el);update();return()=>observer.disconnect();},[]);
const [drag,setDrag]=useState(0);
const start=useRef<{y:number;time:number;top:number}|null>(null);
const sheet=useRef<HTMLElement>(null);
const home=useRef<HTMLDivElement>(null);
const [geometry,setGeometry]=useState({height:812,initial:168});
const velocity=useRef({y:0,time:0,speed:0});
useEffect(()=>{const el=home.current;if(!el)return;const week=el.querySelector<HTMLElement>(`.${s.week}`);const header=el.querySelector<HTMLElement>(`.${s.homeHeader}`);const update=()=>setGeometry({height:el.clientHeight,initial:week?Math.round(week.getBoundingClientRect().bottom-el.getBoundingClientRect().top-10):156+parseFloat(getComputedStyle(el).paddingTop)});const observer=new ResizeObserver(update);observer.observe(el);if(week)observer.observe(week);if(header)observer.observe(header);update();return()=>observer.disconnect();},[]);
const [dragging,setDragging]=useState(false);
const moved=useRef(false);
const list=useRef<HTMLDivElement>(null);
const listGesture=useRef<{y:number;x:number;top:number;dragging:boolean}|null>(null);
const listDragged=useRef(false);
const sheetHeader=useRef<HTMLButtonElement>(null);
const [peekHeight,setPeekHeight]=useState(257);
useEffect(()=>{const first=list.current?.querySelector('article');const header=sheetHeader.current;if(!first||!header)return;const measure=()=>setPeekHeight(Math.ceil(header.getBoundingClientRect().height+first.getBoundingClientRect().height*1.5+10));const observer=new ResizeObserver(measure);observer.observe(first);observer.observe(header);measure();return()=>observer.disconnect();},[]);
const weekStart=selected-new Date(yearSelected,monthSelected,selected).getDay();
const weekDates=days.map((_,i)=>new Date(yearSelected,monthSelected,weekStart+i));
useEffect(()=>{const header=home.current?.querySelector<HTMLElement>(`.${s.homeHeader}`);if(!header)return;const measure=()=>setCalendarTop(header.offsetTop+header.offsetHeight+20);const observer=new ResizeObserver(measure);observer.observe(header);measure();return()=>observer.disconnect()},[]);
const monthsTop=calendarTop;
const lowTop=Math.max(geometry.initial+80,Math.min(monthsTop+calendarHeight+16,geometry.height-peekHeight));
const stops=[0,geometry.initial,lowTop];
const baseTop=stops[2-mode];
const progress=Math.max(0,Math.min(1,(baseTop+drag-geometry.initial)/Math.max(1,lowTop-geometry.initial)));
const selectedDate=`${yearSelected}-${String(monthSelected+1).padStart(2,'0')}-${String(selected).padStart(2,'0')}`;
useEffect(()=>{setDate(selectedDate)},[selectedDate,setDate]);
const [dayMotion,setDayMotion]=useState<'idle'|'out'|'in'>('idle');
const [dayDirection,setDayDirection]=useState(1);
const pendingDate=useRef(new Date(2026,9,24));
const dayTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
useEffect(()=>()=>{if(dayTimer.current)clearTimeout(dayTimer.current)},[]);
function selectDate(date:Date,direction=0){
 if(dayTimer.current)clearTimeout(dayTimer.current);
 pendingDate.current=date;
 const difference=date.getTime()-new Date(yearSelected,monthSelected,selected).getTime();
 if(!difference){setDayMotion('idle');return;}
 const apply=()=>{setSelected(date.getDate());setMonthSelected(date.getMonth());setYearSelected(date.getFullYear());setMonthCursor((date.getFullYear()-2026)*12+date.getMonth());setWeekDirection(direction);list.current?.scrollTo({top:0});};
 if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){apply();setDayMotion('idle');return;}
 setDayDirection(difference>0?1:-1);setDayMotion('out');
 dayTimer.current=setTimeout(()=>{apply();setDayMotion('in');dayTimer.current=setTimeout(()=>setDayMotion('idle'),280)},180);
}
function changeWeek(direction:number){const target=pendingDate.current;selectDate(new Date(target.getFullYear(),target.getMonth(),target.getDate()+7*direction),direction);}
const endWeekSwipe=()=>{weekSwipe.current=null;setWeekDrag(0);setWeekDragging(false);};
const dailyJournal=entries.find(entry=>entry.date===selectedDate);
const needsJournal=!dailyJournal;
const prescriptions=care.prescriptions.filter(p=>p.patient==='M01');
const prescribedNames=new Set(prescriptions.map(p=>p.medicine));
const extraRounds=medicines.filter(m=>prescribedNames.has(m.name)).flatMap(m=>m.times.map(time=>({title:`ทาน${m.name}`,detail:m.instruction||'',kind:'medicine',art:'herbal-pouch',time,action:time+' น.',medicine:m.name})));
const bookingActivities=appointments.filter(a=>a.date===selectedDate).map(a=>({title:a.service,detail:`${a.time} น. · ${a.status}`,kind:'appointment',art:a.art,time:a.time,action:'ดูรายละเอียดนัด',medicine:undefined,appointmentId:a.id}));
const dayActivities=[...(selectedDate.startsWith('2026-10-')&&!prescribedNames.has('ยาเลือดงาม')?medicineRounds.map(a=>({...a,medicine:'ยาเลือดงาม',appointmentId:undefined})):[]),...extraRounds.map(a=>({...a,appointmentId:undefined})),...bookingActivities].filter(a=>a.kind!=='medicine'||!taken.includes(`${selectedDate}:${a.medicine}:${a.time}`)).sort((a,b)=>a.time.localeCompare(b.time));
function settle(){
const top=baseTop+drag;
let index=stops.reduce((best,value,i)=>Math.abs(value-top)<Math.abs(stops[best]-top)?i:best,2-mode);
if(Math.abs(velocity.current.speed)>.5)index=Math.max(0,Math.min(2,2-mode+(velocity.current.speed>0?1:-1)));
setMode(2-index);setDragging(false);setDrag(0);
}
return <main className={s.canvas}>{undoDoses.length>0&&<div className={swipeStyle.toast} role="status"><Check size={20} aria-hidden="true"/><span>{undoDoses.length===1?`บันทึกว่าทานยาแล้ว · ${undoDoses[0].time} น.`:`บันทึกว่าทานยาแล้ว ${undoDoses.length} รอบ`}</span><button type="button" onClick={undoSwipe}>เลิกทำ</button></div>}<div ref={home} data-home-canvas style={{'--calendar-progress':progress} as CSSProperties} className={`${s.home} ${dragging?s.dragging:''}`}><div className={s.homeHeader} data-home-header><PageHeader profileHref="/ruenfai/profile" title={identity.nickname.trim()?`สวัสดี คุณแม่${identity.nickname.trim()}`:"สวัสดี คุณแม่"} subtitle={greetingSubtitle} leading={<Image src={avatarSource(identity.avatarId)} alt="" width={51} height={51}/>} action={<EmergencyAction subtle/>}/></div><nav inert={mode!==1} aria-hidden={mode!==1} className={s.week} aria-label="เลือกวันในสัปดาห์" onPointerDown={e=>{moved.current=false;weekSwipe.current={x:e.clientX,y:e.clientY};}} onPointerMove={e=>{const origin=weekSwipe.current;if(!origin)return;const x=e.clientX-origin.x;const y=e.clientY-origin.y;if(Math.abs(x)>8&&Math.abs(x)>Math.abs(y)){moved.current=true;setWeekDragging(true);e.currentTarget.setPointerCapture(e.pointerId);setWeekDrag(x);}}} onPointerUp={e=>{const origin=weekSwipe.current;if(!origin)return;const x=e.clientX-origin.x;const y=e.clientY-origin.y;if(Math.abs(x)>35&&Math.abs(x)>Math.abs(y)*1.2){moved.current=true;changeWeek(x<0?1:-1);}endWeekSwipe();}} onPointerCancel={endWeekSwipe}><div key={weekDates[0].getTime()} style={{transform:`translateX(${weekDrag}px)`,'--week-enter':weekDirection>0?'100%':'-100%'} as CSSProperties} className={`${s.weekTrack} ${weekDirection!==0?s.weekSlide:''} ${weekDragging?s.weekDragging:''}`}>{days.map((day,i)=><button key={day} onClick={()=>{if(moved.current){moved.current=false;return;}selectDate(weekDates[i]);}} aria-pressed={selected===weekDates[i].getDate()&&monthSelected===weekDates[i].getMonth()} aria-current={isToday(weekDates[i])?'date':undefined} aria-label={`${day} วันที่ ${weekDates[i].getDate()}${isToday(weekDates[i])?' วันนี้':''}`}><span>{day}</span><span className={`${s.date} ${isToday(weekDates[i])?s.today:''}`}>{selected===weekDates[i].getDate()&&monthSelected===weekDates[i].getMonth()&&<Image src="/images/ruenfai/selected.svg" alt="" width={39} height={39}/>}<b>{weekDates[i].getDate()}</b></span></button>)}</div></nav><div aria-hidden={progress===0} inert={mode!==0} style={{'--peek-height':`${peekHeight}px`,top:`${monthsTop}px`,height:`${Math.max(0,lowTop-monthsTop-16)}px`} as CSSProperties} className={s.months} aria-label="ปฏิทินรายเดือน"><section ref={calendar} className={s.month} onPointerDown={e=>{moved.current=false;swipe.current={x:e.clientX,y:e.clientY};}} onPointerMove={e=>{if(!swipe.current)return;const x=e.clientX-swipe.current.x;const y=e.clientY-swipe.current.y;if(Math.abs(x)>8&&Math.abs(x)>Math.abs(y)){moved.current=true;setMonthDragging(true);e.currentTarget.setPointerCapture(e.pointerId);setMonthDrag(x);}}} onPointerUp={e=>{if(!swipe.current)return;const x=e.clientX-swipe.current.x;const y=e.clientY-swipe.current.y;if(Math.abs(x)>35&&Math.abs(x)>Math.abs(y)*1.2){changeMonth(x<0?1:-1);moved.current=true;}swipe.current=null;setMonthDrag(0);setMonthDragging(false);}} onPointerCancel={()=>{swipe.current=null;setMonthDrag(0);setMonthDragging(false);}}><div className={s.monthHeading}><h2>{monthNames[month]} {year+543}</h2><div><button aria-label="เดือนก่อน" onClick={()=>changeMonth(-1)}><ChevronLeft size={20} strokeWidth={1.8} aria-hidden="true"/></button><button aria-label="เดือนถัดไป" onClick={()=>changeMonth(1)}><ChevronRight size={20} strokeWidth={1.8} aria-hidden="true"/></button></div></div><div key={monthCursor} style={{transform:`translateX(${monthDrag}px)`,'--month-enter':monthDirection>0?'100%':'-100%'} as CSSProperties} className={`${s.monthGrid} ${monthDragging?s.monthDragging:''}`}>{days.map(day=><span key={day} className={s.weekLabel}>{day}</span>)}{Array.from({length:new Date(year,month,1).getDay()},(_,i)=><span key={`empty-${i}`}/>)}{Array.from({length:new Date(year,month+1,0).getDate()},(_,i)=><button key={i} className={isToday(new Date(year,month,i+1))?s.today:undefined} aria-current={isToday(new Date(year,month,i+1))?'date':undefined} aria-label={`${i+1} ${monthNames[month]} ${year+543}${isToday(new Date(year,month,i+1))?' วันนี้':''}`} aria-pressed={monthSelected===month&&yearSelected===year&&selected===i+1} onClick={()=>{if(moved.current){moved.current=false;return;}selectDate(new Date(year,month,i+1));}}>{i+1}{[5,12,24,26].includes(i+1)&&<i/>}</button>)}</div></section></div><section ref={sheet} data-home-sheet style={{top:`${baseTop+drag}px`,'--peek-height':`${peekHeight}px`,'--day-direction':dayDirection} as CSSProperties} className={`${s.sheet} ${expanded?s.expanded:mode===0?s.calendarOpen:''} ${dragging?s.dragging:''}`} aria-labelledby="upcoming"><button ref={sheetHeader} className={s.sheetHeader} aria-expanded={expanded} aria-label={expanded?'ย่อรายการกิจกรรม':mode===0?'กลับไปกิจกรรม':'ขยายรายการกิจกรรม'}
onPointerDown={e=>{const renderedTop=sheet.current?parseFloat(getComputedStyle(sheet.current).top):baseTop;start.current={y:e.clientY,time:performance.now(),top:renderedTop};setDrag(renderedTop-baseTop);velocity.current={y:e.clientY,time:performance.now(),speed:0};setDragging(true);moved.current=false;e.currentTarget.setPointerCapture(e.pointerId);}}
onPointerMove={e=>{if(start.current===null)return;const delta=e.clientY-start.current.y;if(Math.abs(delta)>5)moved.current=true;const now=performance.now();velocity.current={y:e.clientY,time:now,speed:(e.clientY-velocity.current.y)/Math.max(1,now-velocity.current.time)};const maxTop=lowTop;setDrag(Math.max(0,Math.min(maxTop,start.current.top+delta))-baseTop);}}
onPointerUp={()=>{if(start.current===null)return;if(performance.now()-velocity.current.time>100)velocity.current.speed=0;settle();start.current=null;}}
onPointerCancel={()=>{start.current=null;setDragging(false);setDrag(0);}}
onClick={()=>{if(!moved.current)setMode(v=>v===1?2:1);}}
><span className={s.handle} aria-hidden="true"/><h2 id="upcoming" className={`${s.dayHeading} ${dayMotion==='out'?s.dayOut:dayMotion==='in'?s.dayIn:''}`}>กิจกรรมวันที่ {selected} {monthNames[monthSelected]}</h2></button><div className={s.scrollArea} ref={list} onPointerDown={event=>{if(event.pointerType!=='mouse'||event.button!==0)return;listDragged.current=false;listGesture.current={y:event.clientY,x:event.clientX,top:event.currentTarget.scrollTop,dragging:false};}} onPointerMove={event=>{const origin=listGesture.current;if(!origin)return;const dx=event.clientX-origin.x,dy=event.clientY-origin.y;if(!origin.dragging&&Math.abs(dx)>8&&Math.abs(dx)>Math.abs(dy)){listGesture.current=null;return;}if(!origin.dragging&&Math.abs(dy)>8&&Math.abs(dy)>Math.abs(dx)*1.25){origin.dragging=true;listDragged.current=true;event.currentTarget.setPointerCapture(event.pointerId);}if(origin.dragging){event.preventDefault();event.currentTarget.scrollTop=origin.top-dy;}}} onPointerUp={()=>{listGesture.current=null;}} onPointerCancel={()=>{listGesture.current=null;}} onClickCapture={event=>{if(listDragged.current){event.preventDefault();event.stopPropagation();listDragged.current=false;}}} onDragStart={event=>event.preventDefault()}><div className={`${s.dayContent} ${dayMotion==='out'?s.dayOut:dayMotion==='in'?s.dayIn:''}`} inert={dayMotion!=='idle'}>{<ol className={s.timeline}>{dailyJournal&&<li><Link href="/ruenfai/journal" className={`${s.activity} ${s.dailyCardLink}`}><div className={s.art}><Image src="/images/ruenfai/journal-empty.svg" alt="" width={64} height={64}/></div><div className={s.description}><h3>บันทึกประจำวัน</h3><p>{dailyJournal.mood}</p><span className={s.pill}><Check size={14} aria-hidden="true"/>บันทึกแล้ว</span></div></Link></li>}{needsJournal&&<li><button type="button" className={`${s.activity} ${s.dailyCardLink} ${s.journalTaskButton}`} aria-haspopup="dialog" onClick={()=>{setJournalDate(selectedDate);setJournalClosing(false);journalDialog.current?.showModal();}}><div className={s.art}><Image src="/images/ruenfai/journal-empty.svg" alt="" width={64} height={64}/></div><div className={s.description}><h3>บันทึกประจำวัน</h3><p>เก็บความรู้สึกและเรื่องราวของวันนี้</p><span className={s.pill}>ยังไม่ได้บันทึก<ChevronRight size={14} aria-hidden="true"/></span></div></button></li>}{dayActivities.map(a=><li key={`${selectedDate}:${a.kind}:${a.medicine||a.title}:${a.time}`}><SwipeDose restoring={restoringDoses.includes(`${selectedDate}:${a.medicine}:${a.time}`)} enabled={a.kind==='medicine'} label={`${a.title} ${a.time} น.`} onComplete={()=>completeSwipe(a.medicine||'ยาเลือดงาม',a.time,selectedDate)}><Link href={a.kind==='medicine'?'#dose':'/ruenfai/appointments'} onClick={e=>{if(a.kind==='medicine'){e.preventDefault();setActiveDose({...a,date:selectedDate});setDoseClosing(false);doseDialog.current?.showModal();}else{e.preventDefault();setActiveAppointment(a.appointmentId||null);}}} className={`${s.activity} ${s.dailyCardLink}`}><div className={s.art}><Image src={a.kind==='medicine'?'/images/ruenfai/medicine-base.svg':`/images/ruenfai/services/${a.art}-base.svg`} alt="" width={64} height={64}/><Image className={s.dailyIllustration} src={a.kind==='medicine'?'/images/ruenfai/herbal-pouch.svg':`/images/ruenfai/services/${a.art}.svg`} alt="" width={64} height={64}/></div><div className={s.description}><h3>{a.title}</h3><p>{a.detail}</p>{a.kind==='medicine'?<time className={s.pill} dateTime={`${selectedDate}T${a.time}`}>{takenDoses.includes(`${selectedDate}:${a.time}`)?<>ทานยาแล้ว<Check size={14} aria-hidden="true"/></>:<>{a.action}<ChevronRight size={14} aria-hidden="true"/></>}</time>:<span className={s.pill}>{a.action}<ChevronRight size={14} aria-hidden="true"/></span>}</div></Link></SwipeDose></li>)}</ol>}{dayActivities.length===0&&!needsJournal&&<div className={s.dayComplete} role="status"><Image src="/images/ruenfai/day-rest.svg" alt="" width={128} height={128}/><h3>วันนี้ไม่มีรายการที่ต้องทำแล้ว</h3><p>พักสักนิด ให้เวลากับตัวเอง<br/>และช่วงเวลาดี ๆ กับลูกน้อยนะคะ</p></div>}</div></div></section></div><dialog ref={doseDialog} className={s.medicineDialog} aria-labelledby="dose-title" onCancel={e=>{e.preventDefault();closeDose();}} onClick={e=>{if(e.currentTarget===e.target)closeDose();}}><section className={`${s.medicineSheet} ${doseClosing?s.medicineClosing:''}`} onAnimationEnd={e=>{if(e.target===e.currentTarget&&doseClosing){doseDialog.current?.close();setDoseClosing(false);}}}><SheetResize onDismiss={closeDose}/><header className={`${s.medicineSheetHeader} ${s.medicineIdentityHeader}`}><div className={s.art}><Image src="/images/ruenfai/medicine-base.svg" width={64} height={64} alt=""/><Image className={s.dailyIllustration} src="/images/ruenfai/herbal-pouch.svg" width={64} height={64} alt=""/></div><div className={s.medicineIdentityText}><h2 id="dose-title">{activeDose?.title}</h2><span className={s.pill}>รอบ {activeDose?.action}</span></div><button aria-label="ปิดกิจกรรมทานยา" onClick={closeDose}><X size={20}/></button></header><div className={s.medicineSheetBody}><MedicineDetails medicine={medicines.find(m=>m.name===activeDose?.medicine)||medicines[0]}/><button className={s.doseConfirm} disabled={!!activeDose&&taken.includes(`${activeDose.date}:${activeDose.medicine||'ยาเลือดงาม'}:${activeDose.time}`)} onClick={()=>{if(activeDose)mark(activeDose.medicine||'ยาเลือดงาม',[activeDose.time],activeDose.date);closeDose();}}><Check size={20}/>{activeDose&&taken.includes(`${activeDose.date}:${activeDose.medicine||'ยาเลือดงาม'}:${activeDose.time}`)?'บันทึกว่าทานยาแล้ว':'ทานยารอบนี้แล้ว'}</button></div></section></dialog><dialog ref={journalDialog} className={s.medicineDialog} aria-labelledby="home-journal-title" onCancel={e=>{e.preventDefault();closeJournal();}} onClick={e=>{if(e.target===e.currentTarget)closeJournal();}}><section className={`${s.medicineSheet} ${journalStyles.composerSheet} ${journalClosing?s.medicineClosing:''}`} onAnimationEnd={e=>{if(e.target===e.currentTarget&&journalClosing){journalDialog.current?.close();setJournalClosing(false);}}}><SheetResize onDismiss={closeJournal}/><header className={s.medicineSheetHeader}><h2 id="home-journal-title">{entries.some(entry=>entry.date===journalDate)?'แก้ไขบันทึกประจำวัน':'เขียนบันทึกประจำวัน'}</h2><button aria-label="ปิดสมุดบันทึก" onClick={closeJournal}><X size={20}/></button></header><div className={s.medicineSheetBody}><JournalForm key={journalDate+String(journalClosing)} date={journalDate} onSaved={closeJournal}/></div></section></dialog><AppointmentSheet appointment={appointments.find(a=>a.id===activeAppointment)||null} onClose={()=>setActiveAppointment(null)}/></main>}
