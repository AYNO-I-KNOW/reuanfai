'use client';
import {createContext,useContext,useEffect,useRef,useState,type CSSProperties,type ReactNode} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import s from './tab-motion.module.css';
import {isOnboarded} from './onboarding/onboarded';
export const routes=['/ruenfai','/ruenfai/appointments','/ruenfai/medicines','/ruenfai/journal'];
const Context=createContext<(target:string)=>void>(()=>{});
export const useTabNavigation=()=>useContext(Context);
type Phase='idle'|'out'|'homeOut'|'waiting'|'in'|'homeIn'|'detailIn'|'detailOut';
export default function TabMotion({children,navigation}:{children:ReactNode;navigation:ReactNode}){
 const path=usePathname(),router=useRouter();
 const [phase,setPhase]=useState<Phase>('idle'),[direction,setDirection]=useState(1);
 const [returnHome,setReturnHome]=useState(false);
 const pending=useRef<string|null>(null);
 const previous=useRef(path),busy=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current)},[]);
 // Prefetching before onboarding caches proxy.ts's redirect to /ruenfai/onboarding, which then outlives the cookie; re-checked on every path change.
 useEffect(()=>{if(isOnboarded())routes.forEach(route=>router.prefetch(route))},[router,path]);
 useEffect(()=>{
  if(previous.current===path)return;
  const oldPath=previous.current;const before=routes.indexOf(oldPath),after=routes.indexOf(path);previous.current=path;
  if(timer.current)clearTimeout(timer.current);
  const isChat=path.startsWith('/ruenfai/')&&!routes.includes(path),wasChat=oldPath.startsWith('/ruenfai/')&&!routes.includes(oldPath);
  const animate=(path.startsWith('/ruenfai')&&oldPath.startsWith('/ruenfai'))&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  timer.current=setTimeout(()=>{if(!animate){setPhase('idle');busy.current=false;return;}setDirection(isChat?1:wasChat?-1:after>before?1:-1);setReturnHome(path==='/ruenfai');setPhase(path==='/ruenfai'?'homeIn':isChat?'detailIn':'in');timer.current=setTimeout(()=>{setPhase('idle');busy.current=false;if(pending.current){const target=pending.current;pending.current=null;router.push(target)}},path==='/ruenfai'?540:280)},0);
 },[path,router]);
 function navigate(target:string){
  if(target===path)return;
  if(busy.current){pending.current=target;return;}
  const targetPath=target.split('?')[0];const before=routes.indexOf(path),after=routes.indexOf(targetPath);const chatTransition=path.startsWith('/ruenfai')&&targetPath.startsWith('/ruenfai')&&(before<0||after<0);
  if((!chatTransition&&(before<0||after<0))||window.matchMedia('(prefers-reduced-motion: reduce)').matches){router.push(target);return;}
  busy.current=true;setReturnHome(target==='/ruenfai');setDirection(after<0?1:before<0?-1:after>before?1:-1);setPhase(before<0?'detailOut':path==='/ruenfai'?'homeOut':'out');
  router.prefetch(target);
  // ponytail: a redirect back to the same pathname (proxy.ts) never fires the path effect, so release the 'waiting' phase after 1.5s
  timer.current=setTimeout(()=>{setPhase('waiting');router.push(target);timer.current=setTimeout(()=>{setPhase('idle');busy.current=false},1500)},path==='/ruenfai'?260:180);
 }
 const isTab=routes.includes(path);
 return <Context.Provider value={navigate}><div onClickCapture={event=>{if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;const anchor=(event.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');if(!anchor||anchor.target||anchor.hasAttribute('download')||anchor.getAttribute('aria-disabled')==='true')return;const url=new URL(anchor.href);if(url.origin!==window.location.origin||!url.pathname.startsWith('/ruenfai')||url.pathname===path)return;event.preventDefault();navigate(url.pathname+url.search+url.hash);}} className={`${s.shell} ${isTab?s.sharedBackground:path==='/ruenfai/chat'?s.chatBackground:s.detailBackground}`}><div className={`${s.body} ${s[phase]??''}`} data-tab-root={isTab?'true':undefined} data-home-return={returnHome?'true':undefined} data-phase={phase} style={{'--tab-direction':direction} as CSSProperties} inert={phase!=='idle'}>{children}</div>{navigation}</div></Context.Provider>
}
