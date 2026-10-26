'use client';
import {createContext,useContext,useEffect,useRef,useState,type CSSProperties,type ReactNode} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import s from './tab-motion.module.css';
export const routes=['/ruenfai','/ruenfai/appointments','/ruenfai/medicines','/ruenfai/journal'];
const Context=createContext<(target:string)=>void>(()=>{});
export const useTabNavigation=()=>useContext(Context);
type Phase='idle'|'out'|'homeOut'|'waiting'|'in'|'homeIn'|'detailIn'|'detailOut';
export default function TabMotion({children,navigation}:{children:ReactNode;navigation:ReactNode}){
 const path=usePathname(),router=useRouter();
 const [phase,setPhase]=useState<Phase>('idle'),[direction,setDirection]=useState(1);
 const [returnHome,setReturnHome]=useState(false);
 const previous=useRef(path),busy=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current)},[]);
 useEffect(()=>{routes.forEach(route=>router.prefetch(route))},[router]);
 useEffect(()=>{
  if(previous.current===path)return;
  const oldPath=previous.current;const before=routes.indexOf(oldPath),after=routes.indexOf(path);previous.current=path;
  if(timer.current)clearTimeout(timer.current);
  const isChat=path==='/ruenfai/chat',wasChat=oldPath==='/ruenfai/chat';
  const animate=((before>=0&&after>=0)||(before>=0&&isChat)||(wasChat&&after>=0))&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  timer.current=setTimeout(()=>{if(!animate){setPhase('idle');busy.current=false;return;}setDirection(isChat?1:wasChat?-1:after>before?1:-1);setReturnHome(path==='/ruenfai');setPhase(path==='/ruenfai'?'homeIn':isChat?'detailIn':'in');timer.current=setTimeout(()=>{setPhase('idle');busy.current=false},path==='/ruenfai'?540:280)},0);
 },[path]);
 function navigate(target:string){
  if(target===path||busy.current)return;
  const targetPath=target.split('?')[0];const before=routes.indexOf(path),after=routes.indexOf(targetPath);const chatTransition=(path==='/ruenfai/chat'&&after>=0)||(before>=0&&targetPath==='/ruenfai/chat');
  if((!chatTransition&&(before<0||after<0))||window.matchMedia('(prefers-reduced-motion: reduce)').matches){router.push(target);return;}
  busy.current=true;setReturnHome(target==='/ruenfai');setDirection(targetPath==='/ruenfai/chat'?1:path==='/ruenfai/chat'?-1:after>before?1:-1);setPhase(path==='/ruenfai/chat'?'detailOut':path==='/ruenfai'?'homeOut':'out');
  router.prefetch(target);
  timer.current=setTimeout(()=>{setPhase('waiting');router.push(target)},path==='/ruenfai'?260:180);
 }
 const isTab=routes.includes(path);
 return <Context.Provider value={navigate}><div className={`${s.shell} ${isTab?s.sharedBackground:path==='/ruenfai/chat'?s.chatBackground:''}`}><div className={`${s.body} ${s[phase]??''}`} data-tab-root={isTab?'true':undefined} data-home-return={returnHome?'true':undefined} data-phase={phase} style={{'--tab-direction':direction} as CSSProperties} inert={phase!=='idle'}>{children}</div>{navigation}</div></Context.Provider>
}
