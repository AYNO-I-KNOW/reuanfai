'use client';
import {createDemoStore} from '@/design/demo-store';
const initial={name:'',conditions:'',allergies:'',contactName:'',relationship:'',medicines:'',herbAllergy:''};
export const profileDetails=createDemoStore('ruenfai-profile-details-v1',initial,(value):value is typeof initial=>typeof value==='object'&&value!==null&&Object.keys(initial).every(key=>typeof (value as Record<string,unknown>)[key]==='string'));
