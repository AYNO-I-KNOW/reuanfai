'use client';
import {createDemoStore} from '@/design/demo-store';
export type DemoReview={id:string;patient:string;date:string;service:string;doctor:string;scores:number[];comment:string;topic:string;topics?:string[];issue?:string};
export function validReview(value:unknown):value is DemoReview{
 if(!value||typeof value!=='object')return false;
 const v=value as Record<string,unknown>;
 return ['id','patient','date','service','doctor','comment','topic'].every(k=>typeof v[k]==='string')&&
  typeof v.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v.date)&&Number.isFinite(Date.parse(v.date))&&new Date(v.date).toISOString().slice(0,10)===v.date&&
  Array.isArray(v.scores)&&v.scores.length===4&&v.scores.every(n=>Number.isInteger(n)&&n>=1&&n<=5)&&
  (v.topics===undefined||(Array.isArray(v.topics)&&v.topics.every(t=>typeof t==='string')))&&
  (v.issue===undefined||typeof v.issue==='string');
}
const reviews=createDemoStore<DemoReview[]>('reuanfai-demo-reviews-v1',[],(value):value is DemoReview[]=>Array.isArray(value)&&value.every(validReview));
export const useDemoReviews=reviews.use;
export function saveDemoReview(review:DemoReview){reviews.set(previous=>[review,...previous.filter(item=>item.id!==review.id)]);}
