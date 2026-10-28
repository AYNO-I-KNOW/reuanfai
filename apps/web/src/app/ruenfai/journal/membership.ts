"use client";
import {createDemoStore} from '@/design/demo-store';
export const journalMembership=createDemoStore('ruenfai-membership-v1',{joinedDate:''},(value):value is {joinedDate:string}=>typeof value==='object'&&value!==null&&'joinedDate' in value&&typeof value.joinedDate==='string');
export function ensureJournalMembership(){if(!journalMembership.snapshot().joinedDate)journalMembership.set({joinedDate:new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Bangkok'})});}
