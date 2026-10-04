'use client';
import {createContext,useContext,useState,type ReactNode} from 'react';
const Context=createContext<{date:string;setDate:(date:string)=>void;taken:string[];mark:(medicine:string,times:string[],date?:string)=>void}|null>(null);
export function MedicineProvider({children}:{children:ReactNode}){const [date,setDate]=useState('2026-10-24'),[taken,setTaken]=useState<string[]>([]);function mark(medicine:string,times:string[],day=date){setTaken(values=>Array.from(new Set([...values,...times.map(time=>`${day}:${medicine}:${time}`)])))}return <Context.Provider value={{date,setDate,taken,mark}}>{children}</Context.Provider>}
export function useMedicine(){const state=useContext(Context);if(!state)throw new Error('MedicineProvider missing');return state;}
