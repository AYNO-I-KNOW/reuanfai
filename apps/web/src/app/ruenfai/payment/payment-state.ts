'use client';
import {useSyncExternalStore} from 'react';
type Receipt={appointment:string;paidAt:string};
const key='ruenfai-payment-ui-v1',eventName='ruenfai-payment-ui-change';
let fallback='[]';
function snapshot(){try{return sessionStorage.getItem(key)??fallback}catch{return fallback}}
function receipts(value:string):Receipt[]{try{const parsed:unknown=JSON.parse(value);return Array.isArray(parsed)?parsed.filter((item):item is Receipt=>!!item&&typeof item.appointment==='string'&&typeof item.paidAt==='string'&&!Number.isNaN(Date.parse(item.paidAt))):[]}catch{return []}}
function subscribe(listener:()=>void){window.addEventListener(eventName,listener);window.addEventListener('storage',listener);return()=>{window.removeEventListener(eventName,listener);window.removeEventListener('storage',listener)}}
export function usePayments(){const value=useSyncExternalStore(subscribe,snapshot,()=> '[]');return receipts(value)}
export function recordPayment(appointment:string,date:Date){if(!appointment)return;const values=receipts(snapshot());if(values.some(receipt=>receipt.appointment===appointment))return;fallback=JSON.stringify([...values,{appointment,paidAt:date.toISOString()}]);try{sessionStorage.setItem(key,fallback)}catch{}window.dispatchEvent(new Event(eventName))}
