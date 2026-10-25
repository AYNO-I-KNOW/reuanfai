'use client';
import {createContext,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {Check} from 'lucide-react';
import s from './swipe-dose.module.css';
const Context=createContext<(message:string)=>void>(()=>{});
export const useToast=()=>useContext(Context);
export default function ToastProvider({children}:{children:ReactNode}){
 const [message,setMessage]=useState('');const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current)},[]);
 const show=(text:string)=>{if(timer.current)clearTimeout(timer.current);setMessage(text);timer.current=setTimeout(()=>setMessage(''),4000)};
 return <Context.Provider value={show}>{children}{message&&<div className={s.toast} role="status"><Check size={20} aria-hidden="true"/><span>{message}</span></div>}</Context.Provider>
}
