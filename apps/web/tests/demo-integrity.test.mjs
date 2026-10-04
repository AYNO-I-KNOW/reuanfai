import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
const require=createRequire(new URL('../package.json',import.meta.url)),ts=require('typescript');
const root=fileURLToPath(new URL('../src/',import.meta.url));
function harness({denied=false,stored={}}={}){
 const values=new Map(Object.entries(stored)),listeners=new Map(),modules=new Map();
 const window={localStorage:{getItem:k=>{if(denied)throw Error('SecurityError');return values.get(k)??null;},setItem:(k,v)=>{if(denied)throw Error('QuotaExceededError');values.set(k,v);}},addEventListener:(k,f)=>{listeners.set(k,[...(listeners.get(k)||[]),f]);},removeEventListener:()=>{},dispatchEvent:e=>(listeners.get(e.type)||[]).forEach(f=>f(e))};
 function load(file){const filename=path.resolve(root,file.endsWith('.ts')?file:file+'.ts');if(modules.has(filename))return modules.get(filename);const exports={};modules.set(filename,exports);const source=ts.transpileModule(readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;vm.runInNewContext(source,{exports,window,sessionStorage:{getItem:()=>null},Event,crypto:{randomUUID},console,require:specifier=>specifier==='react'?{useSyncExternalStore:(_subscribe,snapshot)=>snapshot()}:load(specifier.startsWith('@/')?specifier.slice(2):path.relative(root,path.resolve(path.dirname(filename),specifier)))});return exports;}
 return {load,values,window};
}
test('review cache rejects malformed shapes and ratings without crashing',()=>{
 for(const value of ['null','{}','[{"id":"bad"}]','not json']){const h=harness({stored:{'reuanfai-demo-reviews-v1':value}});assert.equal(h.load('app/ruenfai/review/demo-reviews').useDemoReviews().length,0);}
 const {validReview}=harness().load('app/ruenfai/review/demo-reviews');
 const review={id:'r',patient:'M01',date:'2026-10-04',service:'นวดไทย',doctor:'test',scores:[5,4,3,5],comment:'ok',topic:'โดยรวม'};
 assert(validReview(review));assert(!validReview({...review,scores:[5,4,3,1.5]}));assert(!validReview({...review,scores:[5]}));
});
test('denied storage keeps review updates usable in memory',()=>{
 const {saveDemoReview,useDemoReviews}=harness({denied:true}).load('app/ruenfai/review/demo-reviews');
 saveDemoReview({id:'r',patient:'M01',date:'2026-10-04',service:'นวดไทย',doctor:'test',scores:[5,4,3,5],comment:'ok',topic:'โดยรวม'});
 assert.equal(useDemoReviews().length,1);
});
test('booking is shared with clinic, persists and uses the actual selected month',()=>{
 const h=harness(),care=h.load('design/care-demo');const before=care.careDemo.snapshot().appointments.length;
 assert(care.saveBooking({unit:'unit',services:['นวดไทย'],date:'2099-10-05',time:'10:00',rights:'บัตรทอง'}));
 const state=care.careDemo.snapshot();assert.equal(state.bookings.length,1);assert.equal(state.appointments.length,before+1);assert.equal(state.appointments.at(-1).month,9);assert.equal(state.appointments.at(-1).name,'M01');
 const restored=harness({stored:Object.fromEntries(h.values)}).load('design/care-demo').careDemo.snapshot();assert.equal(restored.bookings[0].id,state.bookings[0].id);
});
test('Thai booking slots reject elapsed time at Bangkok day boundaries',()=>{
 const {futureSlot,saveBooking}=harness().load('design/care-demo');
 assert(!futureSlot('2026-10-04','09:00',Date.parse('2026-10-04T02:00:00Z')));
 assert(futureSlot('2026-10-04','10:00',Date.parse('2026-10-04T02:00:00Z')));
 assert(!futureSlot('2026-10-04','23:59',Date.parse('2026-10-04T17:00:00Z')));
 assert(!saveBooking({unit:'unit',services:['นวดไทย'],date:'2020-01-01',time:'10:00',rights:'บัตรทอง'}));
});
test('prescriptions and integer stock commit together and reject invalid quantities',()=>{
 const {careDemo,savePrescription}=harness().load('design/care-demo');
 const input={patient:'M01',medicine:'ยาเลือดงาม',dose:'ตามคำสั่งแพทย์',frequency:'07:00 12:00 18:00',duration:3,amount:6};
 for(const amount of [1.5,NaN,-1,41])assert(!savePrescription({...input,amount}));
 assert.equal(careDemo.snapshot().medicines[0].quantity,40);assert.equal(careDemo.snapshot().prescriptions.length,0);
 assert(savePrescription(input));assert.equal(careDemo.snapshot().medicines[0].quantity,34);assert.equal(careDemo.snapshot().prescriptions[0].patient,'M01');
});
test('list and calendar use the same leave, overlap and capability checks',()=>{
 const {appointmentConflict,supportsServices}=harness().load('app/provider/design-preview/appointment-validation');
 const a={id:'a',day:5,month:10,year:2569,time:'10:00',doctor:'doctor',status:'ยืนยันแล้ว'};
 assert(appointmentConflict([a],[],'doctor','2026-11-05','10:30','11:30'));
 assert.equal(appointmentConflict([a],[],'doctor','2026-11-05','11:00','12:00'),'');
 assert.equal(appointmentConflict([a],[],'other','2026-11-05','10:30','11:30'),'');
 assert(appointmentConflict([],[{doctor:'doctor',from:'2026-11-05T09:00',to:'2026-11-05T12:00',reason:'leave'}],'doctor','2026-11-05','10:00','11:00'));
 assert(!supportsServices('doctor','นวดไทย, ประคบสมุนไพร',{doctor:['นวดไทย']}));
});
test('integer department buckets always sum to the scoped headline',()=>{
 const {apportion}=harness().load('app/department/design-preview/summary-logic');
 for(let n=0;n<500;n++){const values=apportion(n,[22,16,11,8,7]);assert.equal(values.reduce((a,b)=>a+b,0),n);assert(values.every(Number.isInteger));}
 assert.deepEqual(Array.from(apportion(64,[22,16,11,8,7])),[22,16,11,8,7]);
});
