'use client';
import {createDemoStore} from './demo-store';
export type Journey={care:boolean;aggregate:boolean;referralLocked:boolean;contacted:boolean;shares:string[];deleted:boolean;checkins:Record<string,{outcome:'unchanged'|'awaiting_eval'|'referred';pain:number;date:string}>;medMode:'per_dose'|'daily';adverse:string};
const initial:Journey={care:false,aggregate:false,referralLocked:false,contacted:false,shares:[],deleted:false,checkins:{},medMode:'per_dose',adverse:''};
export function validJourney(v:unknown):v is Journey{
 if(!v||typeof v!=='object')return false;const x=v as Record<string,unknown>;
 return ['care','aggregate','referralLocked','contacted','deleted'].every(k=>typeof x[k]==='boolean')&&Array.isArray(x.shares)&&x.shares.every(s=>typeof s==='string')&&['per_dose','daily'].includes(String(x.medMode))&&typeof x.adverse==='string'&&!!x.checkins&&typeof x.checkins==='object'&&!Array.isArray(x.checkins)&&Object.values(x.checkins).every(c=>!!c&&typeof c==='object'&&['unchanged','awaiting_eval','referred'].includes(c.outcome)&&Number.isInteger(c.pain)&&c.pain>=0&&c.pain<=10&&typeof c.date==='string');
}
export const careJourney=createDemoStore<Journey>('reuanfai-care-journey-v1',initial,validJourney);
